import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { IconButton } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import { getUnconfirmedSpecies } from '../../api/api';
import { addAndSaveBaselineSpecies } from '../../store/baselineData/baselineData.actions';
import { CheckUnconfirmedSpeciesDialog } from './CheckUnconfirmedSpeciesDialog';
import { INAT_SPECIES_URL } from '../../constants';
import classes from '../baseline/baseline.module.css';

type UnconfirmedSpeciesEntry = {
  name: string;
  taxonId: string;
  count: number;
};

type UnconfirmedSpeciesData = {
  dateGenerated: string;
  totalReported: number;
  totalUnconfirmed: number;
  species: UnconfirmedSpeciesEntry[];
};

type SortCol = 'taxonId' | 'name' | 'count';
type SortDir = 'asc' | 'desc';

type SortButtonProps = {
  sortCol: SortCol;
  currentSortCol: SortCol;
  currentSortDir: SortDir;
  onSort: (col: SortCol, dir: SortDir) => void;
};

const SortButton = ({ sortCol, currentSortCol, currentSortDir, onSort }: SortButtonProps) => {
  const SortDirComponent =
    sortCol === currentSortCol && currentSortDir === 'desc' ? ArrowDropDownIcon : ArrowDropUpIcon;
  const style: React.CSSProperties = {
    marginLeft: 5,
    visibility: sortCol !== currentSortCol ? 'hidden' : undefined,
  };
  const nextDir: SortDir = sortCol === currentSortCol ? (currentSortDir === 'asc' ? 'desc' : 'asc') : 'desc';
  return (
    <IconButton size="small" style={style} onClick={() => onSort(sortCol, nextDir)} className="sortIcon">
      <SortDirComponent />
    </IconButton>
  );
};

const Th = ({
  col,
  label,
  style,
  sortCol,
  sortDir,
  onSort,
}: {
  col: SortCol;
  label: string;
  style?: React.CSSProperties;
  sortCol: SortCol;
  sortDir: SortDir;
  onSort: (col: SortCol, dir: SortDir) => void;
}) => (
  <th style={style}>
    {label}
    <SortButton sortCol={col} currentSortCol={sortCol} currentSortDir={sortDir} onSort={onSort} />
  </th>
);

export const UnconfirmedSpecies = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState<UnconfirmedSpeciesData | null>(null);
  const [fileExists, setFileExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortCol, setSortCol] = useState<SortCol>('count');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [currentTab, setCurrentTab] = useState(0);
  const [moveTarget, setMoveTarget] = useState<UnconfirmedSpeciesEntry | null>(null);
  const [moving, setMoving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getUnconfirmedSpecies();
      const body = await resp.json();
      setFileExists(body.exists);
      setData(body.data ?? null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDialogClose = (didComplete: boolean) => {
    setDialogOpen(false);
    if (didComplete) {
      loadData();
    }
  };

  const handleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir(col === 'count' ? 'desc' : 'asc');
    }
  };

  const handleConfirmMove = async () => {
    if (!moveTarget) return;
    setMoving(true);
    await (dispatch as any)(
      addAndSaveBaselineSpecies({
        id: parseInt(moveTarget.taxonId, 10),
        name: moveTarget.name,
        isActive: true,
        researchGradeReviewCount: 0,
        curatorReviewCount: undefined,
      }),
    );
    setMoving(false);
    setMoveTarget(null);
    // Remove from local data so the table updates immediately
    setData((prev) =>
      prev
        ? {
            ...prev,
            totalUnconfirmed: prev.totalUnconfirmed - 1,
            species: prev.species.filter((s) => s.taxonId !== moveTarget.taxonId),
          }
        : prev,
    );
  };

  const sortedSpecies = useMemo(() => {
    if (!data?.species) return [];
    return [...data.species].sort((a, b) => {
      let cmp = 0;
      if (sortCol === 'taxonId') {
        cmp = parseInt(a.taxonId) - parseInt(b.taxonId);
      } else if (sortCol === 'name') {
        cmp = a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() > b.name.toLowerCase() ? 1 : 0;
      } else {
        cmp = a.count - b.count;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  return (
    <>
      <div style={{ flex: '0 0 auto' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Unconfirmed Species
          {data && data.totalUnconfirmed > 0 && <Chip label={data.totalUnconfirmed} size="small" />}
          <Box sx={{ ml: 'auto' }}>
            <Button variant="outlined" size="small" onClick={() => setDialogOpen(true)}>
              Check Unconfirmed Species
            </Button>
          </Box>
        </h2>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: '10px' }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            aria-label="unconfirmed species tabs"
          >
            <Tab label="Species" />
            <Tab label="Notes" />
          </Tabs>
        </Box>
      </div>

      <Box sx={{ display: currentTab !== 0 ? 'none' : 'block' }}>
        {isLoading && <Typography variant="body2">Loading…</Typography>}

        {!isLoading && error && <Alert severity="error">{error}</Alert>}

        {!isLoading && !error && fileExists === false && (
          <Alert severity="info">
            Unconfirmed species haven't been checked yet. Click <b>Check Unconfirmed Species</b> to run the check.
          </Alert>
        )}

        {!isLoading && !error && fileExists && data && (
          <>
            {data.species.length === 0 ? (
              <Alert severity="success">All reported species are already in the curated checklist.</Alert>
            ) : (
              <Box flex="0 1 auto">
                <table cellSpacing={0} cellPadding={0} className={classes.baselineTable}>
                  <thead>
                    <tr>
                      <th></th>
                      <Th
                        col="taxonId"
                        label="Taxon ID"
                        style={{ width: 120 }}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                      <Th col="name" label="Species" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                      <Th
                        col="count"
                        label="Observations"
                        style={{ width: 160 }}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onSort={handleSort}
                      />
                      <th style={{ width: 60 }}>Move</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSpecies.map((row, index) => (
                      <tr key={row.taxonId}>
                        <td className={classes.rowNum}>{index + 1}</td>
                        <td>{row.taxonId}</td>
                        <td>
                          <a href={`${INAT_SPECIES_URL}/${row.taxonId}`} target="_blank" rel="noopener noreferrer">
                            {row.name}
                          </a>
                        </td>
                        <td>{row.count.toLocaleString()}</td>
                        <td>
                          <IconButton size="small" onClick={() => setMoveTarget(row)} title="Move to baseline species">
                            <DriveFileMoveOutlinedIcon fontSize="small" />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </>
        )}
      </Box>

      <Box sx={{ display: currentTab !== 1 ? 'none' : 'block', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Species reported on iNaturalist for the configured place and taxon that are not yet in the curated checklist.
        </Typography>
      </Box>

      <CheckUnconfirmedSpeciesDialog open={dialogOpen} onClose={handleDialogClose} />

      <Dialog open={moveTarget !== null} onClose={() => !moving && setMoveTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Move to Baseline Species</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Add <b>{moveTarget?.name}</b> (taxon ID: {moveTarget?.taxonId}) to the baseline species list?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button size="small" onClick={() => setMoveTarget(null)} disabled={moving}>
            No
          </Button>
          <Button size="small" variant="contained" onClick={handleConfirmMove} disabled={moving}>
            {moving ? 'Adding…' : 'Yes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
