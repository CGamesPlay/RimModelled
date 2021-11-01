export function locateFolder(
  tree: ModTreeFolder,
  path: string
): ModTreeFolder | undefined {
  if (path.length <= 4) return tree;
  const idx = path.indexOf(":", 4);
  if (idx === -1) return tree;
  const components = path.slice(idx + 1).split(":");
  return components.reduce(
    (node: ModTreeFolder | undefined, name: string) =>
      node?.type === "folder"
        ? node.nodes.find(
            (n): n is ModTreeFolder => n.type === "folder" && n.name === name
          )
        : undefined,
    tree
  );
}

export function locateItem(
  tree: ModTreeFolder,
  pathOrId: string
): [ModTreeFolder, number] | undefined {
  if (pathOrId.startsWith("dir:")) {
    const dirname = pathOrId.substring(0, pathOrId.lastIndexOf(":"));
    const basename = pathOrId.substring(dirname.length + 1);
    const parent = locateFolder(tree, dirname);
    if (!parent) return undefined;
    const index = parent.nodes.findIndex(
      (n) => n.type === "folder" && n.name == basename
    );
    if (index === -1) return undefined;
    return [parent, index];
  } else {
    const find = (node: ModTreeFolder): [ModTreeFolder, number] | undefined => {
      for (let i = 0; i < node.nodes.length; i++) {
        const child = node.nodes[i];
        if (child.type === "folder") {
          const loc = find(child);
          if (loc) return loc;
        } else if (child.id === pathOrId) {
          return [node, i];
        }
      }
    };
    return find(tree);
  }
}
