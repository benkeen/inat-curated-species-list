import { describe, expect, test } from 'vitest';
import { layoutTaxonomyTree, TaxonomyTreeNode } from './taxonomyTree';
import { createTreeTransition, getTreeAnimationFrame } from './taxonomyTreeAnimation';

const node = (id: string, children: TaxonomyTreeNode[] = []): TaxonomyTreeNode => ({
  id,
  name: id,
  rank: null,
  speciesCount: 1,
  children,
});
const collapsed = layoutTaxonomyTree(node('root', [node('a'), node('b')]));
const expanded = layoutTaxonomyTree(node('root', [node('a', [node('a/1'), node('a/2'), node('a/3')]), node('b')]));

describe('taxonomy tree animation', () => {
  test('slides and fades entering nodes while moving existing nodes and their connectors together', () => {
    const sample = createTreeTransition(getTreeAnimationFrame(collapsed), expanded);
    const start = sample(0);
    const middle = sample(0.5);
    const entering = middle.nodes.find((item) => item.data.id === 'a/1')!;
    const target = expanded.nodes.find((item) => item.data.id === 'a/1')!;
    expect(start.nodes.find((item) => item.data.id === 'a/1')!.opacity).toBe(0);
    expect(entering.opacity).toBe(0.5);
    expect(entering.x).toBe(target.x - 8);
    const sibling = middle.nodes.find((item) => item.data.id === 'b')!;
    expect(sibling.y).toBe(
      (collapsed.nodes.find((item) => item.data.id === 'b')!.y +
        expanded.nodes.find((item) => item.data.id === 'b')!.y) /
        2,
    );
    for (const link of middle.links) {
      expect(middle.nodes).toContain(link.source);
      expect(middle.nodes).toContain(link.target);
    }
    expect(sample(1)).toEqual(getTreeAnimationFrame(expanded));
  });

  test('retains exiting nodes until the fade finishes without clipping them', () => {
    const sample = createTreeTransition(getTreeAnimationFrame(expanded), collapsed);
    const middle = sample(0.5);
    expect(middle.nodes.find((item) => item.data.id === 'a/1')).toMatchObject({ opacity: 0.5, exiting: true });
    expect(middle.height).toBe(expanded.height);
    expect(middle.width).toBe(expanded.width);
    expect(middle.columns).toEqual(expanded.columns);
    expect(sample(1).nodes.some((item) => item.data.id === 'a/1')).toBe(false);
    expect(sample(1).height).toBe(collapsed.height);
  });

  test('redirects an interrupted transition from its current positions and opacity', () => {
    const middle = createTreeTransition(getTreeAnimationFrame(collapsed), expanded)(0.4);
    const reversed = createTreeTransition(middle, collapsed);
    for (const item of middle.nodes) {
      expect(reversed(0).nodes.find((next) => next.key === item.key)).toMatchObject({
        x: item.x,
        y: item.y,
        opacity: item.opacity,
      });
    }
    expect(reversed(1)).toEqual(getTreeAnimationFrame(collapsed));
  });

  test('crossfades pin changes without sliding the hierarchy across columns', () => {
    const pinned = layoutTaxonomyTree(node('a', [node('a/1'), node('a/2'), node('a/3')]));
    const before = getTreeAnimationFrame(expanded);
    const middle = createTreeTransition(before, pinned)(0.5);
    const old = before.nodes.find((item) => item.data.id === 'a')!;
    const outgoing = middle.nodes.find((item) => item.key === old.key)!;
    const incoming = middle.nodes.find((item) => item.data.id === 'a' && !item.exiting)!;
    expect(outgoing).toMatchObject({ x: old.x, y: old.y, opacity: 0.5, exiting: true });
    expect(incoming).toMatchObject({ x: 120, opacity: 0.5 });
    expect(incoming.key).not.toBe(outgoing.key);
  });
});
