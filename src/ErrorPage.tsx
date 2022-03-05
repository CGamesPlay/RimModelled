import React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import ErrorIcon from "@mui/icons-material/Error";

type ErrorPageProps = {
  error: string;
};

function ErrorPage({ error }: ErrorPageProps): React.ReactElement {
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
        <Box sx={{ height: "100%", p: 2 }}>
          <Box
            sx={{
              height: "100%",
              border: 8,
              borderColor: "error.main",
              borderRadius: 8,
              p: 4,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
            }}
            style={{ borderStyle: "dashed" }}
          >
            <Typography variant="h2" color="error">
              <ErrorIcon
                sx={{ verticalAlign: "text-top", fontSize: "inherit" }}
              />{" "}
              RimModelled has a problem
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default ErrorPage;
