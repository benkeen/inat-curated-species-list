import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useUpdateInaturalistData } from './hooks/useUpdateInaturalistData';

type UpdateInaturalistDataDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const UpdateInaturalistDataDialog = ({ open, onClose }: UpdateInaturalistDataDialogProps) => {
  const { isActive, startSync } = useUpdateInaturalistData();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title">Update Checklist Data from iNat</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={(theme) => ({
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers={true} sx={{ paddingTop: 0 }}>
        <p>
          Click the <b>Start</b> button below to request the latest data from iNaturalist. Depending on the number of
          reviews made by curators, this may take some time.{' '}
          <b>Please don't close the dialog until all data has been downloaded.</b>
        </p>
      </DialogContent>
      <DialogActions>
        {isActive && <Button onClick={onClose}>Cancel</Button>}
        <Button onClick={() => startSync()} disabled={isActive}>
          Start
        </Button>
      </DialogActions>
    </Dialog>
  );
};
