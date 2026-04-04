import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { Spinner } from '../loading/spinner';
import { getNewAdditionsData, getNewAdditionsSettings, updateNewAdditionsSettings } from '../../api/api';
import { NewAdditionsTab } from '@ecophilia/inat-curated-species-list-ui';
import { NewAddition } from '@ecophilia/inat-curated-species-list-tools';

export const NewAdditions = () => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [data, setData] = useState<NewAddition[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const settingsResp = await getNewAdditionsSettings();
        const { settings } = await settingsResp.json();
        const isEnabled = settings?.enabled ?? false;
        setEnabled(isEnabled);

        if (isEnabled) {
          const dataResp = await getNewAdditionsData();
          if (!dataResp.ok) {
            const body = await dataResp.json();
            throw new Error(body?.error ?? 'Failed to load new additions data.');
          }
          setData((await dataResp.json()) as NewAddition[]);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const onToggleEnabled = async (newEnabled: boolean) => {
    setEnabled(newEnabled);

    if (newEnabled && !data) {
      setIsLoading(true);
      try {
        const dataResp = await getNewAdditionsData();
        if (!dataResp.ok) {
          const body = await dataResp.json();
          throw new Error(body?.error ?? 'Failed to load new additions data.');
        }
        setData((await dataResp.json()) as NewAddition[]);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    await updateNewAdditionsSettings({ enabled: newEnabled });
  };

  const checkboxLabel = (
    <span>
      Enable New Additions. Make sure you set the <RouterLink to="/settings/main">Baseline Completion date</RouterLink>{' '}
      to define the starting point for new additions.
    </span>
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        New Additions
      </Typography>
      {enabled !== null && (
        <FormControlLabel
          control={<Checkbox checked={enabled} onChange={(e) => onToggleEnabled(e.target.checked)} />}
          label={checkboxLabel}
          sx={{ mb: 2 }}
        />
      )}
      {isLoading && <Spinner />}
      {error && <Alert severity="error">{error}</Alert>}
      {enabled && data && <NewAdditionsTab initialData={data} showRowNumbers={true} />}
    </Box>
  );
};
