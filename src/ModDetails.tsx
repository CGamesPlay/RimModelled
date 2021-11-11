import { useId } from "react-id-generator";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";

import { RimworldState, selectProblems } from "./useRimworld";
import { listModProblems } from "./Problem";
import { ProblemDescription } from "./ProblemDescription";
import UnityLabelFormatter from "./UnityLabelFormatter";

type Props = {
  state: RimworldState;
  selectedNode: ModTreeItem;
  onSelectMod(id: string): void;
  setNodeNotes(path: string, notes: string): void;
};

export default function ModDetails({
  state,
  selectedNode,
  onSelectMod,
  setNodeNotes,
}: Props): React.ReactElement {
  const [textFieldId] = useId(1, "ModDetailsNotes");
  const selectedMod = state.index[selectedNode.id];
  const isEnabled = state.currentMods.find(
    (t) => t[0] === selectedNode.id && t[1]
  );

  const problems = isEnabled
    ? selectProblems(state).filter((p) => p.packageId === selectedNode.id)
    : listModProblems(
        selectedNode.id,
        state.currentMods,
        state.index,
        state.rimworld.version
      );

  const links: Array<{ url: string; title: string; icon: React.ReactNode }> =
    [];
  if (selectedMod.url) {
    links.push({
      url: selectedMod.url,
      title: selectedMod.url,
      icon: <HomeIcon />,
    });
  }
  if (selectedMod.steamWorkshopUrl) {
    links.push({
      url: selectedMod.steamWorkshopUrl,
      title: "Steam Workshop",
      icon: <SettingsIcon />,
    });
  }

  return (
    <div key={selectedMod.packageId}>
      <Paper sx={{ overflow: "hidden", pb: 1 }}>
        <Box
          component="img"
          sx={{
            width: "100%",
            maxHeight: "40vh",
            objectFit: "scale-down",
            display: "block",
            bgcolor: "grey.900",
          }}
          src={selectedMod.previewURL}
        />
        <Box py={1} px={2}>
          {links.length > 0 && (
            <Box sx={{ float: "right" }}>
              {links.map((link) => (
                <IconButton href={link.url} title={link.title} key={link.url}>
                  {link.icon}
                </IconButton>
              ))}
            </Box>
          )}
          <Typography variant="h6">{selectedMod.name}</Typography>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ display: "inline-block", pr: 2 }}
          >
            Author: {selectedMod.author}
          </Typography>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ display: "inline-block", pr: 2 }}
          >
            Version: {selectedMod.version ?? "N/A"}
          </Typography>
        </Box>
        <Divider />
        <Box pt={2} pb={1} px={2}>
          <TextField
            variant="standard"
            multiline
            fullWidth
            label="Notes"
            id={textFieldId}
            defaultValue={selectedNode.notes}
            onBlur={(e) => {
              setNodeNotes(selectedMod.packageId, e.target.value);
            }}
          />
        </Box>
      </Paper>
      {problems.length > 0 && (
        <Alert severity="error" sx={{ m: 2, mb: 0 }}>
          <AlertTitle>Problems</AlertTitle>
          <Box component="ul" m={0} pl={2}>
            {problems.map((p, i) => {
              return (
                <li key={i}>
                  <ProblemDescription
                    problem={p}
                    index={state.index}
                    onSelectMod={onSelectMod}
                  />
                </li>
              );
            })}
          </Box>
        </Alert>
      )}
      <Box p={2}>
        <UnityLabelFormatter content={selectedMod.description} />
      </Box>
    </div>
  );
}
