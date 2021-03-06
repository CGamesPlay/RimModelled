import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import windowStateKeeper from "electron-window-state";

let mainWindow: BrowserWindow | null;

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

let isDirty = false;
let isQuitting = false;

function confirmClose(): Promise<boolean> {
  return dialog
    .showMessageBox(mainWindow!, {
      type: "question",
      buttons: ["Keep Editing", "Discard Changes"],
      defaultId: 0,
      title: "Unsaved Changes",
      message:
        "There are changes to your mod lists which will be lost if you continue. Do you want to discard these changes?",
    })
    .then(({ response }) => response === 1);
}

function createWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1100,
    defaultHeight: 700,
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    // icon: path.join(assetsPath, 'assets', 'icon.png'),
    backgroundColor: "#191622",
    title: "RimModelled",
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  mainWindowState.manage(mainWindow);

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.on("close", (e) => {
    if (isDirty) {
      e.preventDefault();
      confirmClose().then((confirmed) => {
        if (confirmed) {
          mainWindow!.destroy();
          if (isQuitting) app.quit();
        } else {
          isQuitting = false;
        }
      });
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  const webContents = mainWindow.webContents;
  webContents.on("will-navigate", function (e, url) {
    /* If url isn't the actual page */
    if (url != webContents.getURL()) {
      e.preventDefault();
      shell.openExternal(url);
    } else if (isDirty) {
      e.preventDefault();
      confirmClose().then((confirmed) => {
        if (confirmed) {
          isDirty = false;
          webContents.loadURL(url);
        }
      });
    }
  });
}

async function registerListeners() {
  ipcMain.on("isDirty", (event, newIsDirty) => {
    isDirty = newIsDirty;
  });
}

app
  .on("ready", createWindow)
  .on("before-quit", () => {
    isQuitting = true;
  })
  .whenReady()
  .then(registerListeners)
  .catch((e) => console.error(e));

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
