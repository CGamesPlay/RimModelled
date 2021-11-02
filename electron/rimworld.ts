import * as path from "path";
import { promises as fs } from "fs";
import { pathToFileURL } from "url";
import asyncPool from "tiny-async-pool";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import xpath from "xpath";
import { z } from "zod";
import { shell } from "electron";

// Note: versions are loaded presently but ignored. So few mods use them that
// it doesn't seem worth the trouble.
export const ModRef = z.union([
  z.object({
    packageId: z.string(),
    operator: z.enum(["==", ">=", "<="]),
    version: z.string(),
  }),
  z.object({
    packageId: z.string(),
  }),
]);
export type ModRef = z.infer<typeof ModRef>;

export const Mod = z.object({
  path: z.string(),
  name: z.string(),
  packageId: z.string(),
  version: z.string().optional(),
  author: z.string(),
  url: z.string().optional(),
  description: z.string().optional(),
  previewURL: z.string().optional(),
  isCritical: z.boolean(),
  deps: z.object({
    engines: z.string().array(),
    requires: ModRef.array(),
    loadBefore: ModRef.array(),
    loadAfter: ModRef.array(),
    incompatibilities: ModRef.array(),
  }),
});
export type Mod = z.infer<typeof Mod>;

export const Rimworld = z.object({
  paths: z.object({
    mods: z.string().array(),
    data: z.string(),
    lib: z.string(),
  }),
  version: z.string(),
  mods: Mod.array(),
  activeModIDs: z.string().array(),
  gameSaves: z.string().array(),
});
export type Rimworld = z.infer<typeof Rimworld>;

/// Number of mods to be loading at the same time.
const loadConcurrency = 10;

/// Return the text content of the first matching node.
function x(expr: string, doc: Node | undefined): string | undefined {
  if (!doc) return undefined;
  // @ts-expect-error the expr MUST select a node or else this crashes
  const node: Node | undefined = xpath.select(expr, doc)[0];
  return node?.textContent || undefined;
}

// Return the text content of all matching nodes.
function xs(expr: string, doc: Node | undefined): string[] {
  if (!doc) return [];
  // @ts-expect-error the expr MUST select nodes or else this crashes
  const node: Node[] = xpath.select(expr, doc);
  return node.map((n) => n.textContent).filter((x): x is string => !!x);
}

// Return the text content of all matching nodes of the first expression with
// any matching nodes.
function xsFallback(exprs: string[], doc: Node | undefined): string[] {
  for (const expr of exprs) {
    const ret = xs(expr, doc);
    if (ret.length != 0) return ret;
  }
  return [];
}

function checkMod(val: unknown): Mod {
  const ret = Mod.safeParse(val);
  if (ret.success) return ret.data;
  console.warn("Failed to fully load mod", ret.error);
  // lol, proceed anyways
  return val as Mod;
}

function checkRimworld(val: unknown): Rimworld {
  // We suppress mods errors because they are reported in checkMod.
  const schema = Rimworld.extend({ mods: z.any().array() });
  const ret = schema.safeParse(val);
  if (ret.success) return ret.data;
  console.warn("Failed to load Rimworld", ret.error);
  // lol, proceed anyways
  return val as Rimworld;
}

