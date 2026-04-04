import { useState } from 'react';
import { getApiUrl } from '../../../api/api';

type GenerateStatus = 'idle' | 'running' | 'done' | 'error';

type GenerateResult = {
  filesGenerated: string[];
  durationSeconds: number;
};

export const useGenerateChecklist = () => {
  const [status, setStatus] = useState<GenerateStatus>('idle');
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateChecklist = async () => {
    setStatus('running');
    setResult(null);
    setError(null);

    try {
      const response = await fetch(getApiUrl('generate-checklist'), { method: 'POST' });
      const data = (await response.json()) as { success: boolean; error?: string } & Partial<GenerateResult>;

      if (data.success) {
        setStatus('done');
        setResult({ filesGenerated: data.filesGenerated ?? [], durationSeconds: data.durationSeconds ?? 0 });
      } else {
        setStatus('error');
        setError(data.error ?? 'Unknown error');
      }
    } catch (e) {
      setStatus('error');
      setError((e as Error).message);
    }
  };

  return { status, result, error, generateChecklist };
};
