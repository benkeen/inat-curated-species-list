import { createContext, useContext, useMemo, useState } from 'react';
import { Tree, NodeComponentProps } from '@nivo/tree';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { useChecklistLocation } from './hooks/useChecklistLocation';
import { constants, CuratedSpeciesData, Taxon } from '@ecophilia/inat-curated-species-list-common';
import {
  buildTaxonomyTree,
  findTaxonomyNode,
  getTaxonomySearchState,
  getTreeDimensions,
  getVisibleTaxonomyTree,
  TaxonomyTreeNode,
} from '../utils/taxonomyTree';

export interface TaxonomyTreeProps {
  readonly data: CuratedSpeciesData;
  readonly taxons: Taxon[];
  readonly curatorUsernames: string[];
  readonly placeId: number;
  readonly showReviewerCount?: boolean;
  readonly filter?: string;
}

type TreeContextValue = Pick<TaxonomyTreeProps, 'curatorUsernames' | 'placeId' | 'showReviewerCount'> & {
  expanded: ReadonlySet<string>;
  toggle: (id: string) => void;
  matches: ReadonlySet<string>;
  showOptions: (node: TaxonomyTreeNode, anchor: HTMLButtonElement) => void;
};
const TreeContext = createContext<TreeContextValue | null>(null);

const TreeNode = ({ node }: NodeComponentProps<TaxonomyTreeNode>) => {
  const context = useContext(TreeContext);
  if (!context) throw new Error('Taxonomy tree node must be rendered inside a TaxonomyTree.');
  const { expanded, toggle, matches, showOptions, showReviewerCount } = context;
  const item = node.data;
  const isExpanded = expanded.has(item.id);
  const commonStyle = {
    boxSizing: 'border-box' as const,
    width: '100%',
    minWidth: 0,
    height: '100%',
    display: 'flex',
    padding: '0 0 0 2px',
    alignItems: 'center',
    borderRadius: 4,
    border: 'none',
    background: matches.has(item.id) ? '#fff3cd' : '#f5f5f5',
    color: '#000000',
    font: '12px sans-serif',
    textAlign: 'left' as const,
    textDecoration: 'none',
    cursor: 'pointer',
  };

  return (
    <foreignObject x={node.x - 110} y={node.y - 12} width={230} height={28}>
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        {item.taxonId ? (
          <div style={{ ...commonStyle, cursor: 'default' }} title={item.name}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
              {item.name}
            </span>
            {showReviewerCount && (
              <Chip component="span" label={item.reviewCount} size="small" sx={{ ml: 'auto', flexShrink: 0 }} />
            )}
          </div>
        ) : (
          <button
            type="button"
            style={commonStyle}
            aria-expanded={isExpanded}
            title={`${item.name}: ${item.speciesCount} species`}
            onClick={() => toggle(item.id)}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
            <Chip component="span" label={item.speciesCount} size="small" sx={{ ml: 'auto', flexShrink: 0 }} />
          </button>
        )}
        {item.rank && (
          <IconButton
            size="small"
            aria-label={`Options for ${item.name}`}
            aria-haspopup="menu"
            onClick={(event) => showOptions(item, event.currentTarget)}
            sx={{ width: 28, height: 28, flexShrink: 0, fontSize: 18 }}
          >
            <span aria-hidden="true">&#8942;</span>
          </IconButton>
        )}
      </div>
    </foreignObject>
  );
};

