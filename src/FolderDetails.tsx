import React, { useState, useEffect } from "react";
import mergeRefs from "react-merge-refs";
import { useId } from "react-id-generator";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  usePopupState,
  bindTrigger,
  bindMenu,
} from "material-ui-popup-state/hooks";

type Props = {
  path: string;
  folder: ModTreeFolder;
  onRenameFolder(path: string, name: string): void;
  onRemoveFolder(path: string): void;
};

export default function FolderDetails({
  path,
  folder,
  onRenameFolder,
  onRemoveFolder,
}: Props): React.ReactElement | null {
  if (folder.type !== "folder") return null;

  const itemCount = countItems(folder);
  const [menuId] = useId(1, "FolderDetails");
  const menuPopup = usePopupState({ variant: "popover", popupId: menuId });
  const [openModal, setOpenModal] = useState<"rename" | undefined>(undefined);

  return (
    <Box sx={{ p: 2, pt: "40px", display: "flex" }}>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6">
          <FolderOutlinedIcon sx={{ verticalAlign: "text-bottom", mr: 1 }} />
          {folder.name}
        </Typography>
        <Typography variant="subtitle1">
          Folder with {itemCount} mods.
        </Typography>
      </Box>
      <Box>
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
      <FolderNameDialog
        key={folder.name}
        operation="rename"
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

type FolderNameDialogProps = {
  operation: "rename" | "create";
  initialValue?: string;
  open: boolean;
  onClose(): void;
  onSubmit(value: string): void;
};

export function FolderNameDialog({
  operation,
  initialValue,
  open,
  onClose,
  onSubmit,
}: FolderNameDialogProps): React.ReactElement {
  const [value, setValue] = useState<string>(initialValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(value);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {operation === "rename" ? "Rename" : "New"} Folder
        </DialogTitle>
        <DialogContent>
          <TextField
            InputProps={{
              // @ts-expect-error it doesn't like the ref
              inputComponent: AutoselectInput,
            }}
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            variant="standard"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {operation === "rename" ? "Rename" : "Create"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

const AutoselectInput = React.forwardRef<HTMLInputElement>(
  (props: React.ComponentProps<"input">, ref) => {
    const [node, setRef] = useState<HTMLInputElement | null>(null);

    useEffect(() => {
      node?.select();
    }, [node]);

    return <input ref={mergeRefs([setRef, ref])} {...props} />;
  }
);
