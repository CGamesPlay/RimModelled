import { useId } from "react-id-generator";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";

import { Problem, ProblemDescription } from "./ProblemDescription";

type Props = {
  problems: Problem[];
  index: Record<string, Mod>;
  selectedNode: ModTreeItem;
  onSelectMod(id: string): void;
  setNodeNotes(path: string, notes: string): void;
};

export default function ModDetails({
  problems,
  index,
  selectedNode,
  onSelectMod,
  setNodeNotes,
}: Props): React.ReactElement {
  const [textFieldId] = useId(1, "ModDetailsNotes");
  const selectedMod = index[selectedNode.id];

  const myProblems = problems.filter(
    (p) => p.packageId === selectedMod.packageId
  );
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
          <Typography variant="h6">{selectedMod.name}</Typography>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ display: "inline", pr: 2 }}
          >
            Author: {selectedMod.author}
          </Typography>
          <Typography
            variant="subtitle1"
            noWrap
            sx={{ display: "inline", pr: 2 }}
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
      {myProblems.length > 0 && (
        <Alert severity="error" sx={{ m: 2, mb: 0 }}>
          <AlertTitle>Errors</AlertTitle>
          <Box component="ul" m={0} pl={2}>
            {myProblems.map((p, i) => {
              return (
                <li key={i}>
                  <ProblemDescription
                    problem={p}
                    index={index}
                    onSelectMod={onSelectMod}
                  />
                </li>
              );
            })}
          </Box>
        </Alert>
      )}
      <Box p={2}>{selectedMod.description}</Box>
    </div>
  );
}
