import React, { useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useId } from "react-id-generator";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";
import Tree, { TreeNode } from "rc-tree";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import SearchIcon from "@mui/icons-material/Search";

import { Problem, sortMods } from "./Problem";
import { ProblemDescription } from "./ProblemDescription";
import { RimworldState, selectProblems } from "./useRimworld";

import "rc-tree/assets/index.css";

type Props = {
  state: RimworldState;
  selectedModID: string | undefined;
  onSelectMod(id: string): void;
  onChangeLoadOrder(modID: string, position: number): void;
  onEnableMod(id: string, loaded: boolean): void;
  onReplaceCurrentMods(nextMods: Array<[string, boolean]>): void;
};

export default function ModListEditor({
  state,
  selectedModID,
  onSelectMod,
  onChangeLoadOrder,
  onEnableMod,
  onReplaceCurrentMods,
}: Props): React.ReactElement {
  const treeRef = useRef<Tree>(null);
  useEffect(() => {
    if (selectedModID) treeRef.current?.scrollTo({ key: selectedModID });
  }, [selectedModID]);

  const modCount = state.currentMods.filter((t) => t[1]).length;

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ py: 1, flex: 0, display: "flex", alignItems: "center" }}>
        <ModListSummary
          index={state.index}
          modCount={modCount}
          problems={selectProblems(state)}
          onSelectMod={onSelectMod}
          onAutoFix={() =>
            onReplaceCurrentMods(
              sortMods(state.currentMods, state.index, state.rimworld.version)
            )
          }
        />
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

type ModListSummaryProps = {
  index: Record<string, Mod>;
  modCount: number;
  problems: Problem[];
  onSelectMod(id: string): void;
  onAutoFix(): void;
};

const ModListSummary = ({
  index,
  modCount,
  problems,
  onSelectMod,
  onAutoFix,
}: ModListSummaryProps) => {
  const [popupId] = useId(1, "ModListSummary");
  const popupState = usePopupState({ variant: "popover", popupId });

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        {modCount} loaded {modCount === 1 ? "mod" : "mods"}, {problems.length}{" "}
        {problems.length === 1 ? "problem" : "problems"}
      </Box>
      <div>
        <IconButton
          disabled={problems.length === 0}
          {...bindTrigger(popupState)}
          color={problems.length === 0 ? undefined : "error"}
        >
          {problems.length === 0 ? (
            <CheckCircleOutlineIcon />
          ) : (
            <WarningAmberIcon />
          )}
        </IconButton>
        {problems.length > 0 && (
          <Menu
            {...bindMenu(popupState)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem
              onClick={() => {
                popupState.close();
                onAutoFix();
              }}
            >
              <ListItemIcon>
                <AutoFixHighIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Automatically resolve issues</ListItemText>
            </MenuItem>
            {problems.map((problem, i) => (
              <MenuItem
                key={i}
                onClick={() => {
                  popupState.close();
                  onSelectMod(problem.packageId);
                }}
              >
                <ListItemIcon>
                  <SearchIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  <ProblemDescription problem={problem} index={index} />
                </ListItemText>
              </MenuItem>
            ))}
          </Menu>
        )}
      </div>
    </>
  );
};

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
              const mod: Mod | undefined = index[t[0]];
              return (
                <TreeNode
                  title={mod?.name ?? t[0]}
                  key={t[0]}
                  disableCheckbox={mod?.isCritical ?? false}
                />
              );
            })}
        </Tree>
      );
    }
  )
);
