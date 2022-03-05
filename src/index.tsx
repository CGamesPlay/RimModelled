import React, { useEffect } from "react";
import ReactDOM from "react-dom";

import App from "./App";
import ErrorPage from "./ErrorPage";
import useRimworld, { selectIsDirty } from "./useRimworld";

import "./index.css";

function Loader() {
  const [state, actions] = useRimworld();

  const isDirty = selectIsDirty(state);
  useEffect(() => {
    window.RimModelled.setDirtyState(isDirty);
  }, [isDirty]);

  if (!state.loaded) {
    if (state.error) return <ErrorPage error={state.error} />;
    return <div />;
  }
  return <App state={state.state} actions={actions} isDirty={isDirty} />;
}

ReactDOM.render(
  <React.StrictMode>
    <Loader />
  </React.StrictMode>,
  document.getElementById("root")
);
