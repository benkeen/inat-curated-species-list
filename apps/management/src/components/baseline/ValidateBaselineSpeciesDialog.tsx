import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { getRegionSpecies } from '../../api/inat';
import { RegionSpecies } from '../../types';

type ValidateBaselineSpeciesDialogProps = {
  placeId: number;
  taxonId: number;
  open: boolean;
  onComplete: (data: RegionSpecies) => void;
  onClose: () => void;
};

export const ValidateBaselineSpeciesDialog = ({
  placeId,
  taxonId,
  open,
  onClose,
  onComplete,
}: ValidateBaselineSpeciesDialogProps) => {
  const [loading, setLoading] = useState(true);
  const [regionSpecies, setRegionSpecies] = useState<RegionSpecies>();

  useEffect(() => {
    if (open) {
      (async () => {
        const latestData = await getRegionSpecies(placeId, taxonId);
        setRegionSpecies(latestData);
        setLoading(false);
      })();
    }
  }, [open]);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        slotProps={{
          paper: {
            component: 'form',
          },
        }}
        maxWidth="sm"
        fullWidth={true}
      >
        <DialogTitle>Validate Baseline Species</DialogTitle>
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
        <DialogContent dividers={true}>
          Updating research grade counts and checking baseline species still active
          {loading && <CircularProgress color="inherit" size={16} style={{ marginLeft: 10 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => onComplete(regionSpecies as RegionSpecies)} disabled={loading}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
