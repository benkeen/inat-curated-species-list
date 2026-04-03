import { useEffect, useState } from 'react';
import { getApiUrl } from '../api/api';

type Progress = {
  packetNum: number;
  totalPackets: number;
  totalResults: number;
};

/**
 * Lightweight hook that subscribes to the server-side iNat download state stream
 * and returns the status, startedAt, and progress. Useful for showing global indicators
 * (e.g. a spinner in the header) without needing the full download hook.
 */
export const useInatDownloadStatus = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    const es = new EventSource(getApiUrl('inat-download-progress'));
    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      setStartedAt(data.startedAt ?? null);
      setProgress(data.progress ?? null);
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, []);

  return { status, startedAt, progress };
};
