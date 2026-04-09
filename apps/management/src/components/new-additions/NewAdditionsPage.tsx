import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import { Spinner } from '../loading/spinner';
import { getNewAdditionsData, getNewAdditionsSettings, updateNewAdditionsSettings } from '../../api/api';
import { NewAdditionsTable } from './NewAdditionsTable';
import { NewAddition } from '@ecophilia/inat-curated-species-list-tools';

export const NewAdditionsPage = () => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [data, setData] = useState<NewAddition[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

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

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <h2>New Additions</h2>
        {enabled !== null && (
          <FormControlLabel
            control={<Checkbox checked={enabled} onChange={(e) => onToggleEnabled(e.target.checked)} size="small" />}
            label="Enabled"
            sx={{ ml: 'auto', mr: 0 }}
          />
        )}
      </Box>
      {!enabled && !isLoading && (
        <Alert severity="info">
          This feature is disabled. Click the "Enabled" checkbox at the top right to enable it.
        </Alert>
      )}
      {enabled && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: '10px' }}>
            <Tabs
              value={currentTab}
              onChange={(_, newValue) => setCurrentTab(newValue)}
              aria-label="new additions tabs"
            >
              <Tab label="Data" />
              <Tab label="Notes" />
            </Tabs>
          </Box>
          <Box sx={{ display: currentTab !== 0 ? 'none' : 'block' }}>
            {isLoading && <Spinner />}
            {error && <Alert severity="error">{error}</Alert>}
            {data && <NewAdditionsTable initialData={data} showRowNumbers={true} />}
          </Box>
          <Box sx={{ display: currentTab !== 1 ? 'none' : 'block', p: 2 }}>
            <p>
              Make sure you set the <RouterLink to="/settings/main">Baseline Completion date</RouterLink> to define the
              starting point for new additions.
            </p>
          </Box>
        </>
      )}
    </Box>
  );
};
