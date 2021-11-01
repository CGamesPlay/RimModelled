import * as path from "path";
import { promises as fs } from "fs";
import { pathToFileURL } from "url";
import asyncPool from "tiny-async-pool";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import xpath from "xpath";
import { z } from "zod";
import { shell } from "electron";

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
});
export type Mod = z.infer<typeof Mod>;

export const Rimworld = z.object({
  paths: z.object({
    mods: z.string().array(),
    data: z.string(),
    bin: z.string(),
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
  // @ts-expect-error the expr MUST select a node or else this crashes
  const node: Node[] = xpath.select(expr, doc);
  return node.map((n) => n.textContent).filter((x): x is string => !!x);
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
      bin: path.join(
        process.env["HOME"]!,
        "Library/Application Support/Steam/steamapps/common/RimWorld/RimWorldMac.app"
      ),
    },
    mods: [],
    version: undefined as any,
    activeModIDs: [],
    gameSaves: [],
  };
  await scanMods(rimworld);
  await readModConfig(rimworld);
  await scanGameSaves(rimworld);
  return checkRimworld(rimworld);
}

export function launchRimworld(_rimworld: Rimworld): void {
  shell.openExternal(`steam://run/294100`);
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
    const mod = await loadMod(modPath);
    if (!mod) return;
    rimworld.mods.push(mod);
  });
}

async function loadMod(modPath: string): Promise<Mod | undefined> {
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
  return checkMod({
    path: modPath,
    name: x("/ModMetaData/name", about) ?? path.basename(modPath),
    packageId: x("/ModMetaData/packageId", about)?.toLowerCase(),
    version: x("/Manifest/version", manifest),
    author: x("/ModMetaData/author", about),
    url: x("/ModMetaData/url", about),
    description: x("/ModMetaData/description", about),
    previewURL: hasPreview ? pathToFileURL(previewPath).href : undefined,
    isCritical: packageId === "ludeon.rimworld",
  });
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
  rimworld.version = x("/ModsConfigData/version", modConfig)?.replace(
    /^(\d+\.\d+).*$/,
    "$1"
  ) as string;
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
