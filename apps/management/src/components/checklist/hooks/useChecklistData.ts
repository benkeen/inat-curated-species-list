import { useCallback, useState } from 'react';
import { NewAddition, TaxonChangeData } from '@ecophilia/inat-curated-species-list-tools';
import {
  getMainSettings,
  getSpeciesData,
  getNewAdditionsData,
  getTaxonChangesData,
  getNewAdditionsSettings,
} from '../../../api/api';
import type { MainSettings } from '../../../types';

type ChecklistSettings = {
  placeId: number;
  curatorUsernames: string[];
};

export const useChecklistData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [speciesData, setSpeciesData] = useState<any>(null);
  const [newAdditionsData, setNewAdditionsData] = useState<NewAddition[] | null>(null);
  const [taxonChangesData, setTaxonChangesData] = useState<Record<string, TaxonChangeData[]> | null>(null);
  const [settings, setSettings] = useState<ChecklistSettings | null>(null);
  const [newAdditionsEnabled, setNewAdditionsEnabled] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

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

      if (speciesResp.ok) {
        setSpeciesData(await speciesResp.json());
      } else {
        setSpeciesData(null);
      }

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
  }, []);

  return { isLoading, error, speciesData, newAdditionsData, taxonChangesData, settings, newAdditionsEnabled, loadData };
};
