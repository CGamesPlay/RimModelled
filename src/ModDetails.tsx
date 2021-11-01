import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type Props = {
  selectedMod: Mod;
};

export default function ModDetails({ selectedMod }: Props): React.ReactElement {
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
      <Box p={2}>{selectedMod.description}</Box>
    </div>
  );
}
