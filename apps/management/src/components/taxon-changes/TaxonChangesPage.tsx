import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { getTaxonChangesData, getTaxonChangesSettings, updateTaxonChangesSettings } from '../../api/api';
import { Spinner } from '../loading/spinner';
import { TaxonChangeData } from '@ecophilia/inat-curated-species-list-tools';
import { TaxonChangesTable } from './TaxonChangesTable';

export const TaxonChangesPage = () => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TaxonChangeData[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const settingsResp = await getTaxonChangesSettings();
        const { settings } = await settingsResp.json();
        const isEnabled = settings?.enabled ?? false;
        setEnabled(isEnabled);

        if (isEnabled) {
          await loadData();
        }
      } catch (e) {
        setError((e as Error).message);
        setEnabled(false);
      } finally {
        setIsLoadingSettings(false);
      }
    })();
  }, []);

  const loadData = async () => {
    const resp = await getTaxonChangesData();
    if (!resp.ok) {
      const body = await resp.json();
      throw new Error(body?.error ?? 'Failed to load taxon changes data.');
    }
    const json: Record<string, TaxonChangeData[]> = await resp.json();
    setData(Object.values(json).flat());
    setLoaded(true);
  };

  const onToggleEnabled = async (newEnabled: boolean) => {
    setEnabled(newEnabled);

    if (newEnabled && !loaded) {
      try {
        await loadData();
      } catch (e) {
        setError((e as Error).message);
      }
    }

    await updateTaxonChangesSettings({ enabled: newEnabled });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <h2>Taxon Changes</h2>
        {!isLoadingSettings && (
          <FormControlLabel
            control={<Checkbox checked={!!enabled} onChange={(e) => onToggleEnabled(e.target.checked)} size="small" />}
            label="Enabled"
            sx={{ ml: 'auto', mr: 0 }}
          />
        )}
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {!error && !enabled && !isLoadingSettings && (
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
              aria-label="taxon changes tabs"
            >
              <Tab label="Data" />
              <Tab label="Notes" />
            </Tabs>
          </Box>
          <Box sx={{ display: currentTab !== 0 ? 'none' : 'block' }}>
            {!loaded && <Spinner />}
            {loaded && <TaxonChangesTable data={data} />}
          </Box>
          <Box sx={{ display: currentTab !== 1 ? 'none' : 'block', p: 2 }} />
        </>
      )}
    </Box>
  );
};
