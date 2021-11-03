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

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if ((event.target as HTMLElement).tagName.toLowerCase() === "a") {
        const target = event.target as HTMLAnchorElement;
        try {
          const url = new URL(target.href, window.location);
          if (url.origin === location.origin) return;
        } catch (e) {
          // do nothing
        }
        event.preventDefault();
        window.RimModelled.openExternal(target.href);
      }
    }
    document.body.addEventListener("click", handleClick);
    return () => {
      document.body.removeEventListener("click", handleClick);
    };
  });

  if (!state.loaded) return <div />;
  return <App state={state.state} actions={actions} isDirty={isDirty} />;
}

ReactDOM.render(
  <React.StrictMode>
    <Loader />
  </React.StrictMode>,
  document.getElementById("root")
);
