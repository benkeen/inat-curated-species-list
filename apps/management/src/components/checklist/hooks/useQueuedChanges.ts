import { useCallback, useState } from 'react';
import { getApiUrl } from '../../../api/api';

export type QueuedChanges = {
  generatedAt: string;
  currentSpeciesCount: number;
  committedSpeciesCount: number | null;
  speciesCountDiff: number | null;
  addedSpecies: string[];
  removedSpecies: string[];
  addedBaselineSpecies: string[];
  removedBaselineSpecies: string[];
};

export const useQueuedChanges = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QueuedChanges | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiUrl('queued-changes'));
      if (response.ok) {
        const json = (await response.json()) as QueuedChanges | null;
        setData(json);
      } else {
        setError('Failed to load queued changes.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, data, loadData };
};
