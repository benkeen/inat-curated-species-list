import { describe, expect, test } from 'vitest';
import { checklistLocationHash, defaultChecklistLocation, readChecklistLocation } from './checklistLocation';

describe('checklist bookmarks', () => {
  test('round-trips the complete view and preserves unrelated hash parameters', () => {
    const state = defaultChecklistLocation();
    state.open = true;
    state.tab = 2;
    state.view = 'tree';
    state.filter = 'Noctuidae|A & B';
    state.tree = {
      expanded: ['root', 'root/superfamily'],
      search: { filter: state.filter, expanded: ['root', 'root/superfamily/family'] },
      pinned: 'root/superfamily/family',
      isolated: ['root/superfamily/family', 'root/superfamily/family/genus'],
    };
    const hash = checklistLocationHash('#section=checklist', state);
    expect(new URLSearchParams(hash.slice(1)).get('section')).toBe('checklist');
    expect(readChecklistLocation(hash)).toEqual({ state, error: null });
    expect(readChecklistLocation(checklistLocationHash(hash, { ...state, open: false })).state.open).toBe(false);
  });

  test('uses fresh defaults for a URL without checklist state', () => {
    expect(readChecklistLocation('#section=checklist')).toEqual({ state: defaultChecklistLocation(), error: null });
    const first = defaultChecklistLocation();
    first.tree.expanded.push('other');
    expect(defaultChecklistLocation().tree.expanded).toEqual(['root']);
  });

  test('reports invalid, malformed and unsupported bookmarks explicitly', () => {
    for (const value of [
      '{broken',
      'null',
      '[]',
      JSON.stringify({ ...defaultChecklistLocation(), version: 2 }),
      JSON.stringify({ ...defaultChecklistLocation(), tab: 4 }),
      JSON.stringify({ ...defaultChecklistLocation(), tree: { expanded: [123] } }),
      JSON.stringify({
        ...defaultChecklistLocation(),
        tree: {
          ...defaultChecklistLocation().tree,
          search: { filter: 'x', expanded: [false] },
        },
      }),
    ]) {
      const { error } = readChecklistLocation(`#icsl=${encodeURIComponent(value)}`);
      expect(error).toContain('Could not restore the checklist bookmark');
    }
  });
});
