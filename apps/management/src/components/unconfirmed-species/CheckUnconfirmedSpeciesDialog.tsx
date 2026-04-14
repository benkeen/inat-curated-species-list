import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import { useUnconfirmedSpeciesCheck } from './hooks/useUnconfirmedSpeciesCheck';

type Props = {
  open: boolean;
  onClose: (didComplete: boolean) => void;
};

export const CheckUnconfirmedSpeciesDialog = ({ open, onClose }: Props) => {
  const { status, progress, result, error, startCheck } = useUnconfirmedSpeciesCheck();

  const handleStart = async () => {
    await startCheck();
  };

  const handleClose = () => {
    onClose(status === 'done');
  };

  const progressLabel = () => {
    if (!progress) return null;
    if (progress.phase === 'downloading') {
      return `Downloading page ${progress.currentPage} of ${progress.totalPages}…`;
    }
    return 'Processing downloaded data…';
  };

  const progressValue = () => {
    if (!progress) return 0;
    return Math.round((progress.currentPage / progress.totalPages) * 100);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Check Unconfirmed Species</DialogTitle>
      <DialogContent>
        {status === 'idle' && (
          <>
            <Typography variant="body2" gutterBottom>
              This will download all species reported on iNaturalist for the configured place and taxon, then
              cross-reference them against the curated <b>species-data.json</b> to identify species that have not yet
              been approved by curators.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              The raw data will be saved to <b>full-region-species-list/</b> inside your backup folder, and an{' '}
              <b>unconfirmed-species.json</b> file will be generated with the results. Each request is throttled to one
              per second.
            </Typography>
          </>
        )}

        {status === 'running' && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" gutterBottom>
              {progressLabel() ?? 'Starting…'}
            </Typography>
            <LinearProgress
              variant={progress ? 'determinate' : 'indeterminate'}
              value={progress ? progressValue() : undefined}
              sx={{ mt: 1 }}
            />
            {progress && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {progressValue()}%
              </Typography>
            )}
          </Box>
        )}

        {status === 'done' && result && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Complete. Found <b>{result.totalUnconfirmed}</b> unconfirmed species out of <b>{result.totalReported}</b>{' '}
            reported.
          </Alert>
        )}

        {status === 'error' && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error ?? 'An unexpected error occurred.'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={status === 'running'}>
          {status === 'done' || status === 'error' ? 'Close' : 'Cancel'}
        </Button>
        {status === 'idle' && (
          <Button variant="contained" onClick={handleStart}>
            Start
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
