import { createContext, useContext, useMemo, useState } from 'react';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import { useChecklistLocation } from './hooks/useChecklistLocation';
import { useAnimatedTaxonomyTree } from './hooks/useAnimatedTaxonomyTree';
import { AnimatedTaxonomyNode } from '../utils/taxonomyTreeAnimation';
import { constants, CuratedSpeciesData, RootTaxon, Taxon } from '@ecophilia/inat-curated-species-list-common';
import {
  buildTaxonomyTree,
  findTaxonomyNode,
  getExpandableTaxonomyIds,
  getTaxonomySearchState,
  layoutTaxonomyTree,
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
  readonly rootTaxon?: RootTaxon;
}

const rankPalette = [210, 280, 170, 340, 235, 120, 190, 35].map((hue) => ({
  50: `hsl(${hue}, 35%, 97%)`,
  100: `hsl(${hue}, 42%, 92%)`,
  200: `hsl(${hue}, 42%, 83%)`,
  400: `hsl(${hue}, 35%, 62%)`,
  700: `hsl(${hue}, 32%, 38%)`,
  900: `hsl(${hue}, 32%, 25%)`,
}));
const getRankColors = (rank: Taxon | null, taxons: Taxon[]) =>
  rankPalette[rank === null ? 7 : Math.max(0, taxons.indexOf(rank)) % 7]!;

type TreeContextValue = Pick<TaxonomyTreeProps, 'curatorUsernames' | 'placeId' | 'showReviewerCount' | 'taxons'> & {
  expanded: ReadonlySet<string>;
  toggle: (id: string) => void;
  matches: ReadonlySet<string>;
  showOptions: (node: TaxonomyTreeNode, anchor: HTMLButtonElement) => void;
};
const TreeContext = createContext<TreeContextValue | null>(null);

