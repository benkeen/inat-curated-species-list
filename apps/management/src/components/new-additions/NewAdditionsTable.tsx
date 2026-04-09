import { FC, useEffect, useMemo, useState } from 'react';
import { NewAddition } from '@ecophilia/inat-curated-species-list-tools';
import { IconButton } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Spinner } from '../loading/spinner';

type SortCol = 'speciesName' | 'observer' | 'dateObserved' | 'confirmationDate' | 'curator';
type SortDir = 'asc' | 'desc';

const INAT_OBSERVATIONS_URL = 'https://www.inaturalist.org/observations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type SortButtonProps = {
  col: SortCol;
  currentSortCol: SortCol;
  currentSortDir: SortDir;
  onSort: (col: SortCol, dir: SortDir) => void;
};

const SortButton = ({ col, currentSortCol, currentSortDir, onSort }: SortButtonProps) => {
  const isActive = col === currentSortCol;
  const SortIcon = isActive && currentSortDir === 'desc' ? ArrowDropDownIcon : ArrowDropUpIcon;
  const nextDir: SortDir = isActive && currentSortDir === 'asc' ? 'desc' : 'asc';
  return (
    <IconButton
      size="small"
      style={{ marginLeft: 4, visibility: isActive ? 'visible' : 'hidden' }}
      onClick={() => onSort(col, nextDir)}
    >
      <SortIcon />
    </IconButton>
  );
};

type ThProps = {
  col: SortCol;
  label: string;
  currentSortCol: SortCol;
  currentSortDir: SortDir;
  onSort: (col: SortCol, dir: SortDir) => void;
  style?: React.CSSProperties;
};

const Th = ({ col, label, currentSortCol, currentSortDir, onSort, style }: ThProps) => (
  <th
    style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', ...style }}
    onClick={() => {
      const nextDir: SortDir = col === currentSortCol && currentSortDir === 'asc' ? 'desc' : 'asc';
      onSort(col, nextDir);
    }}
  >
    {label}
    <SortButton col={col} currentSortCol={currentSortCol} currentSortDir={currentSortDir} onSort={onSort} />
  </th>
);

// ---------------------------------------------------------------------------
// NewAdditionsTab
// ---------------------------------------------------------------------------

export interface NewAdditionsTabProps {
  readonly dataUrl?: string;
  readonly initialData?: NewAddition[];
  readonly showRowNumbers: boolean;
  readonly tabText?: any;
}

export const NewAdditionsTable: FC<NewAdditionsTabProps> = ({ dataUrl, initialData, tabText, showRowNumbers }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<NewAddition[]>([]);
  const [sortCol, setSortCol] = useState<SortCol>('confirmationDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const onSort = (col: SortCol, dir: SortDir) => {
    setSortCol(col);
    setSortDir(dir);
  };

  const rowNumberMap = useMemo(() => {
    const sorted = [...data].sort((a, b) =>
      a.confirmationDate < b.confirmationDate ? -1 : a.confirmationDate > b.confirmationDate ? 1 : 0,
    );
    return new Map(sorted.map((row, i) => [row.taxonId, i + 1]));
  }, [data]);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let valA: string;
      let valB: string;
      switch (sortCol) {
        case 'observer':
          valA = a.observer.username.toLowerCase();
          valB = b.observer.username.toLowerCase();
          break;
        case 'curator':
          valA = a.curator.toLowerCase();
          valB = b.curator.toLowerCase();
          break;
        default:
          valA = (a[sortCol] as string).toLowerCase();
          valB = (b[sortCol] as string).toLowerCase();
      }
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoaded(true);
      return;
    }

    if (!dataUrl) {
      return;
    }

    fetch(dataUrl, {
      headers: {
        Accept: 'application/json',
      },
    })
      .then((resp) => resp.json())
      .then((data: NewAddition[]) => {
        setData(data);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, [dataUrl, initialData]);

  if (error) {
    return <p>Sorry, there was an error loading the data.</p>;
  }

  if (!loaded) {
    return <Spinner />;
  }

  let dataContent = <p className="icsl-empty-tab icsl-new-additions-none">There are no new records</p>;

  if (data.length) {
    dataContent = (
      <table cellSpacing={0} cellPadding={2} width="100%">
        <thead>
          <tr>
            {showRowNumbers && <th></th>}
            <Th col="speciesName" label="Species" currentSortCol={sortCol} currentSortDir={sortDir} onSort={onSort} />
            <Th
              col="confirmationDate"
              label="Confirmed"
              currentSortCol={sortCol}
              currentSortDir={sortDir}
              onSort={onSort}
            />
            <Th col="observer" label="Observer" currentSortCol={sortCol} currentSortDir={sortDir} onSort={onSort} />
            <Th col="dateObserved" label="Observed" currentSortCol={sortCol} currentSortDir={sortDir} onSort={onSort} />
            <Th col="curator" label="Curator" currentSortCol={sortCol} currentSortDir={sortDir} onSort={onSort} />
          </tr>
        </thead>
        <tbody>
          {sortedData.map(
            ({ speciesName, taxonId, observationId, curator, dateObserved, confirmationDate, observer }) => {
              const rowNum = rowNumberMap.get(taxonId);
              return (
                <tr key={taxonId} style={{ height: 30 }}>
                  {showRowNumbers && (
                    <th>
                      <b>{rowNum}</b>
                    </th>
                  )}
                  <td>
                    <a
                      href={`${INAT_OBSERVATIONS_URL}/${observationId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="icsl-species-name"
                    >
                      {speciesName}
                    </a>
                  </td>
                  <td>{formatDate(confirmationDate)}</td>
                  <td>{observer.username}</td>
                  <td>
                    <a
                      href={`${INAT_OBSERVATIONS_URL}/${observationId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="icsl-view-link"
                    >
                      {formatDate(dateObserved)}
                    </a>
                  </td>
                  <td>{curator}</td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    );
  }

  const tabTextHtml = tabText ? <div className="icsl-tab-text" dangerouslySetInnerHTML={{ __html: tabText }} /> : null;

  return (
    <>
      {tabTextHtml}
      {dataContent}
    </>
  );
};
