import { useEffect, useCallback, useState, useMemo } from "react";
import { produce } from "immer";

import { locateItem, locateFolder } from "./treeUtils";

export type ProblemType =
  | "badEngine"
  | "incompatibleWith"
  | "wantsBefore"
  | "wantsAfter"
  | "requires";

export type Problem = {
  packageId: string;
  type: ProblemType;
  otherPackageId: string;
};

export type RimworldState = UserData & {
  rimworld: Rimworld;
  index: Record<string, Mod>;
  currentMods: Array<[string, boolean]>;
  problems: Problem[];
};

export type MaybeLoaded<State> =
  | { loaded: false; error?: string }
  | { loaded: true; state: State };

function listProblems(state: RimworldState): Problem[] {
  const result: Problem[] = [];
  const modIDs = state.currentMods.filter((t) => t[1]).map((t) => t[0]);
  const modOrder = Object.fromEntries(modIDs.map((id, i) => [id, i]));

  modIDs.forEach((packageId, index) => {
    const mod = state.index[packageId];

    if (
      mod.deps.engines.length > 0 &&
      !mod.deps.engines.includes(state.rimworld.version)
    ) {
      result.push({ packageId, type: "badEngine", otherPackageId: "" });
    }

    mod.deps.requires.forEach((ref) => {
      if (!(modOrder[ref.packageId] < index)) {
        result.push({
          packageId,
          type: "requires",
          otherPackageId: ref.packageId,
        });
      }
    });

    mod.deps.loadAfter.forEach((ref) => {
      // Avoid showing duplicate errors from base dependencies
      if (mod.deps.requires.find((r) => r.packageId === ref.packageId)) return;
      if (!(ref.packageId in modOrder)) return;
      if (!(modOrder[ref.packageId] < index)) {
        result.push({
          packageId,
          type: "wantsAfter",
          otherPackageId: ref.packageId,
        });
      }
    });

    mod.deps.loadBefore.forEach((ref) => {
      if (!(ref.packageId in modOrder)) return;
      if (!(modOrder[ref.packageId] > index)) {
        result.push({
          packageId,
          type: "wantsBefore",
          otherPackageId: ref.packageId,
        });
      }
    });

    mod.deps.incompatibilities.forEach((ref) => {
      if (ref.packageId in modOrder) {
        result.push({
          packageId,
          type: "incompatibleWith",
          otherPackageId: ref.packageId,
        });
      }
    });
  });

  return result;
}

const actions = {
  enableMod(state: RimworldState, modID: string, loaded: boolean) {
    if (!loaded) {
      // Disabling a critical module is ignored
      const mod = state.rimworld.mods.find((m) => m.packageId === modID);
      if (mod?.isCritical) return;
    }
    const position = state.currentMods.findIndex((t) => t[0] === modID);
    if (position === -1) {
      if (loaded) {
        state.currentMods.push([modID, true]);
      }
    } else {
      state.currentMods[position][1] = loaded;
    }
    state.problems = listProblems(state);
  },

  changeLoadOrder(state: RimworldState, modID: string, position: number) {
    const oldPosition = state.currentMods.findIndex((t) => t[0] === modID);
    if (position < 0) position = 0;
    if (oldPosition !== -1) state.currentMods.splice(oldPosition, 1);
    if (oldPosition < position) position--;
    state.currentMods.splice(position, 0, [modID, true]);
    state.problems = listProblems(state);
  },

  replaceCurrentMods(state: RimworldState, nextMods: Array<[string, boolean]>) {
    state.currentMods = nextMods;
    state.problems = listProblems(state);
  },

  saveModList(
    state: RimworldState,
    name: string,
    mods: Array<[string, boolean]>
  ) {
    const existing = state.lists.findIndex((l) => l.name === name);
    if (existing !== -1) state.lists.splice(existing, 1);
    state.lists.unshift({ name, mods });
  },

  deleteModList(state: RimworldState, name: string) {
    const existing = state.lists.findIndex((l) => l.name === name);
    if (existing !== -1) state.lists.splice(existing, 1);
  },

  addFolder(state: RimworldState, name: string) {
    const rootNodes = (state.tree as any).nodes as ModTree[];
    rootNodes.push({ type: "folder", name, nodes: [] });
  },

  renameFolder(state: RimworldState, path: string, name: string) {
    const foundNode = locateFolder(state.tree, path);
    if (foundNode) foundNode.name = name;
  },

  removeFolder(state: RimworldState, path: string) {
    const loc = locateItem(state.tree, path);
    if (!loc) return;
    const [parent, idx] = loc;
    const node = parent.nodes[idx] as ModTreeFolder;
    parent.nodes.splice(idx, 1, ...node.nodes);
  },

  moveNode(state: RimworldState, srcPath: string, destPath: string) {
    const srcLoc = locateItem(state.tree, srcPath);
    if (!srcLoc) return;
    const dest = locateFolder(state.tree, destPath);
    if (!dest) return;
    const src = srcLoc[0].nodes[srcLoc[1]];
    srcLoc[0].nodes.splice(srcLoc[1], 1);
    dest.nodes.push(src);
  },

  setNodeNotes(state: RimworldState, path: string, notes: string) {
    const loc = locateItem(state.tree, path);
    if (!loc) return;
    const node = loc[0].nodes[loc[1]];
    if (notes === "") delete node.notes;
    else node.notes = notes;
  },
};

type StateUpdateFunc<F> = F extends (x: any, ...args: infer P) => unknown
  ? (...args: P) => void
  : never;

export type Actions = {
  [name in keyof typeof actions]: StateUpdateFunc<typeof actions[name]>;
} & {
  reload(): void;
};

export default function useRimworld(): [MaybeLoaded<RimworldState>, Actions] {
  const [state, setState] = useState<MaybeLoaded<RimworldState>>({
    loaded: false,
  });

  const reload = useCallback(async () => {
    try {
      setState({ loaded: false });
      const rimworld = await window.RimModelled.load();
      const userData = await window.RimModelled.loadUserData();
      const index: Record<string, Mod> = {};
      for (const m of rimworld.mods) {
        index[m.packageId] = m;
      }
      const currentMods = rimworld.activeModIDs.map(
        (modID) => [modID, true] as [string, boolean]
      );
      const state: RimworldState = {
        rimworld,
        ...userData,
        index,
        currentMods,
        problems: [],
      };
      state.problems = listProblems(state);
      setState({ loaded: true, state });
    } catch (e) {
      setState({ loaded: false, error: e.message });
      throw e;
    }
  }, [setState]);

  useEffect(() => {
    reload();
  }, []);

  const boundActions = useMemo(() => {
    const boundActions: Actions = {} as any;
    for (const k in actions) {
      (boundActions as any)[k] = (...args: any[]) => {
        const baseProducer = produce((actions as any)[k]);
        const producer = produce((s: MaybeLoaded<RimworldState>) => {
          if (!s.loaded) return s;
          const result = baseProducer(s.state, ...args);
          return { loaded: true, state: result };
        });
        setState(producer);
      };
    }
    boundActions.reload = reload;
    return boundActions;
  }, [setState]);

  return [state, boundActions];
}
