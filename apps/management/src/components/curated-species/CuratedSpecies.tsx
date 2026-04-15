import { useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useGenerateCuratedSpecies } from './hooks/useGenerateCuratedSpecies';
import { useCuratedSpeciesData } from './hooks/useCuratedSpeciesData';
import { CuratedSpeciesTable } from './CuratedSpeciesTable';

export const CuratedSpecies = () => {
  const { status, count, error, generate } = useGenerateCuratedSpecies();
  const { fileData, loadData } = useCuratedSpeciesData();

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (status === 'done') {
      loadData();
    }
  }, [status, loadData]);

  return (
    <Box sx={{ p: 2 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        Curated Species
        {fileData && fileData.data.length > 0 && <Chip label={fileData.data.length} size="small" />}
      </h2>

      {status !== 'running' && (
        <Button variant="outlined" size="small" onClick={generate}>
          Generate Curated Species
        </Button>
      )}

      {status === 'running' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Generating curated species...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {status === 'done' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Generated successfully — {count} species written.
        </Alert>
      )}

      {status === 'error' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {fileData && fileData.data.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <CuratedSpeciesTable data={fileData.data} />
        </Box>
      )}
    </Box>
  );
};
