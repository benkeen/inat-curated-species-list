import { useCallback, useState } from 'react';
import { getCuratedSpeciesData } from '../../../api/api';

export type CuratedSpeciesEntry = {
  id: number;
  name: string;
  curatorReviewCount: number;
  taxonomy: Record<string, string>;
};

export type CuratedSpeciesFileData = {
  generationDate: string;
  data: CuratedSpeciesEntry[];
};

export const useCuratedSpeciesData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileData, setFileData] = useState<CuratedSpeciesFileData | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getCuratedSpeciesData();
      if (response.ok) {
        const json = (await response.json()) as CuratedSpeciesFileData | null;
        setFileData(json);
      } else {
        setError('Failed to load curated species data.');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, error, fileData, loadData };
};
