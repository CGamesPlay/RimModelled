import { useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";

import { RimworldState, Actions } from "./useRimworld";
import { locateFolder } from "./treeUtils";
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
  const [selectedID, setSelectedID] = useState<string | undefined>(undefined);
  const selectedMod = state.rimworld.mods.find(
    (m) => m.packageId === selectedID
  );
  const selectedFolder = selectedID?.startsWith("dir:")
    ? locateFolder(state.tree, selectedID)
    : undefined;

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
                selectedModID={selectedID}
                onSelectMod={setSelectedID}
                onEnableMod={actions.enableMod}
                onAddFolder={(name) => {
                  actions.addFolder(name);
                  setSelectedID(`dir:${state.tree.name}:${name}`);
                }}
                onMoveNode={(srcPath, destPath) => {
                  actions.moveNode(srcPath, destPath);
                  if (srcPath.startsWith("dir:")) {
                    setSelectedID(
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
              selectedModID={selectedID}
              onSelectMod={setSelectedID}
              onChangeLoadOrder={actions.changeLoadOrder}
              onEnableMod={actions.enableMod}
            />
          </Grid>
          <Grid item xs={6} sx={{ height: "100%" }}>
            <Box pr={2} pt={2} sx={{ height: "100%", overflowY: "scroll" }}>
              {selectedMod ? (
                <ModDetails selectedMod={selectedMod} />
              ) : selectedFolder ? (
                <FolderDetails
                  path={selectedID!}
                  folder={selectedFolder}
                  onRenameFolder={(path: string, name: string) => {
                    actions.renameFolder(path, name);
                    const dirname = path.substring(0, path.lastIndexOf(":"));
                    setSelectedID(`${dirname}:${name}`);
                  }}
                  onRemoveFolder={actions.removeFolder}
                />
              ) : (
                <div>select a mod</div>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