const TreeNode = ({ node }: { node: AnimatedTaxonomyNode }) => {
  const context = useContext(TreeContext);
  if (!context) throw new Error('Taxonomy tree node must be rendered inside a TaxonomyTree.');
  const { expanded, toggle, matches, showOptions, showReviewerCount, taxons } = context;
  const item = node.data;
  const colors = getRankColors(item.rank, taxons);
  const chipStyle = { ml: 'auto', flexShrink: 0, backgroundColor: colors[200], color: colors[900] };
  const isExpanded = expanded.has(item.id);
  const commonStyle = {
    boxSizing: 'border-box' as const,
    width: '100%',
    minWidth: 0,
    height: '100%',
    display: 'flex',
    padding: '0 2px',
    alignItems: 'center',
    borderRadius: 4,
    border: 'none',
    background: matches.has(item.id) ? '#fff3cd' : colors[100],
    boxShadow: matches.has(item.id) ? 'inset 0 0 0 1px #d59a00' : undefined,
    color: colors[900],
    font: '12px sans-serif',
    textAlign: 'left' as const,
    textDecoration: 'none',
    cursor: 'pointer',
  };

  return (
    <foreignObject
      x={node.x - 110}
      y={node.y - 14}
      width={230}
      height={28}
      opacity={node.opacity}
      aria-hidden={node.exiting || undefined}
      style={{ pointerEvents: node.exiting ? 'none' : undefined }}
    >
      <div style={{ display: 'flex', height: '100%', alignItems: 'center' }}>
        {item.taxonId ? (
          <div style={{ ...commonStyle, cursor: 'default' }} title={item.name}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
              {item.name}
            </span>
            {showReviewerCount && <Chip component="span" label={item.reviewCount} size="small" sx={chipStyle} />}
          </div>
        ) : (
          <button
            type="button"
            disabled={node.exiting}
            style={commonStyle}
            aria-expanded={isExpanded}
            title={`${item.name}: ${item.speciesCount} species`}
            onClick={() => toggle(item.id)}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: item.isUnclassified ? '#999999' : undefined,
                marginLeft: item.isUnclassified ? 10 : undefined,
              }}
            >
              {item.name}
            </span>
            <Chip component="span" label={item.speciesCount} size="small" sx={chipStyle} />
          </button>
        )}
        {
          <IconButton
            size="small"
            disabled={node.exiting}
            aria-label={`Options for ${item.name}`}
            aria-haspopup="menu"
            onClick={(event) => showOptions(item, event.currentTarget)}
            sx={{ width: 28, height: 28, flexShrink: 0, fontSize: 18, color: colors[700] }}
          >
            <span aria-hidden="true">&#8942;</span>
          </IconButton>
        }
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
  rootTaxon,
}: TaxonomyTreeProps) => {
  const metadata = rootTaxon ?? Object.values(data).find((species) => species.rootTaxon)?.rootTaxon;
  const root = useMemo(() => buildTaxonomyTree(data, taxons, rootTaxon), [data, taxons, rootTaxon]);
  const { state, update } = useChecklistLocation();
  const { tree } = state;
  const [menu, setMenu] = useState<{ node: TaxonomyTreeNode; anchor: HTMLButtonElement } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
  const targetLayout = useMemo(() => layoutTaxonomyTree(visibleTree), [visibleTree]);
  const layout = useAnimatedTaxonomyTree(targetLayout);

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

  const expandDescendants = (id: string) => {
    const node = findTaxonomyNode(root, id);
    if (!node) throw new Error('Cannot expand a taxon that is no longer in the tree.');
    const next = new Set([...activeExpanded, ...getExpandableTaxonomyIds(node)]);
    update((current) => ({
      ...current,
      tree: {
        ...current.tree,
        ...(filter ? { search: { filter, expanded: [...next] } } : { expanded: [...next] }),
      },
    }));
    setMenuOpen(false);
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
    setMenuOpen(false);
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
    setMenuOpen(false);
  };
  const showAllSiblings = () => {
    update((current) => ({ ...current, tree: { ...current.tree, isolated: [] } }));
    setMenuOpen(false);
  };

  return (
    <div className="icsl-taxonomy-tree">
      {tree.pinned && !pinnedRoot && (
        <Alert
          severity="info"
          action={
            <Button size="small" onClick={() => pin(null)}>
              Unpin taxon
            </Button>
          }
        >
          The pinned taxon is not in the current results. Clear the filter or unpin it.
        </Alert>
      )}
      {missingIsolation && (
        <Alert
          severity="info"
          action={
            <Button size="small" onClick={showAllSiblings}>
              Show all siblings
            </Button>
          }
        >
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
              taxons,
              curatorUsernames,
              placeId,
              showReviewerCount,
              showOptions: (node, anchor) => {
                setMenu({ node, anchor });
                setMenuOpen(true);
              },
            }}
          >
            <div
              role="group"
              aria-label="Taxonomy ranks"
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                width: layout.width,
                height: 36,
                background: '#ffffff',
                borderBottom: '1px solid #d5dfe8',
                boxSizing: 'border-box',
              }}
            >
              {layout.columns.map(({ x, rank }, index) => (
                <div
                  key={x}
                  style={{
                    position: 'absolute',
                    left: index === 0 ? 0 : x - 135,
                    width: Math.min(index === 0 ? 265 : 280, layout.width - (index === 0 ? 0 : x - 135)),
                    height: '100%',
                    boxSizing: 'border-box',
                    background: getRankColors(rank, taxons)[100],
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: index === 0 ? 10 : 25,
                    font: '400 14px sans-serif',
                    color: getRankColors(rank, taxons)[900],
                  }}
                >
                  {rank
                    ? rank.charAt(0).toUpperCase() + rank.slice(1)
                    : metadata
                      ? metadata.rank.charAt(0).toUpperCase() + metadata.rank.slice(1)
                      : 'All species'}
                </div>
              ))}
              <svg
                width={layout.width}
                height={36}
                aria-hidden="true"
                stroke="#d5dfe8"
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
              >
                {layout.columns.slice(1).map(({ x }) => (
                  <line key={x} x1={x - 135} x2={x - 135} y1={0} y2={36} />
                ))}
                <line x1={layout.width - 0.5} x2={layout.width - 0.5} y1={0} y2={36} />
              </svg>
            </div>
            <svg
              width={layout.width}
              height={layout.height}
              role="group"
              aria-label="Taxonomy tree"
              style={{ display: 'block' }}
            >
              <g aria-hidden="true">
                {layout.columns.map(({ x, rank }, index) => {
                  const left = index === 0 ? 0 : x - 135;
                  return (
                    <rect
                      key={x}
                      x={left}
                      y={0}
                      width={Math.min(index === 0 ? 265 : 280, layout.width - left)}
                      height={layout.height}
                      fill={getRankColors(rank, taxons)[50]}
                    />
                  );
                })}
              </g>
              <g strokeDasharray="1 4" strokeLinecap="round" aria-hidden="true">
                {layout.columns.slice(1).map(({ x, rank }) => (
                  <line
                    key={x}
                    x1={x - 135}
                    x2={x - 135}
                    y1={0}
                    y2={layout.height}
                    stroke={getRankColors(rank, taxons)[400]}
                  />
                ))}
                <line
                  x1={layout.width - 0.5}
                  x2={layout.width - 0.5}
                  y1={0}
                  y2={layout.height}
                  stroke={getRankColors(layout.columns[layout.columns.length - 1]!.rank, taxons)[400]}
                />
              </g>
              <g fill="none" stroke="#90a4ae" aria-hidden="true">
                {layout.links.map(({ source, target }) => {
                  const start = source.x + 120;
                  const end = target.x - 110;
                  const middle = (start + end) / 2;
                  return (
                    <path
                      key={target.key}
                      opacity={Math.min(source.opacity, target.opacity)}
                      stroke={getRankColors(target.data.rank, taxons)[400]}
                      d={`M${start},${source.y} C${middle},${source.y} ${middle},${target.y} ${end},${target.y}`}
                    />
                  );
                })}
              </g>
              {layout.nodes.map((node) => (
                <TreeNode key={node.key} node={node} />
              ))}
            </svg>
          </TreeContext.Provider>
        </div>
      )}
      <Menu anchorEl={menu?.anchor} open={menuOpen} onClose={() => setMenuOpen(false)}>
        {menu && menu.node.rank !== 'species' && (
          <MenuItem onClick={() => expandDescendants(menu.node.id)}>Expand all descendants</MenuItem>
        )}
        {menu?.node.id !== 'root' && (
          <MenuItem onClick={() => menu && pin(tree.pinned === menu.node.id ? null : menu.node.id)}>
            {tree.pinned === menu?.node.id ? 'Unpin taxon' : 'Pin taxon'}
          </MenuItem>
        )}
        {menu?.node.id !== 'root' && (
          <MenuItem onClick={() => menu && isolate(menu.node.id)}>
            {menu && tree.isolated.includes(menu.node.id) ? 'Show siblings' : 'Hide siblings'}
          </MenuItem>
        )}
        {tree.isolated.length > 0 && <MenuItem onClick={showAllSiblings}>Show all siblings</MenuItem>}
        {menu?.node.taxonId ? (
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
            onClick={() => setMenuOpen(false)}
          >
            View on iNaturalist
          </MenuItem>
        ) : (
          <MenuItem
            component="a"
            disabled={!menu?.node.inatTaxonId}
            href={menu?.node.inatTaxonId ? `${constants.INAT_TAXON_URL}/${menu.node.inatTaxonId}` : undefined}
            target="_blank"
            rel="noreferrer"
            onClick={() => setMenuOpen(false)}
          >
            View on iNaturalist
          </MenuItem>
        )}
      </Menu>
    </div>
  );
};
