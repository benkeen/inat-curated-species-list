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
  subtribe: true,
  genus: true,
  subgenus: true,
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
    const entry = data[taxonId]!;
    if (entry.rootTaxon) {
      if (
        minifiedData.rootTaxon &&
        (minifiedData.rootTaxon.id !== entry.rootTaxon.id ||
          minifiedData.rootTaxon.name !== entry.rootTaxon.name ||
          minifiedData.rootTaxon.rank !== entry.rootTaxon.rank)
      ) {
        throw new Error('Conflicting root taxon metadata in checklist data.');
      }
      minifiedData.rootTaxon = entry.rootTaxon;
    }
    // keyed by rank
    const rowData: Partial<Record<Taxon, string>> = {};

    // replace all non-species taxon strings (Pterygota, or whatever) with a short code in taxonMap
    (Object.keys(entry.data) as Taxon[]).forEach((taxonRank) => {
      const taxonName = entry.data[taxonRank]!;

      if (taxonsToMinify[taxonRank]) {
        // if we've already minified this particular taxon name (note: no reason this might be a totally
        // different rank from the original minification - it doesn't matter - point is that the STRING is identical)
        if (minifiedData.taxonMap[taxonName]) {
          rowData[taxonRank] = minifiedData.taxonMap[taxonName]!;
        } else {
          const key = getShortestUniqueKey();
          minifiedData.taxonMap[taxonName] = key;
          rowData[taxonRank] = key;
        }
      } else {
        rowData[taxonRank] = taxonName;
      }
      const id = entry.taxonIds?.[taxonRank];
      const code = minifiedData.taxonMap[taxonName];
      if (taxonsToMinify[taxonRank] && code && id != null) {
        minifiedData.taxonIds ??= {};
        const previous = minifiedData.taxonIds[code];
        if (previous != null && previous !== id) {
          throw new Error(`Conflicting iNaturalist IDs for taxon "${taxonName}": ${previous} and ${id}.`);
        }
        minifiedData.taxonIds[code] = id;
      }
    });

    const row = targetTaxons.map((t) => rowData[t] ?? '').join('|');
    minifiedData.taxonData[taxonId] = `${row}|${entry.count}`;
  });

  return minifiedData;
};
