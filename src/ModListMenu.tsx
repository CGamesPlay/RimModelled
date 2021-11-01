import { useState } from "react";
import { useId } from "react-id-generator";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";

import { RimworldState } from "./useRimworld";

type Props = {
  state: RimworldState;
  reload(): void;
  replaceCurrentMods(mods: Array<[string, boolean]>): void;
};

export default function ModListMenu({
  state,
  reload,
  replaceCurrentMods,
}: Props): React.ReactElement {
  const [saveId, loadId, launchId] = useId(1, "ModListMenu");
  const loadPopup = usePopupState({ variant: "popover", popupId: loadId });
  const savePopup = usePopupState({ variant: "popover", popupId: saveId });
  const launchPopup = usePopupState({ variant: "popover", popupId: launchId });
  const [openModal, setOpenModal] = useState<
    "loadFromSave" | "loading" | undefined
  >(undefined);

  async function setActiveMods(launchAfter: boolean) {
    await window.RimModelled.setActiveMods(
      state.currentMods.filter((t) => t[1]).map((t) => t[0]),
      { launchAfter }
    );
    await window.RimModelled.saveUserData(state);
  }

  async function loadModsFromSave(name: string) {
    setOpenModal("loading");
    const mods = await window.RimModelled.readModsFromSave(name);
    if (mods) replaceCurrentMods(mods.map((m) => [m, true]));
    setOpenModal(undefined);
  }

  return (
    <>
      <ButtonGroup color="secondary" variant="outlined" sx={{ mr: 1 }}>
        <Button>Load From List</Button>
        <Button size="small" {...bindTrigger(loadPopup)}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup color="secondary" variant="outlined" sx={{ mr: 1 }}>
        <Button>Save To List</Button>
        <Button size="small" {...bindTrigger(savePopup)}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <ButtonGroup variant="contained" sx={{ mr: 1 }}>
        <Button onClick={() => setActiveMods(true)}>Launch</Button>
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
            setOpenModal("loadFromSave");
          }}
        >
          Load from save
        </MenuItem>
        <MenuItem onClick={loadPopup.close}>Import from Fluffy</MenuItem>
      </Menu>
      <Menu
        {...bindMenu(savePopup)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={savePopup.close}>Export to Fluffy</MenuItem>
      </Menu>
      <Menu
        {...bindMenu(launchPopup)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            launchPopup.close();
            setActiveMods(false);
          }}
        >
          Save without launching
        </MenuItem>
        <MenuItem onClick={reload}>Reload RimModelled</MenuItem>
      </Menu>

      <Dialog
        onClose={() => setOpenModal(undefined)}
        open={openModal === "loadFromSave"}
      >
        <DialogTitle>Load mods from save</DialogTitle>
        <List sx={{ pt: 0 }}>
          {state.rimworld.gameSaves.map((name) => (
            <ListItem button onClick={() => loadModsFromSave(name)} key={name}>
              <ListItemText primary={name} />
            </ListItem>
          ))}
        </List>
      </Dialog>

      <Dialog open={openModal === "loading"}>
        <DialogTitle>Loading...</DialogTitle>
      </Dialog>
    </>
  );
}
