import React, { useEffect } from "react";
import ReactDOM from "react-dom";

import App from "./App";
import useRimworld, { selectIsDirty } from "./useRimworld";

import "./index.css";

function Loader() {
  const [state, actions] = useRimworld();

  const isDirty = selectIsDirty(state);
  useEffect(() => {
    window.RimModelled.setDirtyState(isDirty);
  }, [isDirty]);

  if (!state.loaded) return <div />;
  return <App state={state.state} actions={actions} isDirty={isDirty} />;
}

ReactDOM.render(
  <React.StrictMode>
    <Loader />
  </React.StrictMode>,
  document.getElementById("root")
);