const knownEntities: Record<string, string> = {
  "&amp;": "&",
  "&gt;": ">",
  "&lt;": "<",
};
function unescapeEntities(str: string | undefined): string | undefined {
  if (str === undefined) return undefined;
  return str.replace(
    /&[#a-z0-9]+;/g,
    (entity) => knownEntities[entity] ?? entity
  );
}

export async function loadRimworld(): Promise<Rimworld> {
  const rimworld: Rimworld = {
    paths: {
      mods: [
        path.join(
          process.env["HOME"]!,
          "Library/Application Support/Steam/steamapps/common/RimWorld/RimWorldMac.app/Data"
        ),
        path.join(
          process.env["HOME"]!,
          "Library/Application Support/Steam/steamapps/common/RimWorld/RimWorldMac.app/Mods"
        ),
        path.join(
          process.env["HOME"]!,
          "Library/Application Support/Steam/steamapps/workshop/content/294100"
        ),
      ],
      data: path.join(
        process.env["HOME"]!,
        "Library/Application Support/RimWorld"
      ),
      lib: path.join(
        process.env["HOME"]!,
        "Library/Application Support/Steam/steamapps/common/RimWorld/RimWorldMac.app"
      ),
    },
    mods: [],
    version: undefined as any,
    activeModIDs: [],
    gameSaves: [],
  };
  await readVersion(rimworld);
  await scanMods(rimworld);
  await readModConfig(rimworld);
  await scanGameSaves(rimworld);
  return checkRimworld(rimworld);
}

export function launchRimworld(_rimworld: Rimworld): void {
  shell.openExternal(`steam://run/294100`);
}

async function readVersion(rimworld: Rimworld) {
  const versionPath = path.join(rimworld.paths.lib, "Version.txt");
  const versionText = await fs.readFile(versionPath, "utf-8");
  const version = versionText.match(/^\d+\.\d+/)?.[0];
  if (version) rimworld.version = version;
}

async function scanMods(rimworld: Rimworld) {
  const allPaths: string[] = [];
  for (const modCollection of rimworld.paths.mods) {
    const items = await fs.readdir(modCollection, { withFileTypes: true });
    for (const modDir of items) {
      if (!modDir.isDirectory()) continue;
      allPaths.push(path.join(modCollection, modDir.name));
    }
  }
  await asyncPool(loadConcurrency, allPaths, async (modPath: string) => {
    const mod = await loadMod(rimworld.version, modPath);
    if (!mod) return;
    rimworld.mods.push(mod);
  });
}

async function loadMod(
  version: string,
  modPath: string
): Promise<Mod | undefined> {
  let about: Node, manifest: Node | undefined;
  try {
    const aboutPath = path.join(modPath, "About", "About.xml");
    const aboutXML = await fs.readFile(aboutPath, "utf-8");
    about = new DOMParser().parseFromString(aboutXML, "text/xml");
  } catch (e) {
    if (e.code === "ENOENT") {
      // If the directory isn't a mod, just ignore it.
      return undefined;
    } else {
      throw e;
    }
  }
  try {
    const manifestPath = path.join(modPath, "About", "Manifest.xml");
    const manifestXML = await fs.readFile(manifestPath, "utf-8");
    manifest = new DOMParser().parseFromString(manifestXML, "text/xml");
  } catch (e) {
    if (e.code === "ENOENT") {
      // Mod doesn't have a manifest, no big deal.
    } else {
      throw e;
    }
  }
  const previewPath = path.join(modPath, "About", "Preview.png");
  const hasPreview = await fs
    .access(previewPath)
    .then(() => true)
    .catch(() => false);
  const packageId = x("/ModMetaData/packageId", about)?.toLowerCase();
  const deps = loadModDeps(version, about, manifest);
  return checkMod({
    path: modPath,
    name: x("/ModMetaData/name", about) ?? path.basename(modPath),
    packageId: x("/ModMetaData/packageId", about)?.toLowerCase(),
    version: x("/Manifest/version", manifest),
    author: xs("/ModMetaData/author | /ModMetaData/authors/li", about).join(
      ", "
    ),
    url: x("/ModMetaData/url", about),
    description: unescapeEntities(
      unescapeEntities(
        x(
          `/ModMetaData/descriptionsByVersion/v${version} | /ModMetaData/description`,
          about
        )
      )
    ),
    previewURL: hasPreview ? pathToFileURL(previewPath).href : undefined,
    isCritical: packageId === "ludeon.rimworld",
    deps,
  });
}

function loadModDeps(
  version: string,
  about: Node,
  manifest: Node | undefined
): Mod["deps"] {
  const engines = xs("/ModMetaData/supportedVersions/li", about);
  const requires = ([] as string[]).concat(
    xs("/Manifest/dependencies/li", manifest),
    xsFallback(
      [
        `/ModMetaData/modDependenciesByVersion/v${version}/li/packageId`,
        "/ModMetaData/modDependencies/li/packageId",
      ],
      about
    )
  );
  const loadBefore = ([] as string[]).concat(
    xs("/Manifest/loadBefore/li", manifest),
    xsFallback(
      [
        `/ModMetaData/loadBeforeByVersion/v${version}/li | /ModMetaData/forceLoadBefore/li`,
        "/ModMetaData/loadBefore/li | /ModMetaData/forceLoadBefore/li",
      ],
      about
    )
  );
  const loadAfter = ([] as string[]).concat(
    xs("/Manifest/loadAfter/li", manifest),
    xsFallback(
      [
        `/ModMetaData/loadAfterByVersion/v${version}/li | /ModMetaData/forceLoadAfter/li`,
        "/ModMetaData/loadAfter/li | /ModMetaData/forceLoadAfter/li",
      ],
      about
    )
  );
  const incompatibilities = ([] as string[]).concat(
    xs("/Manifest/incompatibleWith/li", manifest),
    xsFallback(
      [
        `/ModMetaData/incompatibleWithByVersion/v${version}/li`,
        "/ModMetaData/incompatibleWith/li",
      ],
      about
    )
  );
  return {
    engines,
    requires: parseModRefs(requires),
    loadBefore: parseModRefs(loadBefore),
    loadAfter: parseModRefs(loadAfter),
    incompatibilities: parseModRefs(incompatibilities),
  };
}

function parseModRefs(input: string[]): ModRef[] {
  const refs = input.map((refStr): ModRef => {
    refStr = refStr.toLowerCase();
    if (refStr === "core") refStr = "ludeon.rimworld";
    const parts = refStr.split(" ");
    if (parts.length === 1) return { packageId: refStr };
    return {
      packageId: parts[0],
      operator: parts[1] as "==" | ">=" | "<=",
      version: parts[2],
    };
  });
  for (let i = 0; i < refs.length; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      if (refs[i].packageId === refs[j].packageId) {
        // Deduping
        if (!("version" in refs[i]) && "version" in refs[j]) {
          // Replace i with j
          refs[i] = refs[j];
        }
        // Remove the duplicate
        refs.splice(j, 1);
      }
    }
  }
  return refs;
}

