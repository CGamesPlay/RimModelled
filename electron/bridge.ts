import { contextBridge, clipboard, ipcRenderer, shell } from "electron";

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
  setDirtyState(isDirty: boolean): void {
    ipcRenderer.send("isDirty", isDirty);
  },
  openExternal(url: string): void {
    shell.openExternal(url);
  },
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
  writeClipboardText(value: string): void {
    clipboard.writeText(value);
  },
  readClipboardText(): string {
    return clipboard.readText();
  },
};

contextBridge.exposeInMainWorld("RimModelled", api);
