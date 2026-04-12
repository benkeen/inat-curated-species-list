import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useCheckBaselineSpecies, CheckPhase } from './hooks/useCheckBaselineSpecies';

type Props = {
  open: boolean;
  onClose: () => void;
};

const PHASE_ORDER: CheckPhase[] = ['pass1', 'pass2', 'pass3', 'curator-summary', 'saving'];

const STEPS: { phase: CheckPhase; label: string }[] = [
  { phase: 'pass1', label: 'Check research grade counts' },
  { phase: 'pass2', label: 'Check active status' },
  { phase: 'pass3', label: 'Check total observation counts' },
  { phase: 'curator-summary', label: 'Update curator review count' },
  { phase: 'saving', label: 'Save updates' },
];

export const CheckBaselineSpeciesDialog = ({ open, onClose }: Props) => {
  const { status, phase, progress, total, inactiveChanges, totalInactiveCount, rgChanges, start, reset } =
    useCheckBaselineSpecies();

  const handleClose = () => {
    if (status === 'running') return;
    reset();
    onClose();
  };

  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;
  const currentPhaseIndex = PHASE_ORDER.indexOf(phase);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Check Baseline Species</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {status === 'idle' && (
            <Typography variant="body2">
              This will check every species in the baseline list against iNaturalist and update their research grade
              observation counts, total observation counts, and active status. The check runs across multiple steps and
              may take a few minutes depending on the size of your list.
            </Typography>
          )}

          {(status === 'running' || status === 'complete') && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {STEPS.map((step, i) => {
                const isDone = status === 'complete' || i < currentPhaseIndex;
                const isActive = status === 'running' && i === currentPhaseIndex;
                const isPending = status === 'running' && i > currentPhaseIndex;

                return (
                  <Box key={step.phase}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 'bold',
                          bgcolor: isDone ? 'success.main' : isActive ? 'primary.main' : 'action.disabledBackground',
                          color: isDone || isActive ? 'white' : 'text.disabled',
                        }}
                      >
                        {isDone ? '✓' : i + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: isActive ? 600 : 'normal',
                            color: isPending ? 'text.disabled' : 'text.primary',
                          }}
                        >
                          {step.label}
                        </Typography>
                        {isActive && step.phase !== 'saving' && step.phase !== 'curator-summary' && (
                          <Typography variant="caption" color="text.secondary">
                            {progress} of {total} batches complete
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    {isActive && (
                      <Box sx={{ pl: '36px', mt: 0.75 }}>
                        <LinearProgress
                          variant={
                            step.phase === 'saving' || step.phase === 'curator-summary'
                              ? 'indeterminate'
                              : 'determinate'
                          }
                          value={progressPercent}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {status === 'complete' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
              <Alert severity="success" sx={{ py: 0.5 }}>
                All checks complete.
              </Alert>
              <Typography variant="body2">
                {rgChanges > 0
                  ? `Observation counts updated for ${rgChanges} ${rgChanges === 1 ? 'species' : 'species'}.`
                  : 'No observation count changes detected.'}
              </Typography>
              {inactiveChanges > 0 && (
                <Alert severity="warning" sx={{ py: 0.5 }}>
                  {inactiveChanges} {inactiveChanges === 1 ? 'taxon has' : 'taxa have'} become inactive on iNaturalist
                  since the last check.
                </Alert>
              )}
              {totalInactiveCount > 0 ? (
                <Typography variant="body2">
                  {totalInactiveCount} {totalInactiveCount === 1 ? 'taxon is' : 'taxa are'} currently inactive on
                  iNaturalist. These are shown in red in the table.
                </Typography>
              ) : (
                <Typography variant="body2">All taxa are currently active on iNaturalist.</Typography>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={handleClose} disabled={status === 'running'}>
          {status === 'complete' ? 'Close' : 'Cancel'}
        </Button>
        {status === 'idle' && (
          <Button size="small" variant="contained" onClick={start}>
            Start
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
