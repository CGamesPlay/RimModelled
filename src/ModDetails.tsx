import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";

import { Problem } from "./useRimworld";
import { renderProblem } from "./Problem";

type Props = {
  problems: Problem[];
  index: Record<string, Mod>;
  selectedMod: Mod;
};

export default function ModDetails({
  problems,
  index,
  selectedMod,
}: Props): React.ReactElement {
  const myProblems = problems.filter(
    (p) => p.packageId === selectedMod.packageId
  );
  console.log(selectedMod);
  return (
    <div>
      <Paper sx={{ overflow: "hidden" }}>
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
      </Paper>
      {myProblems.length > 0 && (
        <Alert severity="error" sx={{ m: 2, mb: 0 }}>
          <AlertTitle>Errors</AlertTitle>
          <Box component="ul" m={0} pl={2}>
            {myProblems.map((p, i) => {
              const otherModName =
                index[p.otherPackageId]?.name ?? p.otherPackageId;
              return (
                <li key={i}>
                  {renderProblem(selectedMod.name, p.type, otherModName)}
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
