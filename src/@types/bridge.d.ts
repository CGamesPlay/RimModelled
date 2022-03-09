import { api } from "../../electron/bridge";

declare global {
  // eslint-disable-next-line
  interface Window {
    RimModelled: typeof api;
  }

  type DirectoryConfig = import("../../electron/directories").DirectoryConfig;
  type RimworldPaths = import("../../electron/directories").RimworldPaths;
  type Rimworld = import("../../electron/rimworld").Rimworld;
  type Mod = import("../../electron/rimworld").Mod;
  type UserData = import("../../electron/userData").UserData;
  type ModTree = import("../../electron/userData").ModTree;
  type ModTreeFolder = import("../../electron/userData").ModTreeFolder;
  type ModTreeItem = import("../../electron/userData").ModTreeItem;
  type ModList = import("../../electron/userData").ModList;
}
