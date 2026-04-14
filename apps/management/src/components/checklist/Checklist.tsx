import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { CuratedSpeciesTable } from '@ecophilia/inat-curated-species-list-ui';
import { Spinner } from '../loading/spinner';
import { Styles } from './Styles';
import { useGenerateChecklist } from './hooks/useGenerateChecklist';
import { useChecklistData } from './hooks/useChecklistData';
import { useQueuedChanges } from './hooks/useQueuedChanges';

export const Checklist = () => {
  const { isLoading, error, speciesData, newAdditionsData, taxonChangesData, settings, newAdditionsEnabled, loadData } =
    useChecklistData();
  const [modalOpen, setModalOpen] = useState(false);
  const { data: queuedChanges, loadData: loadQueuedChanges } = useQueuedChanges();
  const {
    status: generateStatus,
    result: generateResult,
    error: generateError,
    generateChecklist,
  } = useGenerateChecklist();

  useEffect(() => {
    loadData();
    loadQueuedChanges();
  }, [loadData, loadQueuedChanges]);

  useEffect(() => {
    if (generateStatus === 'done') {
      loadData();
      loadQueuedChanges();
    }
  }, [generateStatus, loadData, loadQueuedChanges]);

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Spinner />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>Checklist</h2>
        {!error && speciesData && settings && (
          <Button variant="outlined" size="small" onClick={() => setModalOpen(true)}>
            View Checklist
          </Button>
        )}
      </Box>

      <p>
        Once iNat observation data has been downloaded, use this to generate the checklist data files (
        <code>species-data.json</code>, <code>new-additions-data.json</code>, <code>taxon-changes-data.json</code>).
        These are written directly into the backup folder.
      </p>

      {generateStatus !== 'running' && (
        <Button variant="outlined" size="small" onClick={() => generateChecklist()}>
          Update Checklist
        </Button>
      )}

      {generateStatus === 'running' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Generating checklist files...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {generateStatus === 'done' && generateResult && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Checklist generated in {generateResult.durationSeconds}s — {generateResult.filesGenerated.length} file(s)
          written.
        </Alert>
      )}

      {generateStatus === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {generateError}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}

      {queuedChanges && (
        <Box sx={{ mt: 3 }}>
          <h3 style={{ marginBottom: 8 }}>Queued Changes</h3>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Total species:</strong> {queuedChanges.currentSpeciesCount}
            {queuedChanges.speciesCountDiff !== null && (
              <span
                style={{
                  marginLeft: 8,
                  color:
                    queuedChanges.speciesCountDiff > 0
                      ? 'green'
                      : queuedChanges.speciesCountDiff < 0
                        ? 'red'
                        : 'inherit',
                }}
              >
                ({queuedChanges.speciesCountDiff > 0 ? '+' : ''}
                {queuedChanges.speciesCountDiff})
              </span>
            )}
          </Typography>

          {queuedChanges.addedSpecies.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>New Species ({queuedChanges.addedSpecies.length}):</strong>
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                {queuedChanges.addedSpecies.join(', ')}
              </Typography>
            </Box>
          )}

          {queuedChanges.removedSpecies.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>Removed Species ({queuedChanges.removedSpecies.length}):</strong>
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                {queuedChanges.removedSpecies.join(', ')}
              </Typography>
            </Box>
          )}

          {queuedChanges.addedBaselineSpecies.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>Added Baseline Species ({queuedChanges.addedBaselineSpecies.length}):</strong>
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                {queuedChanges.addedBaselineSpecies.join(', ')}
              </Typography>
            </Box>
          )}

          {queuedChanges.removedBaselineSpecies.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>Removed Baseline Species ({queuedChanges.removedBaselineSpecies.length}):</strong>
              </Typography>
              <Typography variant="body2" sx={{ pl: 2 }}>
                {queuedChanges.removedBaselineSpecies.join(', ')}
              </Typography>
            </Box>
          )}

          {queuedChanges.addedSpecies.length === 0 &&
            queuedChanges.removedSpecies.length === 0 &&
            queuedChanges.addedBaselineSpecies.length === 0 &&
            queuedChanges.removedBaselineSpecies.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No changes since last commit.
              </Typography>
            )}
        </Box>
      )}

      {!error && speciesData && settings ? (
        <Box sx={{ mt: 3 }}>
          <Dialog
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            maxWidth={false}
            PaperProps={{ sx: { width: '92vw', height: '90vh' } }}
          >
            <DialogTitle sx={{ pr: 6 }}>
              Curated Checklist
              <IconButton
                onClick={() => setModalOpen(false)}
                sx={{ position: 'absolute', right: 8, top: 8 }}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ overflow: 'auto' }}>
              <Styles />
              <CuratedSpeciesTable
                initialSpeciesData={speciesData}
                curatorUsernames={settings.curatorUsernames}
                placeId={settings.placeId}
                showLastGeneratedDate={true}
                showRowNumbers={true}
                showReviewerCount={true}
                showNewAdditions={newAdditionsEnabled}
                initialNewAdditionsData={newAdditionsData ?? undefined}
                showTaxonChanges={!!taxonChangesData}
                initialTaxonChangesData={taxonChangesData ?? undefined}
              />
            </DialogContent>
          </Dialog>
        </Box>
      ) : (
        !error && (
          <Alert severity="info" sx={{ mt: 3 }}>
            No checklist data found. Generate the checklist above.
          </Alert>
        )
      )}
    </Box>
  );
};
