import { describe, expect, test } from 'vitest';
import { CuratedSpeciesData, TaxonomyMap } from '@ecophilia/inat-curated-species-list-common';
import {
  buildTaxonomyTree,
  findTaxonomyNode,
  getTaxonomySearchState,
  getTreeDimensions,
  getVisibleTaxonomyTree,
  layoutTaxonomyTree,
} from './taxonomyTree';

const taxonomy = (values: Partial<TaxonomyMap>): TaxonomyMap => ({
  kingdom: '',
  phylum: '',
  subphylum: '',
  class: '',
  subclass: '',
  order: '',
  superfamily: '',
  family: '',
  subfamily: '',
  tribe: '',
  subtribe: '',
  genus: '',
  subgenus: '',
  section: '',
  species: '',
  ...values,
});

describe('buildTaxonomyTree', () => {
  test('uses root metadata and rank IDs without treating groups as species', () => {
    const data = {
      '1': { data: taxonomy({ family: 'A', species: 'A alpha' }), count: 1, taxonIds: { family: 42 } },
    };
    const root = { id: 47157, name: 'Lepidoptera', rank: 'order' as const };
    const tree = buildTaxonomyTree(data, ['family', 'species'], root);
    expect(tree).toMatchObject({ name: 'Lepidoptera', inatTaxonId: 47157 });
    expect(tree.children[0]).toMatchObject({ inatTaxonId: 42 });
    expect(tree.children[0]!.taxonId).toBeUndefined();
    expect(tree.children[0]!.children[0]!.taxonId).toBe('1');
    expect(buildTaxonomyTree({}, ['family', 'species'], root).name).toBe('Lepidoptera');
  });
  test('allocates descendant rows to expanded branches while keeping collapsed siblings compact at every rank', () => {
    const tree = buildTaxonomyTree(
      {
        '1': { data: taxonomy({ family: 'A', genus: 'X', species: 'X alpha' }), count: 1 },
        '2': { data: taxonomy({ family: 'A', genus: 'X', species: 'X beta' }), count: 1 },
        '3': { data: taxonomy({ family: 'A', genus: 'X', species: 'X gamma' }), count: 1 },
        '4': { data: taxonomy({ family: 'A', genus: 'Y', species: 'Y alpha' }), count: 1 },
        '5': { data: taxonomy({ family: 'A', genus: 'Z', species: 'Z alpha' }), count: 1 },
        '6': { data: taxonomy({ family: 'B', genus: 'B', species: 'B alpha' }), count: 1 },
        '7': { data: taxonomy({ family: 'C', genus: 'C', species: 'C alpha' }), count: 1 },
      },
      ['family', 'genus', 'species'],
    );
    const family = tree.children[0]!;
    const genus = family.children[0]!;
    const expanded = layoutTaxonomyTree(getVisibleTaxonomyTree(tree, new Set([tree.id, family.id, genus.id])));
    const position = (id: string) => expanded.nodes.find((node) => node.data.id === id)!;
    const leaves = expanded.nodes.filter((node) => !node.data.children.length);
    expect(leaves.map((node) => node.data.name)).toEqual(['X alpha', 'X beta', 'X gamma', 'Y', 'Z', 'B', 'C']);
    leaves.slice(1).forEach((node, index) => expect(node.y - leaves[index]!.y).toBe(32));
    expect(position(genus.id).y).toBe((position(genus.children[0]!.id).y + position(genus.children[2]!.id).y) / 2);
    expect(position(family.id).y).toBe((leaves[0]!.y + position(family.children[2]!.id).y) / 2);
    expect(position(tree.children[1]!.id).y - position(family.id).y).toBe(96);
    expect(position(tree.children[2]!.id).y - position(tree.children[1]!.id).y).toBe(32);
    expect(expanded.links).toHaveLength(expanded.nodes.length - 1);
    expect(expanded.columns).toEqual([
      { x: 120, rank: null },
      { x: 400, rank: 'family' },
      { x: 680, rank: 'genus' },
      { x: 960, rank: 'species' },
    ]);
    for (const { source, target } of expanded.links) {
      expect(source.data.children).toContain(target.data);
      expect(target.x - source.x).toBe(280);
    }
    expect(expanded.height).toBe(264);
    expect(expanded.nodes.every((node) => node.y - 14 >= 0 && node.y + 14 <= expanded.height)).toBe(true);

    const collapsed = layoutTaxonomyTree(getVisibleTaxonomyTree(tree, new Set([tree.id])));
    expect(collapsed.nodes.filter((node) => node.data.rank === 'family').map((node) => node.y)).toEqual([34, 66, 98]);
    expect(collapsed.height).toBe(136);
  });
  test('lays out a single collapsed or pinned root in one row', () => {
    const tree = buildTaxonomyTree({ '1': { data: taxonomy({ family: 'A', species: 'A alpha' }), count: 1 } }, [
      'family',
      'species',
    ]);
    for (const root of [tree, tree.children[0]!]) {
      const layout = layoutTaxonomyTree(getVisibleTaxonomyTree(root, new Set()));
      expect(layout.nodes).toEqual([{ data: { ...root, children: [] }, x: 120, y: 34 }]);
      expect(layout.links).toEqual([]);
      expect(layout.columns).toEqual([{ x: 120, rank: root.rank }]);
      expect(layout.height).toBe(72);
    }
  });
  test('pins a subtree and hides only siblings under the selected parent', () => {
    const tree = buildTaxonomyTree(
      {
        '1': { data: taxonomy({ family: 'A', genus: 'X', species: 'X alpha' }), count: 1 },
        '2': { data: taxonomy({ family: 'A', genus: 'Y', species: 'Y beta' }), count: 1 },
        '3': { data: taxonomy({ family: 'B', genus: 'Z', species: 'Z gamma' }), count: 1 },
      },
      ['family', 'genus', 'species'],
    );
    const family = tree.children[0]!;
    const genus = family.children[0]!;
    const pinned = findTaxonomyNode(tree, family.id)!;
    expect(pinned.name).toBe('A');
    expect(findTaxonomyNode(tree, 'root/missing')).toBeUndefined();
    const expanded = new Set([tree.id, family.id, genus.id]);
    const visible = getVisibleTaxonomyTree(tree, expanded, [genus.id]);
    expect(visible.children).toHaveLength(2);
    expect(visible.children.find((node) => node.id === family.id)!.children.map((node) => node.id)).toEqual([genus.id]);
    const focused = getVisibleTaxonomyTree(pinned, expanded, [genus.id]);
    expect(focused.id).toBe(family.id);
    expect(focused.children).toHaveLength(1);
    expect(getVisibleTaxonomyTree(pinned, expanded).children).toHaveLength(2);
    expect(getVisibleTaxonomyTree(tree, expanded, [family.id]).children).toHaveLength(1);
  });
  test('search reveals matching paths without opening all descendants of a matching family', () => {
    const tree = buildTaxonomyTree(
      {
        '1': {
          data: taxonomy({ superfamily: 'Noctuoidea', family: 'Noctuidae', genus: 'Euxoa', species: 'Euxoa alpha' }),
          count: 1,
        },
        '2': {
          data: taxonomy({ superfamily: 'Other', family: 'Other family', genus: 'Euxoa', species: 'Euxoa beta' }),
          count: 1,
        },
      },
      ['superfamily', 'family', 'genus', 'species'],
    );
    const superfamily = tree.children[0]!;
    const family = superfamily.children[0]!;
    const search = getTaxonomySearchState(tree, 'noctuidae');
    expect(search.matches).toEqual(new Set([family.id]));
    expect(search.expanded).toEqual(new Set(['root', superfamily.id]));
    expect(
      getVisibleTaxonomyTree(tree, search.expanded).children.find((node) => node.id === superfamily.id)!.children[0]!
        .children,
    ).toEqual([]);
    const multiple = getTaxonomySearchState(tree, '^Euxoa$');
    expect(multiple.matches.size).toBe(2);
    for (const branch of tree.children) {
      expect(multiple.expanded.has(branch.id)).toBe(true);
      expect(multiple.expanded.has(branch.children[0]!.id)).toBe(true);
    }
    const species = getTaxonomySearchState(tree, 'alpha');
    expect(species.expanded.has(family.children[0]!.id)).toBe(true);
    expect(getTaxonomySearchState(tree, '').matches.size).toBe(0);
    expect(getTaxonomySearchState(tree, 'no match').expanded).toEqual(new Set(['root']));
  });
  test('groups species by rank and preserves missing ranks, counts, and identities', () => {
    const data: CuratedSpeciesData = {
      '1': { data: taxonomy({ family: 'A', genus: 'X', species: 'X alpha' }), count: 8 },
      '2': { data: taxonomy({ family: 'A', species: 'Unknown beta' }), count: 2 },
      '3': { data: taxonomy({ family: 'B', genus: 'X', species: 'X gamma' }), count: 5 },
    };
    const tree = buildTaxonomyTree(data, ['family', 'genus', 'species']);

    expect(tree.speciesCount).toBe(3);
    expect(tree.name).toBe('All species');
    expect(tree.children.map(({ name, speciesCount }) => [name, speciesCount])).toEqual([
      ['A', 2],
      ['B', 1],
    ]);
    expect(tree.children[0]!.children.map(({ name, speciesCount }) => [name, speciesCount])).toEqual([
      ['X', 1],
      ['\u2014', 1],
    ]);
    expect(tree.children[0]!.children[1]!.isUnclassified).toBe(true);
    expect(tree.children[0]!.children[0]!.children[0]).toMatchObject({
      name: 'X alpha',
      taxonId: '1',
      reviewCount: 8,
      speciesCount: 1,
    });
    expect(tree.children[1]!.children[0]!.children[0]!.taxonId).toBe('3');
  });

  test('supports empty data and a checklist with only species', () => {
    expect(buildTaxonomyTree({}, ['species']).children).toEqual([]);
    const tree = buildTaxonomyTree({ '1': { data: taxonomy({ species: 'X alpha' }), count: 1 } }, ['species']);
    expect(tree.children[0]).toMatchObject({ name: 'X alpha', taxonId: '1' });
  });

  test('does not merge a named group with an unclassified group', () => {
    const tree = buildTaxonomyTree(
      {
        '1': { data: taxonomy({ genus: '\u2014', species: 'A' }), count: 1 },
        '2': { data: taxonomy({ species: 'B' }), count: 1 },
      },
      ['genus', 'species'],
    );
    expect(tree.children).toHaveLength(2);
    expect(tree.children[0]!.id).not.toBe(tree.children[1]!.id);
    expect(tree.children[0]!.isUnclassified).toBe(false);
    expect(tree.children[1]!.isUnclassified).toBe(true);
  });

  test('expands branches independently and retains distinct identities for repeated names', () => {
    const tree = buildTaxonomyTree(
      {
        '1': { data: taxonomy({ family: 'A', genus: 'X', species: 'X alpha' }), count: 1 },
        '2': { data: taxonomy({ family: 'B', genus: 'X', species: 'X beta' }), count: 1 },
      },
      ['family', 'genus', 'species'],
    );
    const firstFamily = tree.children[0]!;
    const secondFamily = tree.children[1]!;
    expect(firstFamily.children[0]!.id).not.toBe(secondFamily.children[0]!.id);
    const expanded = new Set([tree.id, firstFamily.id, secondFamily.id, firstFamily.children[0]!.id]);
    const visible = getVisibleTaxonomyTree(tree, expanded);
    const firstVisible = visible.children.find((child) => child.id === firstFamily.id)!;
    const secondVisible = visible.children.find((child) => child.id === secondFamily.id)!;
    expect(firstVisible.children[0]!.children[0]!.name).toBe('X alpha');
    expect(secondVisible.children[0]!.children).toEqual([]);
    expect(getTreeDimensions(visible)).toEqual({ leaves: 2, depth: 3 });
    expanded.delete(firstFamily.id);
    const collapsed = getVisibleTaxonomyTree(tree, expanded);
    expect(collapsed.children.find((child) => child.id === firstFamily.id)!.children).toEqual([]);
    expect(collapsed.children.find((child) => child.id === secondFamily.id)!.children).toHaveLength(1);
    expanded.add(firstFamily.id);
    expect(
      getVisibleTaxonomyTree(tree, expanded).children.find((child) => child.id === firstFamily.id)!.children[0]!
        .children,
    ).toHaveLength(1);
  });
});
