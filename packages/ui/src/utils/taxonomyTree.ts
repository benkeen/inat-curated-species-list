import { CuratedSpeciesData, Taxon } from '@ecophilia/inat-curated-species-list-common';

export type TaxonomyTreeNode = {
  id: string;
  name: string;
  rank: Taxon | null;
  speciesCount: number;
  taxonId?: string;
  reviewCount?: number;
  children: TaxonomyTreeNode[];
};

export const buildTaxonomyTree = (data: CuratedSpeciesData, taxons: Taxon[]): TaxonomyTreeNode => {
  const root: TaxonomyTreeNode = { id: 'root', name: 'All species', rank: null, speciesCount: 0, children: [] };
  const ranks = taxons.filter((rank) => rank !== 'species');
  const childrenByNode = new WeakMap<TaxonomyTreeNode, Map<string, TaxonomyTreeNode>>();

  for (const [taxonId, species] of Object.entries(data)) {
    let node = root;
    node.speciesCount++;
    for (const rank of ranks) {
      const name = species.data[rank] || `Unclassified ${rank}`;
      const key = JSON.stringify([rank, species.data[rank] || null]);
      let children = childrenByNode.get(node);
      if (!children) {
        children = new Map();
        childrenByNode.set(node, children);
      }
      let child = children.get(key);
      if (!child) {
        const id = `${node.id}/${encodeURIComponent(key).replace(/\./g, '%2E')}`;
        child = { id, name, rank, speciesCount: 0, children: [] };
        children.set(key, child);
        node.children.push(child);
      }
      child.speciesCount++;
      node = child;
    }
    node.children.push({
      id: `${node.id}/${encodeURIComponent(JSON.stringify(['species', taxonId])).replace(/\./g, '%2E')}`,
      name: species.data.species || `Taxon ${taxonId}`,
      rank: 'species',
      speciesCount: 1,
      taxonId,
      reviewCount: species.count,
      children: [],
    });
  }

  return root;
};

export const getVisibleTaxonomyTree = (
  node: TaxonomyTreeNode,
  expanded: ReadonlySet<string>,
  isolated: readonly string[] = [],
): TaxonomyTreeNode => ({
  ...node,
  children: expanded.has(node.id)
    ? [...node.children]
        .filter((child) => {
          const selected = isolated.find((id) => id.slice(0, id.lastIndexOf('/')) === node.id);
          return !selected || child.id === selected;
        })
        .sort((a, b) => b.name.localeCompare(a.name))
        .map((child) => getVisibleTaxonomyTree(child, expanded, isolated))
    : [],
});

export const findTaxonomyNode = (root: TaxonomyTreeNode, id: string): TaxonomyTreeNode | undefined => {
  if (root.id === id) return root;
  for (const child of root.children) {
    if (id === child.id || id.startsWith(`${child.id}/`)) return findTaxonomyNode(child, id);
  }
  return undefined;
};

export const getTreeDimensions = (root: TaxonomyTreeNode): { leaves: number; depth: number } => {
  if (!root.children.length) return { leaves: 1, depth: 0 };
  const children = root.children.map(getTreeDimensions);
  return {
    leaves: children.reduce((sum, child) => sum + child.leaves, 0),
    depth: 1 + Math.max(...children.map((child) => child.depth)),
  };
};

export const getTaxonomySearchState = (root: TaxonomyTreeNode, filter: string) => {
  const expanded = new Set<string>(['root']);
  const matches = new Set<string>();
  if (!filter) return { expanded, matches };
  const pattern = new RegExp(filter, 'i');
  const visit = (node: TaxonomyTreeNode, ancestors: string[]) => {
    if (node.rank && pattern.test(node.name)) {
      matches.add(node.id);
      ancestors.forEach((id) => expanded.add(id));
    }
    node.children.forEach((child) => visit(child, [...ancestors, node.id]));
  };
  visit(root, []);
  return { expanded, matches };
};
