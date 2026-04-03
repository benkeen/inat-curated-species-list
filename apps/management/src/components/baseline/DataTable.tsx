import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { INAT_SPECIES_URL } from '../../constants';
import ClearIcon from '@mui/icons-material/Clear';
import classes from './baseline.module.css';
import { BaselineSpeciesInatData } from '../../types';
import { IconButton } from '@mui/material';
import { formatNumber } from '../../utils';
import { SortCol, SortDir } from './BaselineData.types';

type DataTableProps = {
  data: BaselineSpeciesInatData[];
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (sortCol: SortCol, sortDir: SortDir) => void;
  onDeleteRow: (taxonId: number) => void;
};

type SortButtonProps = {
  sortCol: SortCol;
  currentSortCol: SortCol;
  currentSortDir: SortDir;
  onSort: (sortCol: SortCol, sortDir: SortDir) => void;
};

const SortButton = ({ sortCol, currentSortCol, currentSortDir, onSort }: SortButtonProps) => {
  let SortDirComponent = ArrowDropUpIcon;
  const style: any = {
    marginLeft: 5,
  };

  if (sortCol === currentSortCol) {
    SortDirComponent = currentSortDir === 'desc' ? ArrowDropDownIcon : ArrowDropUpIcon;
  }

  if (sortCol !== currentSortCol) {
    style.visibility = 'hidden';
  }

  let sortDir: SortDir = 'desc';
  if (sortCol === currentSortCol) {
    sortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
  }

  return (
    <IconButton size="small" style={style} onClick={() => onSort(sortCol, sortDir)} className="sortIcon">
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

export const DataTable = ({ data, onDeleteRow, sortCol, sortDir, onSort }: DataTableProps) => {
  const tableRows = useMemo(() => {
    return data.map((row, rowNum) => (
      <tr key={row.id}>
        <td className={classes.rowNum}>{rowNum + 1}</td>
        <td>{row.id}</td>
        <td>
          <a href={`${INAT_SPECIES_URL}/${row.id}`} target="_blank">
            {row.name}
          </a>
        </td>
        <td>
          <Chip label={formatNumber(row.researchGradeReviewCount || 0)} size="small" />
        </td>
        <td>
          {row.curatorReviewCount && <Chip label={formatNumber(row.curatorReviewCount)} size="small" color="success" />}
        </td>
        <td width={30} className={classes.deleteRow}>
          <ClearIcon onClick={() => onDeleteRow(row.id)} />
        </td>
      </tr>
    ));
  }, [data]);

  return (
    <Box overflow="scroll" flex="0 1 auto">
      <table cellSpacing={0} cellPadding={0} className={classes.baselineTable}>
        <thead>
          <tr>
            <th></th>
            <Th col="id" label="Taxon ID" style={{ width: 120 }} sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <Th col="name" label="Species" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <Th
              col="researchGradeReviewCount"
              label="Research Grade"
              sortCol={sortCol}
              sortDir={sortDir}
              onSort={onSort}
            />
            <Th col="curatorReviewCount" label="Curator reviews" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>{tableRows}</tbody>
      </table>
    </Box>
  );
};
