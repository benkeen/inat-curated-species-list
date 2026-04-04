import { useEffect, useState } from 'react';
import { getApiUrl, startUnconfirmedSpeciesCheck } from '../../../api/api';

type Progress = {
  phase: 'downloading' | 'processing';
  currentPage: number;
  totalPages: number;
};

type Result = {
  totalReported: number;
  totalUnconfirmed: number;
  completedAt: string;
};

export const useUnconfirmedSpeciesCheck = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource(getApiUrl('unconfirmed-species-progress'));

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      setProgress(data.progress ?? null);
      setResult(data.result ?? null);
      setError(data.error ?? null);
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  const startCheck = async () => {
    await startUnconfirmedSpeciesCheck();
  };

  return { status, progress, result, error, startCheck };
};
