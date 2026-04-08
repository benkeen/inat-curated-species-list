import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import { IconButton } from '@mui/material';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getTaxonChangesData } from '../../api/api';
import { Spinner } from '../loading/spinner';
import { TaxonChangeData, TaxonChangeType } from '@ecophilia/inat-curated-species-list-tools';

const INAT_TAXON_CHANGES_URL = 'https://www.inaturalist.org/taxon_changes';
const INAT_TAXON_URL = 'https://www.inaturalist.org/taxa';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ViewIcon = () => (
  <svg
    fill="#3366cc"
    width="24px"
    height="24px"
    viewBox="-3.5 0 32 32"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>View</title>
    <path d="M12.406 13.844c1.188 0 2.156 0.969 2.156 2.156s-0.969 2.125-2.156 2.125-2.125-0.938-2.125-2.125 0.938-2.156 2.125-2.156zM12.406 8.531c7.063 0 12.156 6.625 12.156 6.625 0.344 0.438 0.344 1.219 0 1.656 0 0-5.094 6.625-12.156 6.625s-12.156-6.625-12.156-6.625c-0.344-0.438-0.344-1.219 0-1.656 0 0 5.094-6.625 12.156-6.625zM12.406 21.344c2.938 0 5.344-2.406 5.344-5.344s-2.406-5.344-5.344-5.344-5.344 2.406-5.344 5.344 2.406 5.344 5.344 5.344z" />
  </svg>
);

const ChangeTypePill = ({ type }: { type: TaxonChangeType }) => {
  const getPill = (type: TaxonChangeType) => {
    if (type === 'TaxonMerge') {
      return { label: 'Taxon Merge', style: { backgroundColor: 'green', color: 'white' } };
    } else if (type === 'TaxonSplit') {
      return { label: 'Taxon Split', style: { backgroundColor: '#336699', color: 'white' } };
    }
    return { label: 'Taxon Swap', style: { backgroundColor: '#671967', color: 'white' } };
  };
  const { label, style } = getPill(type);
  return (
    <span style={{ ...style, padding: '2px 6px', borderRadius: 4, fontSize: 11, whiteSpace: 'nowrap' }}>{label}</span>
  );
};

type SortCol = 'taxonChangeObsCreatedAt' | 'previousSpeciesName' | 'newSpeciesName' | 'taxonChangeType';
type SortDir = 'asc' | 'desc';

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
// TaxonChanges
// ---------------------------------------------------------------------------

export const TaxonChanges = () => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TaxonChangeData[]>([]);
  const [sortCol, setSortCol] = useState<SortCol>('taxonChangeObsCreatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const onSort = (col: SortCol, dir: SortDir) => {
    setSortCol(col);
    setSortDir(dir);
  };

  useEffect(() => {
    getTaxonChangesData()
      .then((resp) => {
        if (!resp.ok) {
          return resp.json().then((body) => {
            throw new Error(body?.error ?? 'Failed to load taxon changes data.');
          });
        }
        return resp.json();
      })
      .then((json: Record<string, TaxonChangeData[]>) => {
        const allRecords = Object.values(json).flat();
        setData(allRecords);
        setLoaded(true);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const sortedRecords = useMemo(() => {
    return [...data].sort((a, b) => {
      const valA = (a[sortCol] as string).toLowerCase();
      const valB = (b[sortCol] as string).toLowerCase();
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  return (
    <>
      <h2>Taxon Changes</h2>

      {!loaded && !error && <Spinner />}
      {error && <Alert severity="error">{error}</Alert>}

      {loaded && (
        <>
          {sortedRecords.length === 0 ? (
            <p>There are no taxon changes.</p>
          ) : (
            <table cellSpacing={0} cellPadding={2} width="100%">
              <thead>
                <tr>
                  <th></th>
                  <Th
                    col="taxonChangeObsCreatedAt"
                    label="Date"
                    currentSortCol={sortCol}
                    currentSortDir={sortDir}
                    onSort={onSort}
                  />
                  <Th
                    col="previousSpeciesName"
                    label="Previous Name"
                    currentSortCol={sortCol}
                    currentSortDir={sortDir}
                    onSort={onSort}
                  />
                  <Th
                    col="newSpeciesName"
                    label="New Name"
                    currentSortCol={sortCol}
                    currentSortDir={sortDir}
                    onSort={onSort}
                  />
                  <Th
                    col="taxonChangeType"
                    label="Change Type"
                    currentSortCol={sortCol}
                    currentSortDir={sortDir}
                    onSort={onSort}
                  />
                  <th>History</th>
                </tr>
              </thead>
              <tbody>
                {sortedRecords.map((taxonChange, index) => {
                  const speciesNameStyle: React.CSSProperties = taxonChange.active
                    ? {}
                    : { textDecoration: 'line-through', opacity: 0.6 };
                  return (
                    <tr key={taxonChange.taxonChangeId} style={{ height: 30 }}>
                      <td style={{ width: 40, color: '#999', fontSize: 12 }}>{index + 1}</td>
                      <td>{formatDate(taxonChange.taxonChangeObsCreatedAt)}</td>
                      <td style={speciesNameStyle}>{taxonChange.previousSpeciesName}</td>
                      <td style={speciesNameStyle}>
                        <a href={`${INAT_TAXON_URL}/${taxonChange.newSpeciesTaxonId}`} target="_blank" rel="noreferrer">
                          {taxonChange.newSpeciesName}
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ display: 'inline-block', width: 100 }}>
                            <ChangeTypePill type={taxonChange.taxonChangeType} />
                          </span>
                          <a
                            href={`${INAT_TAXON_CHANGES_URL}/${taxonChange.taxonChangeId}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ViewIcon />
                          </a>
                        </div>
                      </td>
                      <td>
                        <a
                          href={`${INAT_TAXON_CHANGES_URL}?taxon_id=${taxonChange.newSpeciesTaxonId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ViewIcon />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </>
  );
};
