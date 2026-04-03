import { useEffect, useState } from 'react';
import { getApiUrl } from '../../../api/api';

type Progress = {
  packetNum: number;
  totalPackets: number;
  totalResults: number;
};

type Result = {
  totalObservations: number;
  totalPackets: number;
  completedAt: string;
};

type LastRun = {
  lastRun: string;
  totalObservations: number;
  totalPackets: number;
  durationSeconds?: number;
  success: boolean;
};

export const useUpdateInaturalistData = () => {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);

  useEffect(() => {
    // Load last persisted run from disk
    fetch(getApiUrl('inat-data-log'))
      .then((r) => r.json())
      .then((data) => data && setLastRun(data))
      .catch(() => {});
  }, []);

  // Connect to the server-side state stream on mount. The server sends the current state
  // immediately, so navigating away and back (or logging out and in) will restore the
  // correct UI state without interrupting the download.
  useEffect(() => {
    const es = new EventSource(getApiUrl('inat-download-progress'));

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      setStartedAt(data.startedAt ?? null);
      setProgress(data.progress ?? null);
      setResult(data.result ?? null);
      setError(data.error ?? null);
      // When a download completes, refresh the persisted last-run panel
      if (data.status === 'done' && data.result) {
        setLastRun({
          lastRun: data.result.completedAt,
          totalObservations: data.result.totalObservations,
          totalPackets: data.result.totalPackets,
          success: true,
        });
      }
    };

    es.onerror = () => es.close();

    return () => es.close();
  }, []);

  const startSync = async (testMode = false) => {
    const url = testMode ? getApiUrl('start-inat-download') + '?maxPackets=10' : getApiUrl('start-inat-download');
    await fetch(url, { method: 'POST' });
    // State updates arrive via the SSE connection opened in useEffect above
  };

  return { status, startedAt, progress, result, error, lastRun, startSync };
};
