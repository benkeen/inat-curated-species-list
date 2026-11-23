export type ChecklistTreeState = {
  expanded: string[];
  search: { filter: string; expanded: string[] } | null;
  pinned: string | null;
  isolated: string[];
};

export type ChecklistLocationState = {
  version: 1;
  open: boolean;
  tab: number;
  view: 'table' | 'tree';
  filter: string;
  tree: ChecklistTreeState;
};

export const defaultChecklistLocation = (): ChecklistLocationState => ({
  version: 1,
  open: false,
  tab: 0,
  view: 'table',
  filter: '',
  tree: { expanded: ['root'], search: null, pinned: null, isolated: [] },
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isStrings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isChecklistLocation = (value: unknown): value is ChecklistLocationState => {
  if (!isRecord(value) || !isRecord(value.tree)) return false;
  const tree = value.tree;
  return (
    value.version === 1 &&
    typeof value.open === 'boolean' &&
    (value.tab === 0 || value.tab === 1 || value.tab === 2) &&
    (value.view === 'table' || value.view === 'tree') &&
    typeof value.filter === 'string' &&
    isStrings(tree.expanded) &&
    isStrings(tree.isolated) &&
    (tree.pinned === null || typeof tree.pinned === 'string') &&
    (tree.search === null ||
      (isRecord(tree.search) && typeof tree.search.filter === 'string' && isStrings(tree.search.expanded)))
  );
};

export const readChecklistLocation = (hash: string): { state: ChecklistLocationState; error: string | null } => {
  const value = new URLSearchParams(hash.replace(/^#/, '')).get('icsl');
  if (value === null) return { state: defaultChecklistLocation(), error: null };
  try {
    const state: unknown = JSON.parse(value);
    if (!isChecklistLocation(state)) throw new Error('Unsupported or invalid checklist bookmark.');
    return { state, error: null };
  } catch (error) {
    return {
      state: defaultChecklistLocation(),
      error: `Could not restore the checklist bookmark: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
};

export const checklistLocationHash = (hash: string, state: ChecklistLocationState): string => {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  params.set('icsl', JSON.stringify(state));
  return `#${params}`;
};
