import * as path from "path";
import { promises as fs } from "fs";
import { z } from "zod";

import { logger } from "./logging";
import { locateItem } from "../src/treeUtils";
import { RimworldPaths } from "./directories";

export const ModList = z.object({
  name: z.string(),
  // Tuple of [packageId, enabled]
  mods: z.tuple([z.string(), z.boolean()]).array(),
});

export type ModList = z.infer<typeof ModList>;

export const ModTreeItem = z.object({
  type: z.literal("item"),
  id: z.string(),
  notes: z.string().optional(),
});
export type ModTreeItem = z.infer<typeof ModTreeItem>;

export type ModTreeFolder = {
  type: "folder";
  name: string;
  nodes: ModTree[];
  notes?: string;
};
export const ModTreeFolder: z.ZodSchema<ModTreeFolder> = z.lazy(() =>
  z.object({
    type: z.literal("folder"),
    name: z.string(),
    nodes: ModTree.array(),
    notes: z.string().optional(),
  })
);

export const ModTree = z.union([ModTreeItem, ModTreeFolder]);
export type ModTree = z.infer<typeof ModTree>;

export const UserData = z.object({
  lists: ModList.array(),
  tree: ModTreeFolder,
});

export type UserData = z.infer<typeof UserData> & { tree: ModTreeFolder };

export async function loadUserData(
  paths: RimworldPaths,
  rimworld: Rimworld
): Promise<UserData> {
  let userData: UserData | undefined = undefined;
  try {
    const configPath = path.join(paths.data, "rimmodelled.json");
    const configData = await fs.readFile(configPath, "utf-8");
    userData = JSON.parse(configData);
    const ret = UserData.safeParse(userData);
    if (!ret.success) {
      logger.warn("RimModelled user data has errors", {
        input: userData,
        error: ret.error,
      });
    }
  } catch (error: any) {
    logger.warn("Could not load RimModelled user data", { error });
  }
  let coreFolder: ModTreeFolder;
  let modsFolder: ModTreeFolder;
  if (userData) {
    const coreLoc = locateItem(userData.tree, "ludeon.rimworld");
    coreFolder = coreLoc ? coreLoc[0] : userData.tree;
    modsFolder =
      userData.tree.nodes.find(
        (n): n is ModTreeFolder =>
          n.type === "folder" && n.name === "Uncategorized"
      ) ?? userData.tree;
  } else {
    coreFolder = { type: "folder", name: "RimWorld Official", nodes: [] };
    modsFolder = { type: "folder", name: "Uncategorized", nodes: [] };
    userData = {
      lists: [],
      tree: {
        type: "folder",
        name: "All Mods",
        nodes: [coreFolder, modsFolder],
      },
    };
  }

  // Ensure all mods are in the tree
  rimworld.mods.forEach((mod: Mod) => {
    if (locateItem(userData!.tree, mod.packageId)) return;
    if (mod.packageId.indexOf("ludeon.") === 0) {
      coreFolder.nodes.push({ type: "item", id: mod.packageId });
    } else {
      modsFolder.nodes.push({ type: "item", id: mod.packageId });
    }
  });

  // Remove any mods which have been uninstalled.
  const allMods = new Set(rimworld.mods.map((m) => m.packageId));
  function cleanFolder(tree: ModTreeFolder) {
    let i = 0;
    while (i < tree.nodes.length) {
      const node = tree.nodes[i];
      if (node.type === "item" && !allMods.has(node.id)) {
        tree.nodes.splice(i, 1);
        continue;
      }
      if (node.type === "folder") {
        cleanFolder(node);
      }
      i++;
    }
  }
  cleanFolder(userData.tree);

  return userData;
}

export async function saveUserData(
  paths: RimworldPaths,
  userData: UserData
): Promise<void> {
  const configPath = path.join(paths.data, "rimmodelled.json");
  await fs.writeFile(configPath, JSON.stringify(userData, null, 2), "utf-8");
}
