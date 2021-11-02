import React, { useState, useEffect } from "react";
import mergeRefs from "react-merge-refs";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

type TextFieldDialogProps = {
  title: React.ReactNode;
  fieldLabel: React.ReactNode;
  actionLabel: React.ReactNode;
  initialValue?: string;
  open: boolean;
  onClose(): void;
  onSubmit(value: string): void;
};

export default function TextFieldDialog({
  title,
  fieldLabel,
  actionLabel,
  initialValue,
  open,
  onClose,
  onSubmit,
}: TextFieldDialogProps): React.ReactElement {
  const [value, setValue] = useState<string>(initialValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(value);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <TextField
            InputProps={{
              // @ts-expect-error it doesn't like the ref
              inputComponent: AutoselectInput,
            }}
            required
            autoFocus
            margin="dense"
            label={fieldLabel}
            fullWidth
            variant="standard"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {actionLabel}
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
