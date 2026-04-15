import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Typography from '@mui/material/Typography';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import NotesIcon from '@mui/icons-material/Notes';
import Tooltip from '@mui/material/Tooltip';
import { Link } from 'react-router';
import { INAT_SPECIES_URL } from '../../constants';
import classes from './baseline.module.css';
import { BaselineSpeciesInatData } from '../../types';
import { IconButton } from '@mui/material';
import { formatNumber } from '../../utils';
import { SortCol, SortDir } from './BaselineData.types';
import { NotesDialog } from './NotesDialog';
import { useDataTable } from './hooks/useDataTable';

type DataTableProps = {
  filterText: string;
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

type DataRowProps = {
  row: BaselineSpeciesInatData;
  rowNum: number;
  isSelected: boolean;
  onToggle: (id: number) => void;
  onOpenNotes: (row: BaselineSpeciesInatData) => void;
};

const DataRow = memo(({ row, rowNum, isSelected, onToggle, onOpenNotes }: DataRowProps) => (
  <tr style={{ backgroundColor: rowNum % 2 === 0 ? 'white' : '#efefef' }}>
    <td className={classes.rowNum}>{rowNum + 1}</td>
    <td>{row.id}</td>
    <td>
      <a href={`${INAT_SPECIES_URL}/${row.id}`} target="_blank">
        {row.name}
      </a>
    </td>
    <td style={{ color: row.isActive ? 'green' : 'red', fontSize: 12 }}>{row.isActive ? 'Active' : 'Inactive'}</td>
    <td>
      <Chip
        label={`${formatNumber(row.totalObservationCount || 0)} / ${formatNumber(row.researchGradeReviewCount || 0)}`}
        size="small"
      />
    </td>
    <td>
      <Chip label={formatNumber(row.curatorReviewCount ?? 0)} size="small" color="default" />
    </td>
    <td width={30}>
      <IconButton size="small" tabIndex={-1} onClick={() => onOpenNotes(row)} sx={{ p: 0.25 }}>
        <NotesIcon
          sx={{ fontSize: 16, color: row.publicNotes || row.privateNotes ? 'primary.main' : 'action.disabled' }}
        />
      </IconButton>
    </td>
    <td width={30}>
      <Checkbox size="small" checked={isSelected} onChange={() => onToggle(row.id)} sx={{ p: 0 }} />
    </td>
  </tr>
));

export const DataTable = ({ filterText }: DataTableProps) => {
  const { data, onDeleteRows, sortCol, sortDir, onSort } = useDataTable(filterText);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notesRow, setNotesRow] = useState<BaselineSpeciesInatData | null>(null);
  const tbodyRef = useRef<HTMLTableSectionElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    if (tbodyRef.current) {
      setScrollMargin(tbodyRef.current.getBoundingClientRect().top + window.scrollY);
    }
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: data.length,
    estimateSize: () => 34,
    overscan: 10,
    scrollMargin,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start - scrollMargin : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  const toggleRow = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleOpenNotes = useCallback((row: BaselineSpeciesInatData) => {
    setNotesRow(row);
  }, []);

  const handleCloseNotes = useCallback(() => {
    setNotesRow(null);
  }, []);

  const handleConfirmDelete = () => {
    onDeleteRows([...selectedIds]);
    setSelectedIds(new Set());
    setConfirmOpen(false);
  };

  const selectedSpecies = useMemo(() => data.filter((row) => selectedIds.has(row.id)), [data, selectedIds]);

  return (
    <>
      <Box flex="0 1 auto">
        <table cellSpacing={0} cellPadding={0} className={classes.baselineTable}>
          <thead>
            <tr>
              <th></th>
              <Th col="id" label="ID" style={{ width: 75 }} sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <Th col="name" label="Species" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <Th col="isActive" label="Active" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <Th
                col="researchGradeReviewCount"
                label={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    Obs
                    <Tooltip title="Total verifiable observations / Research grade observations" arrow>
                      <InfoOutlinedIcon sx={{ fontSize: 14, verticalAlign: 'middle', cursor: 'help', ml: '2px' }} />
                    </Tooltip>
                  </span>
                }
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={onSort}
              />
              <Th
                col="curatorReviewCount"
                label={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    Curator reviews
                    <Tooltip
                      title={
                        <span>
                          Number of observations identified to this taxon by a designated curator. Updated automatically
                          when iNat data is refreshed.
                          <br />
                          <br />
                          <Link to="/update-inat-data" style={{ color: 'inherit' }}>
                            Go to Update iNat data
                          </Link>
                        </span>
                      }
                      arrow
                    >
                      <InfoOutlinedIcon sx={{ fontSize: 14, verticalAlign: 'middle', cursor: 'help', ml: '2px' }} />
                    </Tooltip>
                  </span>
                }
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={onSort}
              />
              <Th
                col="notes"
                label="Notes"
                style={{ width: 100 }}
                sortCol={sortCol}
                sortDir={sortDir}
                onSort={onSort}
              />
              <th>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={selectedIds.size === 0}
                  onClick={() => setConfirmOpen(true)}
                  sx={{ minWidth: 0, px: 1, py: 0, fontSize: 11 }}
                >
                  Del
                </Button>
              </th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: paddingTop }} colSpan={8} />
              </tr>
            )}
            {virtualItems.map((virtualRow) => {
              const row = data[virtualRow.index];
              return (
                <DataRow
                  key={row.id}
                  row={row}
                  rowNum={virtualRow.index}
                  isSelected={selectedIds.has(row.id)}
                  onToggle={toggleRow}
                  onOpenNotes={handleOpenNotes}
                />
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: paddingBottom }} colSpan={8} />
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete baseline species</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to delete{' '}
            {selectedIds.size === 1 ? 'this species' : `these ${selectedIds.size} species`}?
          </Typography>
          <List dense disablePadding>
            {selectedSpecies.map((s) => (
              <ListItem key={s.id} disableGutters sx={{ py: 0 }}>
                <Typography variant="body2">
                  <em>{s.name}</em>
                </Typography>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button size="small" variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <NotesDialog row={notesRow} open={notesRow !== null} onClose={handleCloseNotes} />
    </>
  );
};
