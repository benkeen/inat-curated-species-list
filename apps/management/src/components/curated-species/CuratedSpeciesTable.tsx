import { memo, useLayoutEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { IconButton } from '@mui/material';
import { INAT_SPECIES_URL } from '../../constants';
import classes from '../baseline/baseline.module.css';
import { formatNumber } from '../../utils';
import type { CuratedSpeciesEntry } from './hooks/useCuratedSpeciesData';

type SortCol = 'name' | 'curatorReviewCount' | 'family' | 'genus';
type SortDir = 'asc' | 'desc';

type SortButtonProps = {
  sortCol: SortCol;
  currentSortCol: SortCol;
  currentSortDir: SortDir;
  onSort: (sortCol: SortCol, sortDir: SortDir) => void;
};

const SortButton = ({ sortCol, currentSortCol, currentSortDir, onSort }: SortButtonProps) => {
  const SortDirComponent =
    sortCol === currentSortCol && currentSortDir === 'desc' ? ArrowDropDownIcon : ArrowDropUpIcon;
  const style: React.CSSProperties = {
    marginLeft: 5,
    visibility: sortCol !== currentSortCol ? 'hidden' : 'visible',
  };
  const nextDir: SortDir = sortCol === currentSortCol ? (currentSortDir === 'asc' ? 'desc' : 'asc') : 'desc';

  return (
    <IconButton size="small" style={style} onClick={() => onSort(sortCol, nextDir)} className="sortIcon">
      <SortDirComponent />
    </IconButton>
  );
};

const Th = ({ col, label, style, sortCol, sortDir, onSort }: any) => (
  <th style={style}>
    {label}
    <SortButton sortCol={col} currentSortCol={sortCol} currentSortDir={sortDir} onSort={onSort} />
  </th>
);

type DataRowProps = {
  row: CuratedSpeciesEntry;
  rowNum: number;
};

const DataRow = memo(({ row, rowNum }: DataRowProps) => (
  <tr style={{ backgroundColor: rowNum % 2 === 0 ? 'white' : '#efefef' }}>
    <td className={classes.rowNum}>{rowNum + 1}</td>
    <td style={{ width: 70 }}>{row.id}</td>
    <td>
      <a href={`${INAT_SPECIES_URL}/${row.id}`} target="_blank" rel="noreferrer">
        {row.name}
      </a>
    </td>
    <td>{row.taxonomy['family'] ?? '—'}</td>
    <td>{row.taxonomy['genus'] ?? '—'}</td>
    <td>
      <Chip label={formatNumber(row.curatorReviewCount)} size="small" color="default" />
    </td>
  </tr>
));

type CuratedSpeciesTableProps = {
  data: CuratedSpeciesEntry[];
};

export const CuratedSpeciesTable = ({ data }: CuratedSpeciesTableProps) => {
  const [sortCol, setSortCol] = useState<SortCol>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const onSort = (col: SortCol, dir: SortDir) => {
    setSortCol(col);
    setSortDir(dir);
  };

  const sorted = [...data].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    if (sortCol === 'curatorReviewCount') {
      aVal = a.curatorReviewCount;
      bVal = b.curatorReviewCount;
    } else if (sortCol === 'family' || sortCol === 'genus') {
      aVal = a.taxonomy[sortCol] ?? '';
      bVal = b.taxonomy[sortCol] ?? '';
    } else {
      aVal = a.name;
      bVal = b.name;
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const cmp = String(aVal).localeCompare(String(bVal));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  useLayoutEffect(() => {
    if (tbodyRef.current) {
      setScrollMargin(tbodyRef.current.getBoundingClientRect().top + window.scrollY);
    }
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: sorted.length,
    estimateSize: () => 34,
    overscan: 10,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start - scrollMargin : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  return (
    <Box flex="0 1 auto">
      <table cellSpacing={0} cellPadding={0} className={classes.baselineTable}>
        <thead>
          <tr>
            <th></th>
            <th style={{ width: 70 }}>ID</th>
            <Th col="name" label="Species" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <Th col="family" label="Family" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <Th col="genus" label="Genus" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <Th col="curatorReviewCount" label="Curator reviews" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: paddingTop }} colSpan={6} />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = sorted[virtualRow.index];
            return <DataRow key={row.id} row={row} rowNum={virtualRow.index} />;
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={6} />
            </tr>
          )}
        </tbody>
      </table>
    </Box>
  );
};
