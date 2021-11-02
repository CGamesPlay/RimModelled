import { useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";

import { RimworldState, Actions } from "./useRimworld";
import { locateItem } from "./treeUtils";
import ModListMenu from "./ModListMenu";
import ModTree from "./ModTree";
import ModListEditor from "./ModListEditor";
import ModDetails from "./ModDetails";
import FolderDetails from "./FolderDetails";

export default function App({
  state,
  actions,
}: {
  state: RimworldState;
  actions: Actions;
}): React.ReactElement {
  const [selectedPath, setSelectedPath] = useState<string | undefined>(
    undefined
  );
  const selectedLoc = selectedPath
    ? locateItem(state.tree, selectedPath)
    : undefined;
  const selectedNode = selectedLoc?.[0].nodes[selectedLoc?.[1]];

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
        }}
      >
        <Toolbar
          variant="dense"
          disableGutters
          sx={{ px: 1, flex: "none", borderBottom: 1, borderColor: "grey.300" }}
        >
          <Typography variant="h6" component="div" pr={2}>
            RimModelled
          </Typography>
          <Typography variant="subtitle1" component="div">
            RimWorld {state.rimworld.version}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <ModListMenu
            state={state}
            reload={actions.reload}
            replaceCurrentMods={actions.replaceCurrentMods}
            saveModList={actions.saveModList}
            deleteModList={actions.deleteModList}
          />
        </Toolbar>
        <Grid
          container
          spacing={1}
          rowSpacing={0}
          sx={{ flex: 1, minHeight: 0 }}
        >
          <Grid item xs={3} sx={{ height: "100%" }}>
            <Box sx={{ pl: 1, height: "100%" }}>
              <ModTree
                state={state}
                selectedModID={selectedPath}
                onSelectMod={setSelectedPath}
                onEnableMod={actions.enableMod}
                onAddFolder={(name) => {
                  actions.addFolder(name);
                  setSelectedPath(`dir:${state.tree.name}:${name}`);
                }}
                onMoveNode={(srcPath, destPath) => {
                  actions.moveNode(srcPath, destPath);
                  if (srcPath.startsWith("dir:")) {
                    setSelectedPath(
                      `${destPath}:${srcPath.slice(
                        srcPath.lastIndexOf(":") + 1
                      )}`
                    );
                  }
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={3} sx={{ height: "100%" }}>
            <ModListEditor
              state={state}
              selectedModID={selectedPath}
              onSelectMod={setSelectedPath}
              onChangeLoadOrder={actions.changeLoadOrder}
              onEnableMod={actions.enableMod}
            />
          </Grid>
          <Grid item xs={6} sx={{ height: "100%" }}>
            <Box pr={2} pt={2} sx={{ height: "100%", overflowY: "scroll" }}>
              {selectedNode?.type === "item" ? (
                <ModDetails
                  problems={state.problems}
                  index={state.index}
                  selectedNode={selectedNode}
                  setNodeNotes={actions.setNodeNotes}
                />
              ) : selectedNode?.type === "folder" ? (
                <FolderDetails
                  path={selectedPath!}
                  folder={selectedNode}
                  onRenameFolder={(path: string, name: string) => {
                    actions.renameFolder(path, name);
                    const dirname = path.substring(0, path.lastIndexOf(":"));
                    setSelectedPath(`${dirname}:${name}`);
                  }}
                  onRemoveFolder={actions.removeFolder}
                  setNodeNotes={actions.setNodeNotes}
                />
              ) : (
                <EmptyState />
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}

function EmptyState() {
  return (
    <Box sx={{ height: "100%", pl: 2, pb: 2 }}>
      <Box
        sx={{
          height: "100%",
          border: 8,
          borderColor: "grey.200",
          color: "grey.300",
          borderRadius: 8,
          p: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        style={{ borderStyle: "dashed" }}
      >
        <Typography variant="h2">RimModelled</Typography>
      </Box>
    </Box>
  );
}
