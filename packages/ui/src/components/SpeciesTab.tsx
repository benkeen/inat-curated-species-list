import { FC, useEffect, useMemo, useState } from 'react';
import { DataTable } from './DataTable';
import { TaxonomyTree } from './TaxonomyTree';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Alert from '@mui/material/Alert';
import { useChecklistLocation } from './hooks/useChecklistLocation';
import { Loader } from './Loader';
import {
  unminifySpeciesData,
  CuratedSpeciesData,
  CuratedSpeciesDataMinified,
  Taxon,
} from '@ecophilia/inat-curated-species-list-common';

export interface SpeciesTabProps {
  readonly dataUrl?: string;
  readonly initialData?: CuratedSpeciesDataMinified;
  readonly onLoad: (data: CuratedSpeciesDataMinified) => void;
  readonly curatorUsernames: string[];
  readonly placeId: number;
  readonly showRowNumbers?: boolean;
  readonly showReviewerCount?: boolean;
  readonly tabText?: any;
}

export const SpeciesTab: FC<SpeciesTabProps> = ({
  dataUrl,
  initialData,
  onLoad,
  curatorUsernames,
  placeId,
  showRowNumbers,
  showReviewerCount,
  tabText,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { state, update } = useChecklistLocation();
  const { filter, view } = state;
  const [debouncedFilter, setDebouncedFilter] = useState(filter);
  const [data, setData] = useState<CuratedSpeciesData | undefined>();
  const [taxons, setTaxons] = useState<Taxon[]>();
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(filter), 200);
    return () => clearTimeout(timer);
  }, [filter]);

  useEffect(() => {
    if (initialData) {
      onLoad(initialData);
      setTaxons(initialData.taxons);
      setData(unminifySpeciesData(initialData));
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
      .then((minifiedData: CuratedSpeciesDataMinified) => {
        onLoad(minifiedData);
        setTaxons(minifiedData.taxons);
        setData(unminifySpeciesData(minifiedData));
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, [dataUrl, initialData, onLoad]);

  const { filteredData, filterError } = useMemo(() => {
    if (!data || !debouncedFilter) return { filteredData: data, filterError: null };
    try {
      const pattern = new RegExp(debouncedFilter, 'i');
      return {
        filteredData: Object.fromEntries(
          Object.entries(data).filter(([, species]) => Object.values(species.data).some((name) => pattern.test(name))),
        ),
        filterError: null,
      };
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return { filteredData: {}, filterError: `Invalid filter: ${error.message}` };
    }
  }, [data, debouncedFilter]);

  if ((!loaded || !data || !filteredData || !taxons) && !error) {
    return (
      <div className="icsl-loader">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <p>Sorry, there was an error loading the data.</p>;
  }

  const numFilteredItems = Object.keys(filteredData!).length;
  const tabTextHtml = tabText ? <div className="icsl-tab-text" dangerouslySetInnerHTML={{ __html: tabText }} /> : null;

  return (
    <>
      {tabTextHtml}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div className="icsl-filter" style={{ marginBottom: 0 }}>
          <label>Filter:</label>
          <input
            type="text"
            value={filter}
            onChange={(event) => {
              const value = event.target.value;
              update((current) => ({ ...current, filter: value, tree: { ...current.tree, search: null } }));
            }}
          />
          <span className="icsl-filter-counts">
            <b>
              {numFilteredItems} / {Object.keys(data!).length}
            </b>
          </span>
        </div>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          aria-label="Checklist view"
          sx={{ '& .MuiToggleButton-root': { px: 2 } }}
          onChange={(_event, nextView: 'table' | 'tree' | null) => {
            if (nextView !== null) update((current) => ({ ...current, view: nextView }));
          }}
        >
          <ToggleButton value="table">Table</ToggleButton>
          <ToggleButton value="tree">Tree</ToggleButton>
        </ToggleButtonGroup>
      </div>

      {filterError && <Alert severity="error">{filterError}</Alert>}
      {!filterError && !numFilteredItems && !!debouncedFilter && <p>No species found.</p>}

      {numFilteredItems > 0 && view === 'table' && (
        <DataTable
          data={filteredData!}
          taxons={taxons!}
          curatorUsernames={curatorUsernames}
          placeId={placeId}
          showRowNumbers={showRowNumbers}
          showReviewerCount={showReviewerCount}
        />
      )}
      <div style={{ display: view === 'tree' ? 'block' : 'none' }}>
        <TaxonomyTree
          data={filteredData!}
          filter={filterError ? '' : debouncedFilter}
          taxons={taxons!}
          curatorUsernames={curatorUsernames}
          placeId={placeId}
          showReviewerCount={showReviewerCount}
        />
      </div>
    </>
  );
};
