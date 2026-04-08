import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { CuratedSpeciesTable } from '@ecophilia/inat-curated-species-list-ui';
import { NewAddition, TaxonChangeData } from '@ecophilia/inat-curated-species-list-tools';
import {
  getMainSettings,
  getSpeciesData,
  getNewAdditionsData,
  getTaxonChangesData,
  getNewAdditionsSettings,
} from '../../api/api';
import type { MainSettings } from '../../types';
import { Spinner } from '../loading/spinner';

type ChecklistSettings = {
  placeId: number;
  curatorUsernames: string[];
};

export const CuratedChecklist = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speciesData, setSpeciesData] = useState<any>(null);
  const [newAdditionsData, setNewAdditionsData] = useState<NewAddition[] | null>(null);
  const [taxonChangesData, setTaxonChangesData] = useState<Record<string, TaxonChangeData[]> | null>(null);
  const [settings, setSettings] = useState<ChecklistSettings | null>(null);
  const [newAdditionsEnabled, setNewAdditionsEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [settingsResp, speciesResp, newAdditionsSettingsResp] = await Promise.all([
          getMainSettings(),
          getSpeciesData(),
          getNewAdditionsSettings(),
        ]);

        const { settings: mainSettings } = (await settingsResp.json()) as { settings: MainSettings };

        if (!mainSettings?.placeId) {
          setError('Project settings not configured. Please set placeId and curators in Settings → Main.');
          return;
        }

        if (!speciesResp.ok) {
          const body = await speciesResp.json();
          setError(body?.error ?? 'Failed to load species data.');
          return;
        }

        setSpeciesData(await speciesResp.json());

        const curatorUsernames = mainSettings.curators
          ? mainSettings.curators
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean)
          : [];

        setSettings({ placeId: mainSettings.placeId, curatorUsernames });

        const { settings: naSettings } = await newAdditionsSettingsResp.json();
        const isNewAdditionsEnabled = naSettings?.enabled ?? false;
        setNewAdditionsEnabled(isNewAdditionsEnabled);

        if (isNewAdditionsEnabled) {
          const naResp = await getNewAdditionsData();
          if (naResp.ok) {
            setNewAdditionsData(await naResp.json());
          }
        }

        const taxonResp = await getTaxonChangesData();
        if (taxonResp.ok) {
          setTaxonChangesData(await taxonResp.json());
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Spinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!speciesData || !settings) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">No checklist data found. Run checklist generation first.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
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
    </Box>
  );
};
