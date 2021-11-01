import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import useRimworld from "./useRimworld";

import "./index.css";

function Loader() {
  const [state, actions] = useRimworld();

  if (!state.loaded) return <div />;
  return <App state={state.state} actions={actions} />;
}

ReactDOM.render(
  <React.StrictMode>
    <Loader />
  </React.StrictMode>,
  document.getElementById("root")
);
