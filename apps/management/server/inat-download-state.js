/**
 * Module-level download state. Lives for the lifetime of the server process, so clients can
 * connect, disconnect, and reconnect without losing visibility into an ongoing download.
 */

const state = {
  status: 'idle', // 'idle' | 'running' | 'done' | 'error'
  startedAt: null, // ISO string set when a download begins
  progress: null, // { packetNum, totalPackets, totalResults }
  result: null, // { totalObservations, totalPackets, completedAt }
  error: null, // string
};

const subscribers = new Set();

export const getDownloadState = () => ({ ...state });

export const setDownloadState = (updates) => {
  Object.assign(state, updates);
  const snapshot = { ...state };
  for (const fn of subscribers) {
    fn(snapshot);
  }
};

export const subscribeToDownload = (fn) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
