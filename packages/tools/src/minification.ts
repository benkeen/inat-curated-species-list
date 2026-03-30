/**
 * The data needed for this package is very large, after extracting only what we need from the iNat requests. This file
 * contains some helpers to minimize and expand the raw data so requests to the data source are kept as small as possible.
 */
import { CuratedSpeciesData, Taxon, CuratedSpeciesDataMinified } from '@ecophilia/inat-curated-species-list-common';
import { getShortestUniqueKey } from './helpers';

import { version } from '../package.json';

export type TaxonsToMinifyMap = Partial<Record<Taxon, boolean>>;

const taxonsToMinify: TaxonsToMinifyMap = {
  kingdom: true,
  phylum: true,
  subphylum: true,
  class: true,
  subclass: true,
  order: true,
  superfamily: true,
  family: true,
  subfamily: true,
  tribe: true,
  genus: true,
  section: true,
};

export const minifySpeciesData = (data: CuratedSpeciesData, targetTaxons: Taxon[]) => {
  const minifiedData: CuratedSpeciesDataMinified = {
    taxonMap: {},
    taxonData: {},
    taxons: targetTaxons,
    dateGenerated: new Date().toString(),
    '@ecophilia/inat-curated-species-list-tools': version,
  };

  Object.keys(data).forEach((taxonId) => {
    // keyed by rank
    const rowData: Partial<Record<Taxon, string>> = {};

    // replace all non-species taxon strings (Pterygota, or whatever) with a short code in taxonMap
    (Object.keys(data[taxonId].data) as Taxon[]).forEach((taxonRank) => {
      const taxonName = data[taxonId].data[taxonRank];

      if (taxonsToMinify[taxonRank]) {
        // if we've already minified this particular taxon name (note: no reason this might be a totally
        // different rank from the original minification - it doesn't matter - point is that the STRING is identical)
        if (minifiedData.taxonMap[taxonName]) {
          rowData[taxonRank] = minifiedData.taxonMap[taxonName];
        } else {
          const key = getShortestUniqueKey();
          minifiedData.taxonMap[taxonName] = key;
          rowData[taxonRank] = key;
        }
      } else {
        rowData[taxonRank] = taxonName;
      }
    });

    const row = targetTaxons.map((t) => (rowData[t] ? rowData[t] : '')).join('|');
    minifiedData.taxonData[taxonId] = `${row}|${data[taxonId].count}`;
  });

  return minifiedData;
};
