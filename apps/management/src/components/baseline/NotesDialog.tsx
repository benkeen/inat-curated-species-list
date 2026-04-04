import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDispatch } from 'react-redux';
import { BaselineSpeciesInatData } from '../../types';
import { updateAndSaveSpeciesNotes } from '../../store/baselineData/baselineData.actions';

type Props = {
  row: BaselineSpeciesInatData | null;
  open: boolean;
  onClose: () => void;
};

export const NotesDialog = ({ row, open, onClose }: Props) => {
  const dispatch = useDispatch();
  const [publicNotes, setPublicNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setPublicNotes(row.publicNotes || '');
      setPrivateNotes(row.privateNotes || '');
    }
  }, [row]);

  const handleSave = async () => {
    if (!row) return;
    setIsSaving(true);
    await (dispatch as any)(updateAndSaveSpeciesNotes(row.id, publicNotes, privateNotes));
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="caption" color="text.secondary" display="block">
          Notes
        </Typography>
        <Typography variant="h6" sx={{ lineHeight: 1.3 }}>
          {row?.name}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Public notes"
            helperText="Visible to end users of the species list widget."
            multiline
            rows={4}
            fullWidth
            value={publicNotes}
            onChange={(e) => setPublicNotes(e.target.value)}
          />
          <TextField
            label="Private notes"
            helperText="Internal only, not shown in the public widget."
            multiline
            rows={4}
            fullWidth
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="small" variant="contained" onClick={handleSave} disabled={isSaving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