async function readModConfig(rimworld: Rimworld) {
  let modConfig: Node;
  try {
    const configPath = path.join(
      rimworld.paths.data,
      "Config",
      "ModsConfig.xml"
    );
    const configXML = await fs.readFile(configPath, "utf-8");
    modConfig = new DOMParser().parseFromString(configXML, "text/xml");
  } catch (e) {
    console.warn("Cannot load active mod list:", e);
    return;
  }
  rimworld.activeModIDs = xs("/ModsConfigData/activeMods/li", modConfig);
}

async function scanGameSaves(rimworld: Rimworld) {
  const saveDir = path.join(rimworld.paths.data, "Saves");
  let items = await fs.readdir(saveDir);
  items = items.filter((i) => i.endsWith(".rws"));
  const stats = await asyncPool(
    loadConcurrency,
    items,
    async (name: string) => {
      const filename = path.join(saveDir, name);
      const stat = await fs.stat(filename);
      return { filename, stat };
    }
  );
  stats.sort((a, b) => b.stat.mtime.valueOf() - a.stat.mtime.valueOf());
  const saves = stats.map((i) => path.basename(i.filename, ".rws"));
  rimworld.gameSaves = saves;
}

export async function readModsFromSave(
  rimworld: Rimworld,
  name: string
): Promise<string[] | undefined> {
  const savePath = path.join(rimworld.paths.data, "Saves", `${name}.rws`);
  let save: Node;
  try {
    const saveXML = await fs.readFile(savePath, "utf-8");
    save = new DOMParser().parseFromString(saveXML, "text/xml");
  } catch (e) {
    // Can't load this save; not critical
    console.warn("Failed to load save", savePath, e.message);
    return undefined;
  }
  const mods = xs("/savegame/meta/modIds/li", save);
  return mods;
}

export async function setActiveMods(
  rimworld: Rimworld,
  ids: string[],
  { launchAfter = false }: { launchAfter?: boolean }
): Promise<void> {
  const configPath = path.join(rimworld.paths.data, "Config", "ModsConfig.xml");
  let configXML = await fs.readFile(configPath, "utf-8");
  const modConfig = new DOMParser().parseFromString(configXML, "text/xml");
  const activeMods = xpath.select(
    "/ModsConfigData/activeMods",
    modConfig
  )[0]! as Node;
  while (activeMods.firstChild) {
    activeMods.removeChild(activeMods.firstChild);
  }
  ids.forEach((id) => {
    const newline = modConfig.createTextNode("\n    ");
    activeMods.appendChild(newline);
    const li = modConfig.createElement("li");
    li.textContent = id;
    activeMods.appendChild(li);
  });
  const newline = modConfig.createTextNode("\n  ");
  activeMods.appendChild(newline);
  configXML = new XMLSerializer().serializeToString(modConfig);
  await fs.writeFile(configPath, configXML, "utf-8");
  if (launchAfter) launchRimworld(rimworld);
}
