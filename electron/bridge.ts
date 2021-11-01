import { contextBridge } from "electron";

import {
  loadRimworld,
  setActiveMods,
  readModsFromSave,
  Rimworld,
} from "./rimworld";
import { loadUserData, saveUserData, UserData } from "./userData";

let _rimworld: Rimworld | undefined = undefined;
const rimworld = (): Rimworld => {
  if (!_rimworld) throw new Error("Internal error: rimworld not loaded");
  return _rimworld;
};

export const api = {
  async load(): Promise<Rimworld> {
    _rimworld = await loadRimworld();
    return _rimworld;
  },
  loadUserData(): Promise<UserData> {
    return loadUserData(rimworld());
  },
  setActiveMods(
    ids: string[],
    opts: { launchAfter?: boolean } = {}
  ): Promise<void> {
    return setActiveMods(rimworld(), ids, opts);
  },
  saveUserData(input: UserData): Promise<void> {
    const data = UserData.parse(input);
    return saveUserData(rimworld(), data);
  },
  readModsFromSave(name: string): Promise<string[] | undefined> {
    return readModsFromSave(rimworld(), name.replace(/[/\\:]/g, ""));
  },
};

contextBridge.exposeInMainWorld("RimModelled", api);
