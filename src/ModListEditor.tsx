import React, { useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { useId } from "react-id-generator";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";
import Tree, { TreeNode } from "rc-tree";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { RimworldState } from "./useRimworld";

import "rc-tree/assets/index.css";

type Props = {
  state: RimworldState;
  selectedModID: string | undefined;
  onSelectMod(id: string): void;
  onChangeLoadOrder(modID: string, position: number): void;
  onEnableMod(id: string, loaded: boolean): void;
};

export default function ModListEditor({
  state,
  selectedModID,
  onSelectMod,
  onChangeLoadOrder,
  onEnableMod,
}: Props): React.ReactElement {
  const [popupId] = useId(1, "ModListEditor");
  const popupState = usePopupState({ variant: "popover", popupId });

  const treeRef = useRef<Tree>(null);
  useEffect(() => {
    if (selectedModID) treeRef.current?.scrollTo({ key: selectedModID });
  }, [selectedModID]);

  const modCount = state.currentMods.filter((t) => t[1]).length;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ py: 1, flex: 0, display: "flex", alignItems: "center" }}>
        <Box sx={{ flexGrow: 1 }}>{modCount} loaded mods, 0 problems</Box>
        <div>
          <IconButton {...bindTrigger(popupState)}>
            <CheckCircleOutlineIcon />
          </IconButton>
          <Menu
            {...bindMenu(popupState)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={popupState.close}>Cake</MenuItem>
            <MenuItem onClick={popupState.close}>Death</MenuItem>
          </Menu>
        </div>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ModListTree
          ref={treeRef}
          onChangeLoadOrder={onChangeLoadOrder}
          onEnableMod={onEnableMod}
          selectedModID={selectedModID}
          onSelectMod={onSelectMod}
          index={state.index}
          currentMods={state.currentMods}
        />
      </Box>
    </Box>
  );
}

type ModListTreeProps = {
  selectedModID: string | undefined;
  onSelectMod(id: string): void;
  onChangeLoadOrder(modID: string, position: number): void;
  onEnableMod(id: string, loaded: boolean): void;
  index: Record<string, Mod>;
  currentMods: Array<[string, boolean]>;
};

const ModListTree = React.memo(
  React.forwardRef<Tree, ModListTreeProps>(
    (
      {
        onChangeLoadOrder,
        onEnableMod,
        selectedModID,
        onSelectMod,
        index,
        currentMods,
      },
      ref
    ) => {
      return (
        <Tree
          className="rc-tree-h100 rc-tree-flat"
          ref={ref}
          draggable
          checkable
          checkedKeys={currentMods.filter((t) => t[1]).map((t) => t[0])}
          switcherIcon={() => <div />}
          onCheck={(checkedKeysList) => {
            const checkedKeys = new Set(checkedKeysList as string[]);
            currentMods.forEach((t) => {
              if (!checkedKeys.has(t[0])) {
                onEnableMod(t[0], false);
              }
            });
          }}
          onDrop={(info) => {
            const dropPosition = info.dropPosition + (info.dropToGap ? 0 : 1);
            let hiddenItems = 0;
            for (let i = 0; i < currentMods.length; i++) {
              if (!currentMods[i][1]) hiddenItems++;
              if (currentMods[i][0] === info.node.key) break;
            }
            onChangeLoadOrder(
              info.dragNode.key as string,
              dropPosition + hiddenItems
            );
          }}
          selectedKeys={selectedModID ? [selectedModID] : undefined}
          onSelect={([selectedID]) => {
            onSelectMod(selectedID as string);
          }}
        >
          {currentMods
            .filter((t) => t[1])
            .map((t) => {
              const mod = index[t[0]];
              return (
                <TreeNode
                  title={mod.name}
                  key={t[0]}
                  disableCheckbox={mod.isCritical}
                />
              );
            })}
        </Tree>
      );
    }
  )
);
