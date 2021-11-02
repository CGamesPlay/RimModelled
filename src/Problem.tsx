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

export function listProblems(
  mods: Array<[string, boolean]>,
  index: Record<string, Mod>,
  rimworldVersion: string
): Problem[] {
  const result: Problem[] = [];
  const modIDs = mods.filter((t) => t[1]).map((t) => t[0]);
  const modOrder = Object.fromEntries(modIDs.map((id, i) => [id, i]));

  modIDs.forEach((packageId, i) => {
    const mod = index[packageId];

    if (
      mod.deps.engines.length > 0 &&
      !mod.deps.engines.includes(rimworldVersion)
    ) {
      result.push({ packageId, type: "badEngine", otherPackageId: "" });
    }

    mod.deps.requires.forEach((ref) => {
      if (!(modOrder[ref.packageId] < i)) {
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
      if (!(modOrder[ref.packageId] < i)) {
        result.push({
          packageId,
          type: "wantsAfter",
          otherPackageId: ref.packageId,
        });
      }
    });

    mod.deps.loadBefore.forEach((ref) => {
      if (!(ref.packageId in modOrder)) return;
      if (!(modOrder[ref.packageId] > i)) {
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

export function sortMods(
  mods: Array<[string, boolean]>,
  index: Record<string, Mod>
): Array<[string, boolean]> {
  type Node = {
    id: string;
    enabled: boolean;
    deps: string[];
    visited: boolean;
  };
  const nodes = new Map<string, Node>(
    mods.map(([id, enabled]) => [id, { id, enabled, deps: [], visited: false }])
  );
  function getNode(id: string): Node {
    let node = nodes.get(id);
    if (node) return node;
    // This must be a reference to a mod which isn't installed.
    node = { id, enabled: false, deps: [], visited: false };
    nodes.set(id, node);
    return node;
  }

  mods.forEach(([id, _]) => {
    const mod = index[id];
    if (!mod) return;
    const node = getNode(id);

    mod.deps.requires.forEach((ref) => {
      node.deps.push(ref.packageId);
    });

    mod.deps.loadAfter.forEach((ref) => {
      node.deps.push(ref.packageId);
    });

    mod.deps.loadBefore.forEach((ref) => {
      getNode(ref.packageId).deps.push(id);
    });
  });

  const result: Node[] = [];
  function visit(node: Node) {
    if (node.visited) return;
    node.visited = true;
    node.deps.forEach((n) => visit(getNode(n)));
    result.push(node);
  }
  mods.forEach((t) => visit(getNode(t[0])));

  return result.map((n) => [n.id, n.enabled]);
}
