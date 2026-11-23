import { layoutTaxonomyTree, PositionedTaxonomyNode } from './taxonomyTree';

type TreeLayout = ReturnType<typeof layoutTaxonomyTree>;
export type AnimatedTaxonomyNode = PositionedTaxonomyNode & { key: string; opacity: number; exiting: boolean };
export type AnimatedTreeLayout = Omit<TreeLayout, 'nodes' | 'links'> & {
  rootId: string;
  nodes: AnimatedTaxonomyNode[];
  links: { source: AnimatedTaxonomyNode; target: AnimatedTaxonomyNode }[];
};

export const getTreeAnimationFrame = (layout: TreeLayout): AnimatedTreeLayout => {
  const rootId = layout.nodes[0]!.data.id;
  const nodes = layout.nodes.map((node) => ({ ...node, key: `${rootId}:${node.data.id}`, opacity: 1, exiting: false }));
  const byId = new Map(nodes.map((node) => [node.data.id, node]));
  return {
    ...layout,
    rootId,
    nodes,
    links: layout.links.map(({ source, target }) => ({
      source: byId.get(source.data.id)!,
      target: byId.get(target.data.id)!,
    })),
  };
};

export const createTreeTransition = (from: AnimatedTreeLayout, layout: TreeLayout) => {
  const to = getTreeAnimationFrame(layout);
  const crossfade = from.rootId !== to.rootId;
  const before = new Map(from.nodes.map((node) => [node.key, node]));
  const after = new Map(to.nodes.map((node) => [node.key, node]));
  const keys = new Set([...before.keys(), ...after.keys()]);
  const links = new Map([...from.links, ...to.links].map((link) => [link.target.key, link]));

  return (progress: number): AnimatedTreeLayout => {
    if (progress >= 1) return to;
    const eased = progress * progress * (3 - 2 * progress);
    const nodes = [...keys].map((key) => {
      const old = before.get(key);
      const next = after.get(key);
      const start = old ?? { ...next!, x: next!.x - (crossfade ? 0 : 16), opacity: 0 };
      const end = next ?? { ...old!, x: old!.x - (crossfade ? 0 : 16), opacity: 0 };
      return {
        ...end,
        key,
        x: start.x + (end.x - start.x) * eased,
        y: start.y + (end.y - start.y) * eased,
        opacity: start.opacity + (end.opacity - start.opacity) * eased,
        exiting: !next,
      };
    });
    const byKey = new Map(nodes.map((node) => [node.key, node]));
    return {
      ...to,
      width: Math.max(from.width, to.width),
      height: Math.max(from.height, to.height),
      columns: !crossfade && from.columns.length > to.columns.length ? from.columns : to.columns,
      nodes,
      links: [...links.values()].map(({ source, target }) => ({
        source: byKey.get(source.key)!,
        target: byKey.get(target.key)!,
      })),
    };
  };
};
