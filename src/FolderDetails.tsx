import React, { useState } from "react";
import { useId } from "react-id-generator";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import TextField from "@mui/material/TextField";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";

import TextFieldDialog from "./TextFieldDialog";

type Props = {
  path: string;
  folder: ModTreeFolder;
  onRenameFolder(path: string, name: string): void;
  onRemoveFolder(path: string): void;
  setNodeNotes(path: string, notes: string): void;
};

export default function FolderDetails({
  path,
  folder,
  onRenameFolder,
  onRemoveFolder,
  setNodeNotes,
}: Props): React.ReactElement | null {
  if (folder.type !== "folder") return null;

  const itemCount = countItems(folder);
  const [menuId, textFieldId] = useId(2, "FolderDetails");
  const menuPopup = usePopupState({ variant: "popover", popupId: menuId });
  const [openModal, setOpenModal] = useState<"rename" | undefined>(undefined);

  return (
    <Box sx={{ p: 2, pt: "40px" }} key={path}>
      <Box sx={{ float: "right" }}>
        <IconButton {...bindTrigger(menuPopup)}>
          <MoreVertIcon />
        </IconButton>
        <Menu
          {...bindMenu(menuPopup)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem
            onClick={() => {
              menuPopup.close();
              setOpenModal("rename");
            }}
          >
            <ListItemIcon>
              <DriveFileRenameOutlineIcon />
            </ListItemIcon>
            <ListItemText>Rename</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              menuPopup.close();
              onRemoveFolder(path);
            }}
          >
            <ListItemIcon>
              <DeleteIcon />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>

      <Typography variant="h6">
        <FolderOutlinedIcon sx={{ verticalAlign: "text-bottom", mr: 1 }} />
        {folder.name}
      </Typography>
      <Typography variant="subtitle1">Folder with {itemCount} mods.</Typography>
      <Box py={2}>
        <TextField
          variant="standard"
          multiline
          fullWidth
          label="Notes"
          id={textFieldId}
          defaultValue={folder.notes}
          onBlur={(e) => {
            setNodeNotes(path, e.target.value);
          }}
        />
      </Box>

      <TextFieldDialog
        key={folder.name}
        title="Rename Folder"
        fieldLabel="Folder Name"
        actionLabel="Rename"
        initialValue={folder.name}
        open={openModal === "rename"}
        onClose={() => setOpenModal(undefined)}
        onSubmit={(n) => {
          setOpenModal(undefined);
          onRenameFolder(path, n);
        }}
      />
    </Box>
  );
}

function countItems(node: ModTree): number {
  if (node.type === "folder") {
    return node.nodes.map(countItems).reduce((a, b) => a + b, 0);
  } else {
    return 1;
  }
}
