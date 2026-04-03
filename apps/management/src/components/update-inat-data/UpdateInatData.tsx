import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useUpdateInaturalistData } from './hooks/useUpdateInaturalistData';

const formatDuration = (ms: number): string => {
  if (ms < 60_000) return `~${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60_000);
  const secs = Math.round((ms % 60_000) / 1000);
  return secs > 0 ? `~${mins}m ${secs}s` : `~${mins}m`;
};

export const UpdateInatData = () => {
  const { status, startedAt, progress, result, error, lastRun, startSync } = useUpdateInaturalistData();
  const [testMode, setTestMode] = useState(false);

  const eta =
    progress && startedAt && progress.packetNum > 1
      ? (() => {
          const elapsed = Date.now() - new Date(startedAt).getTime();
          const msPerPacket = elapsed / progress.packetNum;
          const remaining = (progress.totalPackets - progress.packetNum) * msPerPacket;
          return formatDuration(remaining);
        })()
      : null;

  return (
    <div>
      <h2>Update Observation Data from iNat</h2>

      <p>
        This should be run any time you want to update the checklist. It downloads the latest observation data from
        iNaturalist, which is used to determine which species are included on the checklist and their associated
        metadata. Depending on how long it's been since the last update and how many observations have been reviewed by
        curators, this process may take some time. Click the <b>Start</b> button below to request the latest data from
        iNaturalist.
      </p>

      {lastRun?.success && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, maxWidth: 480 }}>
          <Typography variant="subtitle2" gutterBottom>
            Last successful download
          </Typography>
          <Typography variant="body2">
            <b>Date:</b>{' '}
            {new Date(lastRun.lastRun).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Typography>
          <Typography variant="body2">
            <b>Observations:</b> {lastRun.totalObservations.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <b>Packets:</b> {lastRun.totalPackets}
          </Typography>
          {lastRun.durationSeconds != null && (
            <Typography variant="body2">
              <b>Duration:</b>{' '}
              {lastRun.durationSeconds < 60
                ? `${lastRun.durationSeconds}s`
                : `${Math.floor(lastRun.durationSeconds / 60)}m ${lastRun.durationSeconds % 60}s`}
            </Typography>
          )}
        </Paper>
      )}

      {status !== 'running' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button variant="outlined" size="small" onClick={() => startSync(testMode)}>
            {status === 'idle' ? 'Start' : 'Run Again'}
          </Button>
          <FormControlLabel
            control={<Checkbox size="small" checked={testMode} onChange={(e) => setTestMode(e.target.checked)} />}
            label={<Typography variant="body2">Test mode (limit to 10 packets)</Typography>}
          />
        </Box>
      )}

      {status === 'running' && (
        <Box sx={{ mt: 2 }}>
          {progress ? (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Downloading packet {progress.packetNum} of {progress.totalPackets} &mdash;{' '}
                {progress.totalResults.toLocaleString()} total observations
                {eta && <> &mdash; {eta} remaining</>}
              </Typography>
              <LinearProgress variant="determinate" value={(progress.packetNum / progress.totalPackets) * 100} />
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Connecting...
              </Typography>
              <LinearProgress />
            </>
          )}
        </Box>
      )}

      {status === 'done' && result && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Download complete. {result.totalObservations.toLocaleString()} observations downloaded in{' '}
          {result.totalPackets} {result.totalPackets === 1 ? 'packet' : 'packets'}. Completed at{' '}
          {new Date(result.completedAt).toLocaleString()}.
        </Alert>
      )}

      {status === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </div>
  );
};
