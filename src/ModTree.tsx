import { useState, useCallback } from "react";
import { useId } from "react-id-generator";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tree, { TreeNode } from "rc-tree";
import { DataNode } from "rc-tree/lib/interface";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

import { RimworldState } from "./useRimworld";
import { FolderNameDialog } from "./FolderDetails";

import "rc-tree/assets/index.css";

type Props = {
  state: RimworldState;
  selectedModID: string | undefined;
  onSelectMod(id: string): void;
  onEnableMod(id: string, loaded: boolean): void;
  onAddFolder(name: string): void;
  onMoveNode(name: string, path: string): void;
};

export default function ModTree({
  state,
  selectedModID,
  onSelectMod,
  onEnableMod,
  onAddFolder,
  onMoveNode,
}: Props): React.ReactElement {
  const [filter, setFilterBase] = useState<string>("");
  // Map of keys which are filtered. The value indicates a direct match (true)
  // or a match of a child (false).
  const [expandedKeys, setExpandedKeys] = useState<Map<string, boolean>>(
    new Map([[`dir:${state.tree.name}`, true]])
  );

  function renderTreeChildren(
    nodes: ModTree[],
    path: string,
    alwaysShow: boolean
  ) {
    return nodes
      .slice(0)
      .sort((a, b) => compareNodes(a, b, state))
      .map((c) => renderTree(c, path, alwaysShow));
  }

  function renderTree(tree: ModTree, path: string, alwaysShow = false) {
    const key = tree.type === "folder" ? `${path}:${tree.name}` : tree.id;
    if (filter !== "" && !expandedKeys.has(key) && !alwaysShow) {
      return null;
    }
    if (tree.type === "folder") {
      const isExpanded = expandedKeys.get(key) === true || alwaysShow;
      return (
        <TreeNode title={tree.name} key={key} isLeaf={false}>
          {renderTreeChildren(tree.nodes, key, isExpanded)}
        </TreeNode>
      );
    } else {
      const mod = state.index[tree.id]!;
      return (
        <TreeNode title={mod.name} key={key} disableCheckbox={mod.isCritical} />
      );
    }
  }

  const setFilter = useCallback(
    (filter: string) => {
      setFilterBase(filter);
      const newKeys = new Map<string, boolean>();
      function gather(tree: ModTree, path: string) {
        if (tree.type === "folder") {
          const nodeMatches = isMatch(filter, tree.name);
          let childMatches = false;
          tree.nodes.forEach((c) => {
            childMatches = gather(c, `${path}:${tree.name}`) || childMatches;
          });
          if (nodeMatches || childMatches) {
            newKeys.set(`${path}:${tree.name}`, nodeMatches);
          }
          return nodeMatches || childMatches;
        } else {
          const nodeMatches = isMatch(filter, state.index[tree.id].name);
          if (nodeMatches) newKeys.set(tree.id, true);
          return nodeMatches;
        }
      }
      if (filter !== "") {
        gather(state.tree, "dir");
      }
      // Always expand the root node but never recursively.
      newKeys.set(`dir:${state.tree.name}`, false);
      setExpandedKeys(newKeys);
    },
    [state.tree, setFilterBase, setExpandedKeys]
  );

  const filterFunc = useCallback(
    (node: DataNode) => {
      return expandedKeys.get(node.key as string) === true;
    },
    [filter]
  );

  const allowDrop = useCallback(({ dropNode, dropPosition }) => {
    return dropNode.isLeaf === false && dropPosition === 0;
  }, []);

  const handleDrop = useCallback(
    (info) => {
      const srcPath = info.dragNode.key as string;
      const destPath = info.node.key as string;
      onMoveNode(srcPath, destPath);
      setExpandedKeys(
        new Map(
          Array.from(expandedKeys.entries()).map(([k, v]) => {
            if (k.startsWith(srcPath)) {
              return [`${destPath}:${k.slice(k.lastIndexOf(":") + 1)}`, v];
            } else {
              return [k, v];
            }
          })
        )
      );
    },
    [expandedKeys, setExpandedKeys]
  );

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ ml: -1, flex: 0, display: "flex", alignItems: "center" }}>
        <Box sx={{ py: 1, flex: 1 }}>
          <TextField
            variant="outlined"
            fullWidth
            size="small"
            placeholder={`${state.rimworld.mods.length} mods`}
            sx={{ px: 1 }}
            value={filter}
            type="search"
            onChange={(e) => setFilter(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Box>
          <AddFolderButton onAddFolder={onAddFolder} />
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: "scroll", maxHeight: "100%" }}>
        <Tree
          onExpand={(ks) =>
            setExpandedKeys(new Map(ks.map((k) => [k as string, false])))
          }
          expandedKeys={Array.from(expandedKeys.keys())}
          checkable
          checkedKeys={state.currentMods.filter((t) => t[1]).map((t) => t[0])}
          filterTreeNode={filter ? filterFunc : undefined}
          selectedKeys={selectedModID ? [selectedModID] : undefined}
          onSelect={([selectedID]) => {
            onSelectMod(selectedID as string);
          }}
          onCheck={(_, info) => {
            const queue: DataNode[] = [info.node];
            while (queue.length > 0) {
              const node = queue.shift()!;
              if (node.isLeaf === false) {
                node.children?.forEach((c) => queue.push(c));
              } else {
                onEnableMod(node.key as string, info.checked);
              }
            }
          }}
          draggable
          allowDrop={allowDrop}
          onDrop={handleDrop}
        >
          {renderTree(state.tree, "dir")}
        </Tree>
      </Box>
    </Box>
  );
}

function AddFolderButton({ onAddFolder }: Pick<Props, "onAddFolder">) {
  const [isOpen, setOpen] = useState<boolean>(false);
  const [key, setKey] = useState<number>(0);
  return (
    <>
      <IconButton onClick={() => setOpen(true)}>
        <AddIcon />
      </IconButton>
      <FolderNameDialog
        key={key}
        operation="create"
        initialValue={"New Folder"}
        open={isOpen}
        onClose={() => {
          setOpen(false);
          setKey(key + 1);
        }}
        onSubmit={(n) => {
          setOpen(false);
          setKey(key + 1);
          onAddFolder(n);
        }}
      />
    </>
  );
}

function isMatch(filter: string, test: string) {
  return test.toLowerCase().indexOf(filter.toLowerCase()) !== -1;
}

function compareNodes(a: ModTree, b: ModTree, state: RimworldState): number {
  if (a.type === "folder" && b.type !== "folder") return -1;
  if (b.type === "folder" && a.type !== "folder") return 1;
  const keyA = a.type === "folder" ? a.name : state.index[a.id]!.name;
  const keyB = b.type === "folder" ? b.name : state.index[b.id]!.name;
  if (keyA < keyB) return -1;
  if (keyA > keyB) return 1;
  return 0;
}