export const TaxonomyTree = ({
  data,
  taxons,
  curatorUsernames,
  placeId,
  showReviewerCount,
  filter = '',
}: TaxonomyTreeProps) => {
  const root = useMemo(() => buildTaxonomyTree(data, taxons), [data, taxons]);
  const { state, update } = useChecklistLocation();
  const { tree } = state;
  const [menu, setMenu] = useState<{ node: TaxonomyTreeNode; anchor: HTMLButtonElement } | null>(null);
  const search = useMemo(() => getTaxonomySearchState(root, filter), [root, filter]);
  const activeExpanded = useMemo(
    () =>
      filter
        ? tree.search?.filter === filter
          ? new Set(tree.search.expanded)
          : search.expanded
        : new Set(tree.expanded),
    [filter, tree.search, tree.expanded, search.expanded],
  );
  const pinnedRoot = tree.pinned ? findTaxonomyNode(root, tree.pinned) : root;
  const missingIsolation = tree.isolated.some((id) => !findTaxonomyNode(root, id));
  const visibleTree = useMemo(
    () => (pinnedRoot ? getVisibleTaxonomyTree(pinnedRoot, activeExpanded, tree.isolated) : root),
    [root, pinnedRoot, activeExpanded, tree.isolated],
  );
  const { leaves, depth } = getTreeDimensions(visibleTree);

  const toggle = (id: string) => {
    const next = new Set(activeExpanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update((current) => ({
      ...current,
      tree: {
        ...current.tree,
        ...(filter ? { search: { filter, expanded: [...next] } } : { expanded: [...next] }),
      },
    }));
  };

  const pin = (id: string | null) => {
    update((current) => ({
      ...current,
      tree: {
        ...current.tree,
        pinned: id,
        ...(id
          ? filter
            ? { search: { filter, expanded: [...new Set([...activeExpanded, id])] } }
            : { expanded: [...new Set([...activeExpanded, id])] }
          : {}),
      },
    }));
    setMenu(null);
  };
  const isolate = (id: string) => {
    const parent = id.slice(0, id.lastIndexOf('/'));
    update((current) => ({
      ...current,
      tree: {
        ...current.tree,
        isolated: current.tree.isolated.includes(id)
          ? current.tree.isolated.filter((value) => value !== id)
          : [...current.tree.isolated.filter((value) => value.slice(0, value.lastIndexOf('/')) !== parent), id],
      },
    }));
    setMenu(null);
  };

  return (
    <div className="icsl-taxonomy-tree">
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {tree.pinned && (
          <Button size="small" onClick={() => pin(null)}>
            Unpin taxon
          </Button>
        )}
        {tree.isolated.length > 0 && (
          <Button
            size="small"
            onClick={() =>
              update((current) => ({
                ...current,
                tree: { ...current.tree, isolated: [] },
              }))
            }
          >
            Show all siblings
          </Button>
        )}
      </div>
      {tree.pinned && !pinnedRoot && (
        <Alert severity="info">The pinned taxon is not in the current results. Clear the filter or unpin it.</Alert>
      )}
      {missingIsolation && (
        <Alert severity="info">
          A taxon selected to hide its siblings is not in the current results. Clear the filter or show all siblings.
        </Alert>
      )}
      {!!root.speciesCount && !!pinnedRoot && (
        <div style={{ overflow: 'auto', maxHeight: '70vh', border: '1px solid #d5dfe8' }}>
          <TreeContext.Provider
            value={{
              expanded: activeExpanded,
              toggle,
              matches: search.matches,
              curatorUsernames,
              placeId,
              showReviewerCount,
              showOptions: (node, anchor) => setMenu({ node, anchor }),
            }}
          >
            <Tree
              data={visibleTree}
              width={Math.max(300, depth * 280 + 260)}
              height={Math.max(72, leaves * 32 + 40)}
              margin={{ top: 20, right: 140, bottom: 20, left: 120 }}
              identity="id"
              layout="left-to-right"
              mode="tree"
              linkCurve="bump"
              linkColor={{ from: 'source.color' }}
              nodeColor={{ scheme: 'category10' }}
              enableLabel={false}
              useMesh={false}
              animate={false}
              nodeComponent={TreeNode}
              role="group"
              ariaLabel="Taxonomy tree"
            />
          </TreeContext.Provider>
        </div>
      )}
      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => menu && pin(tree.pinned === menu.node.id ? null : menu.node.id)}>
          {tree.pinned === menu?.node.id ? 'Unpin taxon' : 'Pin taxon'}
        </MenuItem>
        <MenuItem onClick={() => menu && isolate(menu.node.id)}>
          {menu && tree.isolated.includes(menu.node.id) ? 'Show siblings' : 'Hide siblings'}
        </MenuItem>
        {menu?.node.taxonId && (
          <MenuItem
            component="a"
            href={`${constants.INAT_OBSERVATIONS_URL}?${new URLSearchParams({
              ident_user_id: curatorUsernames.join(','),
              place_id: String(placeId),
              taxon_id: menu.node.taxonId,
              verifiable: 'any',
            })}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenu(null)}
          >
            View on iNaturalist
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};
