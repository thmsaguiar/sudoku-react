import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

interface GameDialogProps {
  open: boolean;
  onClose?: () => void;
  onRestart: () => void;
  title: string;
  subtitle: string;
  btnlabel: string;
}

export default function GameDialog({
  open,
  onClose,
  onRestart,
  title,
  subtitle,
  btnlabel,
}: Readonly<GameDialogProps>) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#1e1e1e",
            color: "#fff",
            borderRadius: 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "inherit",
          fontFamily: `"Century Gothic", CenturyGothic, AppleGothic, sans-serif`,
        }}
      >
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          sx={{
            color: "inherit",
            fontFamily: `"Century Gothic", CenturyGothic, AppleGothic, sans-serif`,
          }}
        >
          {subtitle}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onRestart}
          color="inherit"
          sx={{
            fontFamily: `"Century Gothic", CenturyGothic, AppleGothic, sans-serif`,
          }}
        >
          {btnlabel}{" "}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
