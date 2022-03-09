import { contextBridge, clipboard, ipcRenderer } from "electron";

import {
  loadDirectoryConfig,
  getRimworldPaths,
  DirectoryConfig,
  RimworldPaths,
} from "./directories";
import {
  loadRimworld,
  setActiveMods,
  readModsFromSave,
  Rimworld,
} from "./rimworld";
import { logger, LogEntry } from "./logging";
import { loadUserData, saveUserData, UserData } from "./userData";

type ValidAppState = {
  state: "valid";
  dirs: DirectoryConfig;
  paths: RimworldPaths;
  rimworld: Rimworld;
  userData: UserData;
};
type AppState =
  | { state: "no_config"; error: Error }
  | {
      state: "invalid_config";
      dirs: DirectoryConfig;
      error: Error;
    }
  | {
      state: "invalid_rimworld";
      dirs: DirectoryConfig;
      paths: RimworldPaths;
      error: Error;
    }
  | ValidAppState;

let state: AppState;
function getState(): ValidAppState {
  if (state.state === "valid") {
    return state;
  }
  throw new Error(
    `internal error: state should be valid but is ${state.state}`
  );
}

export const api = {
  setDirtyState(isDirty: boolean): void {
    ipcRenderer.send("isDirty", isDirty);
  },
  async load(): Promise<AppState> {
    let dirs: DirectoryConfig;
    let paths: RimworldPaths;
    let rimworld: Rimworld;
    try {
      dirs = loadDirectoryConfig();
    } catch (error: any) {
      state = { state: "no_config", error };
      return state;
    }
    try {
      paths = getRimworldPaths(dirs);
    } catch (error: any) {
      state = { state: "invalid_config", dirs, error };
      return state;
    }
    try {
      rimworld = await loadRimworld(paths);
    } catch (error: any) {
      state = { state: "invalid_rimworld", dirs, paths, error };
      return state;
    }
    const userData = await loadUserData(paths, rimworld);
    state = { state: "valid", dirs, paths, rimworld, userData };
    return state;
  },
  setActiveMods(
    ids: string[],
    opts: { launchAfter?: boolean } = {}
  ): Promise<void> {
    return setActiveMods(getState().paths, getState().rimworld, ids, opts);
  },
  saveUserData(input: UserData): Promise<void> {
    const data = UserData.parse(input);
    return saveUserData(getState().paths, data);
  },
  readModsFromSave(name: string): Promise<string[] | undefined> {
    return readModsFromSave(
      getState().paths,
      getState().rimworld,
      name.replace(/[/\\:]/g, "")
    );
  },
  writeClipboardText(value: string): void {
    clipboard.writeText(value);
  },
  readClipboardText(): string {
    return clipboard.readText();
  },

  log(message: LogEntry): void {
    logger.log(message);
  },
};

contextBridge.exposeInMainWorld("RimModelled", api);
