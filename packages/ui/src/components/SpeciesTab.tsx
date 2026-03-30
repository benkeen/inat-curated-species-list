import React, { FC, useCallback, useEffect, useState } from 'react';
import { DataTable } from './DataTable';
import debounce from 'debounce';
import { Loader } from './Loader';
import {
  unminifySpeciesData,
  CuratedSpeciesData,
  CuratedSpeciesDataMinified,
  Taxon,
  TaxonomyMap,
} from '@ecophilia/inat-curated-species-list-common';

export interface SpeciesTabProps {
  readonly dataUrl: string;
  readonly onLoad: (data: CuratedSpeciesDataMinified) => void;
  readonly curatorUsernames: string[];
  readonly placeId: number;
  readonly showRowNumbers?: boolean;
  readonly showReviewerCount?: boolean;
  readonly tabText?: any;
}

export const SpeciesTab: FC<SpeciesTabProps> = ({
  dataUrl,
  onLoad,
  curatorUsernames,
  placeId,
  showRowNumbers,
  showReviewerCount,
  tabText,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [data, setData] = useState<CuratedSpeciesData | undefined>();
  const [taxons, setTaxons] = useState<Taxon[]>();
  const [filteredData, setFilteredData] = useState<CuratedSpeciesData | undefined>();

  const updateFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(e.target.value);
    debounceVal(e.target.value);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceVal = useCallback(
    debounce((val) => {
      setDebouncedFilter(val);
    }, 200),
    [],
  );

  useEffect(() => {
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
  }, [dataUrl]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (!debouncedFilter) {
      setFilteredData(data);
      return;
    }

    const newObj: CuratedSpeciesData = {};
    const re = new RegExp(debouncedFilter, 'i');
    Object.keys(data).forEach((id) => {
      let found = false;
      Object.keys(data[id]!.data).forEach((taxon) => {
        if (re.test(data[id]!.data[taxon as Taxon])) {
          found = true;
        }
      });

      if (found) {
        newObj[id] = data[id] as {
          data: TaxonomyMap;
          count: number;
        };
      }
    });

    setFilteredData(newObj);
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
      <div className="icsl-filter">
        <label>Filter:</label>
        <input type="text" value={filter} onChange={updateFilter} />
        <span className="icsl-filter-counts">
          <b>
            {numFilteredItems} / {Object.keys(data!).length}
          </b>
        </span>
      </div>

      {!numFilteredItems && !!debouncedFilter && <p>No species found.</p>}

      {numFilteredItems > 0 && (
        <DataTable
          data={filteredData!}
          taxons={taxons!}
          curatorUsernames={curatorUsernames}
          placeId={placeId}
          showRowNumbers={showRowNumbers}
          showReviewerCount={showReviewerCount}
        />
      )}
    </>
  );
};
