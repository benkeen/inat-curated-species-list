import { useState } from 'react';
import { generateCuratedSpecies } from '../../../api/api';

type GenerateStatus = 'idle' | 'running' | 'done' | 'error';

export const useGenerateCuratedSpecies = () => {
  const [status, setStatus] = useState<GenerateStatus>('idle');
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setStatus('running');
    setCount(null);
    setError(null);

    try {
      const response = await generateCuratedSpecies();
      const data = (await response.json()) as { success: boolean; count?: number; error?: string };

      if (data.success) {
        setStatus('done');
        setCount(data.count ?? null);
      } else {
        setStatus('error');
        setError(data.error ?? 'Unknown error');
      }
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  };

  return { status, count, error, generate };
};
