import { useState } from "react";
import { useId } from "react-id-generator";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import LaunchIcon from "@mui/icons-material/Launch";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ListAltIcon from "@mui/icons-material/ListAlt";
import FileCopyIcon from "@mui/icons-material/FileCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";

import { RimworldState } from "./useRimworld";
import TextFieldDialog from "./TextFieldDialog";

type Props = {
  state: RimworldState;
  save(launchAfter: boolean): void;
  replaceCurrentMods(mods: Array<[string, boolean]>): void;
  saveModList(name: string, mods: Array<[string, boolean]>): void;
  deleteModList(name: string): void;
};

export default function ModListMenu({
  state,
  save,
  replaceCurrentMods,
  saveModList,
  deleteModList,
}: Props): React.ReactElement {
  const [saveId, loadId, launchId] = useId(1, "ModListMenu");
  const loadPopup = usePopupState({ variant: "popover", popupId: loadId });
  const savePopup = usePopupState({ variant: "popover", popupId: saveId });
  const launchPopup = usePopupState({ variant: "popover", popupId: launchId });
  const [openModal, setOpenModal] = useState<
    | "loadModList"
    | "importFromSave"
    | "saveModList"
    | "saveNewModList"
    | "loading"
    | undefined
  >(undefined);

  function loadModList(name: string) {
    setOpenModal(undefined);
    const list = state.lists.find((l) => l.name === name);
    if (list) replaceCurrentMods(list.mods);
  }

  async function importModsFromSave(name: string) {
    setOpenModal("loading");
    const mods = await window.RimModelled.readModsFromSave(name);
    if (mods) replaceCurrentMods(mods.map((m) => [m, true]));
    setOpenModal(undefined);
  }

  function handleSaveModList(name: string) {
    setOpenModal(undefined);
    saveModList(
      name,
      state.currentMods.filter((t) => t[1])
    );
  }

  function handleDeleteModList(name: string) {
    const list = state.lists.find((l) => l.name === name);
    if (!list) return;
    const text = `Really delete mod list "${name}" (${list.mods.length} mods)?`;
    if (window.confirm(text)) {
      deleteModList(name);
    }
  }

  function handlePaste() {
    const str = window.RimModelled.readClipboardText();
    const mods = stringToMods(str);
    replaceCurrentMods(mods.map((x) => [x[1], true]));
  }

  return (
    <>
      <ButtonGroup color="secondary" variant="outlined" sx={{ mr: 1 }}>
        <Button onClick={() => setOpenModal("loadModList")}>Load List</Button>
        <Button size="small" {...bindTrigger(loadPopup)}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup color="secondary" variant="outlined" sx={{ mr: 1 }}>
        <Button onClick={() => setOpenModal("saveModList")}>Save List</Button>
        <Button size="small" {...bindTrigger(savePopup)}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup variant="contained" sx={{ mr: 1 }}>
        <Button onClick={() => save(true)}>Launch</Button>
        <Button size="small" {...bindTrigger(launchPopup)}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Menu
        {...bindMenu(loadPopup)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            loadPopup.close();
            setOpenModal("loadModList");
          }}
        >
          <ListItemIcon>
            <FolderOpenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Load saved mod list</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            loadPopup.close();
            setOpenModal("importFromSave");
          }}
        >
          <ListItemIcon>
            <FileCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import from save</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            loadPopup.close();
            handlePaste();
          }}
        >
          <ListItemIcon>
            <ContentPasteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Paste from clipboard</ListItemText>
        </MenuItem>
      </Menu>
      <Menu
        {...bindMenu(savePopup)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            savePopup.close();
            setOpenModal("saveModList");
          }}
        >
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save mod list</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            savePopup.close();
            window.RimModelled.writeClipboardText(
              modsToString(state.currentMods, state.index)
            );
          }}
        >
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy to clipboard</ListItemText>
        </MenuItem>
      </Menu>
      <Menu
        {...bindMenu(launchPopup)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            launchPopup.close();
            save(true);
          }}
        >
          <ListItemIcon>
            <LaunchIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save active mods and launch</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            launchPopup.close();
            save(false);
          }}
        >
          <ListItemIcon>
            <SaveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Save without launching</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            launchPopup.close();
            window.location.reload();
          }}
        >
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reload RimModelled</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog
        onClose={() => setOpenModal(undefined)}
        open={openModal === "loadModList"}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Load Mod List</DialogTitle>
        <List sx={{ pt: 0 }}>
          {state.lists.map((list) => (
            <ListItem
              button
              key={list.name}
              onClick={() => loadModList(list.name)}
            >
              <ListItemIcon>
                <ListAltIcon />
              </ListItemIcon>
              <ListItemText
                primary={list.name}
                secondary={`${list.mods.filter((t) => t[1]).length} mods`}
              />
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteModList(list.name);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
          {state.lists.length === 0 && (
            <ListItem button disabled>
              <ListItemIcon>
                <ListAltIcon />
              </ListItemIcon>
              <ListItemText primary="No saved mod lists" />
            </ListItem>
          )}
        </List>
      </Dialog>

      <Dialog
        onClose={() => setOpenModal(undefined)}
        open={openModal === "importFromSave"}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Import Mods From Save</DialogTitle>
        <List sx={{ pt: 0 }}>
          {state.rimworld.gameSaves.map((name) => (
            <ListItem
              button
              onClick={() => importModsFromSave(name)}
              key={name}
            >
              <ListItemIcon>
                <FileCopyIcon />
              </ListItemIcon>
              <ListItemText primary={name} />
            </ListItem>
          ))}
          {state.rimworld.gameSaves.length === 0 && (
            <ListItem button disabled>
              <ListItemIcon>
                <FileCopyIcon />
              </ListItemIcon>
              <ListItemText primary="No save files found" />
            </ListItem>
          )}
        </List>
      </Dialog>

      <Dialog
        onClose={() => setOpenModal(undefined)}
        open={openModal === "saveModList"}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Save Current Mod List</DialogTitle>
        <List sx={{ pt: 0 }}>
          <ListItem button onClick={() => setOpenModal("saveNewModList")}>
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            <ListItemText primary="Create New List" />
          </ListItem>
          {state.lists.map((list) => (
            <ListItem
              button
              onClick={() => handleSaveModList(list.name)}
              key={list.name}
            >
              <ListItemIcon>
                <EditIcon />
              </ListItemIcon>
              <ListItemText primary={`Replace "${list.name}"`} />
            </ListItem>
          ))}
          {state.lists.length === 0 && (
            <ListItem button disabled>
              <ListItemIcon>
                <ListAltIcon />
              </ListItemIcon>
              <ListItemText primary="No existing mod lists" />
            </ListItem>
          )}
        </List>
      </Dialog>

      <TextFieldDialog
        key={state.lists[0]?.name ?? ""}
        title="Save To New List"
        fieldLabel="List Name"
        actionLabel="Save"
        open={openModal === "saveNewModList"}
        onClose={() => setOpenModal(undefined)}
        onSubmit={(n) => handleSaveModList(n)}
      />

      <Dialog open={openModal === "loading"}>
        <DialogTitle>Loading...</DialogTitle>
      </Dialog>
    </>
  );
}

function modsToString(
  mods: Array<[string, boolean]>,
  index: Record<string, Mod>
): string {
  const lines = ["Version: 1", "Name: RimModelled Mod List", "Mods:"];
  mods
    .filter((t) => t[1])
    .forEach(([id, _]) => {
      lines.push(`- Id: ${id}`);
      lines.push(`  Name: ${index[id]?.name ?? id}`);
    });
  return lines.join("\n");
}

function stringToMods(input: string): string[] {
  const results = input.matchAll(/^- Id: (.*)$/gm);
  return Array.from(results).map((g) => g[1]);
}
