import { FC, useEffect, useState } from 'react';
import { firstBy } from 'thenby';
import { CuratedSpeciesData, CuratedSpeciesArrayItem, Taxon } from '@ecophilia/inat-curated-species-list-common';
import { constants } from '@ecophilia/inat-curated-species-list-common';
import { ViewIcon } from './ViewIcon';

const { INAT_OBSERVATIONS_URL } = constants;

interface DataTableProps {
  readonly data: CuratedSpeciesData;
  readonly taxons: Taxon[];
  readonly curatorUsernames: string[];
  readonly placeId: number;
  readonly showRowNumbers?: boolean;
  readonly showReviewerCount?: boolean;
}

/**
 * Renders the data table alone.
 */
export const DataTable: FC<DataTableProps> = ({
  data,
  taxons,
  curatorUsernames,
  placeId,
  showRowNumbers,
  showReviewerCount = false,
}) => {
  const [sortedData, setSortedData] = useState<CuratedSpeciesArrayItem[]>([]);
  const [taxonCols, setTaxonCols] = useState<Taxon[]>([]);

  useEffect(() => {
    setTaxonCols(taxons);

    const arr: CuratedSpeciesArrayItem[] = Object.keys(data).map((taxonId) => ({
      data: data[taxonId]!.data,
      count: data[taxonId]!.count,
      taxonId,
    }));

    let sorted: IThenBy<CuratedSpeciesArrayItem> | null = null;
    taxonCols.forEach((taxon) => {
      if (!sorted) {
        sorted = firstBy((a) => a.data[taxon] || 'Zzzzz', {
          direction: 'asc',
        });
      } else {
        sorted = sorted.thenBy((a) => a.data[taxon] || 'Zzzzz', {
          direction: 'asc',
        });
      }
    });

    if (sorted) {
      arr.sort(sorted);
      setSortedData(arr);
    }
  }, [data, taxonCols, taxons]);

  if (!sortedData.length) {
    return null;
  }

  return (
    <table className="icsl-table" cellSpacing={0} cellPadding={2}>
      <thead>
        <tr key="header">
          {showRowNumbers && <th></th>}
          {taxonCols.map((rank) => {
            if (rank === 'genus') {
              return null;
            }
            return <th key={rank}>{rank}</th>;
          })}
          {showReviewerCount && <th></th>}
          <th style={{ width: 40 }}></th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, index) => (
          <tr key={row.taxonId}>
            {showRowNumbers && (
              <td>
                <b>{index + 1}</b>
              </td>
            )}
            {taxonCols.map((currentRank) => {
              if (currentRank === 'genus') {
                return null;
              }

              const className = currentRank === 'species' ? 'icsl-species-name' : '';

              return (
                <td key={`${row.taxonId}-${currentRank}`} className={className}>
                  {row.data[currentRank] ? row.data[currentRank] : ''}
                </td>
              );
            })}
            {showReviewerCount && <td>({row.count})</td>}
            <td style={{ display: 'flex' }}>
              <a
                href={`${INAT_OBSERVATIONS_URL}?ident_user_id=${curatorUsernames.join(',')}&place_id=${placeId}&taxon_id=${row.taxonId}&verifiable=any`}
                target="_blank"
                rel="noreferrer"
                className="icsl-view-link"
              >
                <ViewIcon />
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
