/**
 * Module-level download state. Lives for the lifetime of the server process, so clients can
 * connect, disconnect, and reconnect without losing visibility into an ongoing download.
 */

export type DownloadProgress = {
  packetNum: number;
  totalPackets: number;
  totalResults: number;
};

export type DownloadResult = {
  totalObservations: number;
  totalPackets: number;
  completedAt: string;
};

export type DownloadState = {
  status: 'idle' | 'running' | 'done' | 'error';
  startedAt: string | null;
  progress: DownloadProgress | null;
  result: DownloadResult | null;
  error: string | null;
};

const state: DownloadState = {
  status: 'idle',
  startedAt: null,
  progress: null,
  result: null,
  error: null,
};

const subscribers = new Set<(state: DownloadState) => void>();

export const getDownloadState = (): DownloadState => ({ ...state });

export const setDownloadState = (updates: Partial<DownloadState>): void => {
  Object.assign(state, updates);
  const snapshot: DownloadState = { ...state };
  for (const fn of subscribers) {
    fn(snapshot);
  }
};

export const subscribeToDownload = (fn: (state: DownloadState) => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
