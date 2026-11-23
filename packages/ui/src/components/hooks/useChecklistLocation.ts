import { useMemo, useSyncExternalStore } from 'react';
import { checklistLocationHash, ChecklistLocationState, readChecklistLocation } from '../../utils/checklistLocation';

const eventName = 'icsl-location-change';
const subscribe = (notify: () => void) => {
  window.addEventListener('hashchange', notify);
  window.addEventListener('popstate', notify);
  window.addEventListener(eventName, notify);
  return () => {
    window.removeEventListener('hashchange', notify);
    window.removeEventListener('popstate', notify);
    window.removeEventListener(eventName, notify);
  };
};
const snapshot = () => window.location.hash;
const serverSnapshot = () => '';

export const useChecklistLocation = () => {
  const hash = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const location = useMemo(() => readChecklistLocation(hash), [hash]);
  const update = (change: (state: ChecklistLocationState) => ChecklistLocationState) => {
    const current = readChecklistLocation(window.location.hash).state;
    const nextHash = checklistLocationHash(window.location.hash, change(current));
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}${nextHash}`,
    );
    window.dispatchEvent(new Event(eventName));
  };
  return { ...location, update };
};
