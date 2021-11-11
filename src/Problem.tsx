export type ProblemType =
  | "missing"
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

/// List the problems associated with the single mod listed. This will identify
/// incompatibilities with enabled mods and engine versions, but does not
/// examine the load order.
export function listModProblems(
  packageId: string,
  mods: Array<[string, boolean]>,
  index: Record<string, Mod>,
  rimworldVersion: string
): Problem[] {
  const result: Problem[] = [];

  const mod = index[packageId];
  if (!mod) {
    return [{ packageId, type: "missing", otherPackageId: "" }];
  }

  if (
    mod.deps.engines.length > 0 &&
    !mod.deps.engines.includes(rimworldVersion)
  ) {
    result.push({ packageId, type: "badEngine", otherPackageId: "" });
  }

  mod.deps.incompatibilities.forEach((ref) => {
    const mod = mods.find((t) => t[0] === ref.packageId && t[1]);
    if (mod) {
      result.push({
        packageId,
        type: "incompatibleWith",
        otherPackageId: ref.packageId,
      });
    }
  });

  return result;
}

export function listProblems(
  mods: Array<[string, boolean]>,
  index: Record<string, Mod>,
  rimworldVersion: string
): Problem[] {
  const result: Problem[] = [];
  const modIDs = mods.filter((t) => t[1]).map((t) => t[0]);
  const modOrder = Object.fromEntries(modIDs.map((id, i) => [id, i]));

  modIDs.forEach((packageId, i) => {
    result.splice(
      result.length,
      0,
      ...listModProblems(packageId, mods, index, rimworldVersion)
    );

    const mod = index[packageId];
    if (!mod) {
      return;
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
  });

  return result;
}

export function sortMods(
  mods: Array<[string, boolean]>,
  index: Record<string, Mod>,
  rimworldVersion: string
): Array<[string, boolean]> {
  type Node = {
    id: string;
    enabled: boolean;
    deps: Array<{ id: string; required: boolean }>;
    visited: boolean;
  };
  const nodes = new Map<string, Node>(
    mods.map(([id, _]) => [
      id,
      { id, enabled: false, deps: [], visited: false },
    ])
  );
  function getNode(id: string): Node {
    let node = nodes.get(id);
    if (node) return node;
    // This must be a reference to a mod which isn't activated.
    node = { id, enabled: false, deps: [], visited: false };
    nodes.set(id, node);
    return node;
  }

  Object.values(index).forEach((mod) => {
    const node = getNode(mod.packageId);

    mod.deps.requires.forEach((ref) => {
      node.deps.push({ id: ref.packageId, required: true });
    });

    mod.deps.loadAfter.forEach((ref) => {
      node.deps.push({ id: ref.packageId, required: false });
    });

    mod.deps.loadBefore.forEach((ref) => {
      getNode(ref.packageId).deps.push({ id: mod.packageId, required: false });
    });
  });

  const result: Node[] = [];
  function visit(node: Node) {
    if (node.visited) return;
    node.visited = true;
    node.deps.forEach((n) => visit(getNode(n.id)));
    result.push(node);
  }
  function enable(node: Node) {
    if (node.enabled) return;
    node.enabled = true;
    node.deps.forEach((n) => {
      if (n.required) enable(getNode(n.id));
    });
  }
  mods.forEach(([id, enabled]) => {
    const node = getNode(id);
    visit(node);
    if (enabled) enable(node);
  });

  return result.map((n) => {
    const mod = index[n.id];
    // Filter out incompatible mods.
    if (
      mod &&
      mod.deps.engines.length > 0 &&
      !mod.deps.engines.includes(rimworldVersion)
    ) {
      n.enabled = false;
    }

    return [n.id, n.enabled];
  });
}
