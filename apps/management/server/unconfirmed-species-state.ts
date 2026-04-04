export type UnconfirmedCheckProgress = {
  phase: 'downloading' | 'processing';
  currentPage: number;
  totalPages: number;
};

export type UnconfirmedCheckResult = {
  totalReported: number;
  totalUnconfirmed: number;
  completedAt: string;
};

export type UnconfirmedCheckState = {
  status: 'idle' | 'running' | 'done' | 'error';
  progress: UnconfirmedCheckProgress | null;
  result: UnconfirmedCheckResult | null;
  error: string | null;
};

const state: UnconfirmedCheckState = {
  status: 'idle',
  progress: null,
  result: null,
  error: null,
};

const subscribers = new Set<(state: UnconfirmedCheckState) => void>();

export const getUnconfirmedCheckState = (): UnconfirmedCheckState => ({ ...state });

export const setUnconfirmedCheckState = (updates: Partial<UnconfirmedCheckState>): void => {
  Object.assign(state, updates);
  const snapshot: UnconfirmedCheckState = { ...state };
  for (const fn of subscribers) {
    fn(snapshot);
  }
};

export const subscribeToUnconfirmedCheck = (fn: (state: UnconfirmedCheckState) => void): (() => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
