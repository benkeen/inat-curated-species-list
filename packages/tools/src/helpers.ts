import { nanoid } from 'nanoid';
import { Taxon, TaxonomyMap } from '@imerss/inat-curated-species-list-common';
import { GetDataPacketResponse, INatTaxonAncestor, Observation, TaxonChangeData } from '../types/generator.types';
import fs from 'fs';
import path from 'path';

export const formatNum = (num: number) => new Intl.NumberFormat('en-US').format(num);

type Keys = {
  [key: string]: boolean;
};

const generatedKeys: Keys = {};
let currKeyLength = 1;

/**
 * Helper method used for data minimization. It returns a unique key of the shortest length available.
 *
 * This method could be improved.
 */
export const getShortestUniqueKey: () => string = () => {
  let key = '';
  for (let i = 0; i < 20; i++) {
    const currKey = nanoid(currKeyLength);
    if (!generatedKeys[currKey]) {
      key = currKey;
      generatedKeys[currKey] = true;
      break;
    }
  }
  if (key) {
    return key;
  }
  currKeyLength++;

  return getShortestUniqueKey();
};

export const getTaxonomy = (ancestors: INatTaxonAncestor[], taxonsToReturn: Taxon[]): TaxonomyMap =>
  ancestors.reduce((acc, curr) => {
    if (taxonsToReturn.indexOf(curr.rank) !== -1) {
      acc[curr.rank] = curr.name;
    }
    return acc;
  }, {} as TaxonomyMap);

export const getConfirmationDateAccountingForTaxonChanges = (
  curatorIdentificationIndex: number,
  obs: Observation,
  taxonChangeData: TaxonChangeData[],
): {
  deprecatedTaxonIds: number[];
  originalConfirmationDate: string;
} => {
  const curatorConfirmationDate = obs.identifications[curatorIdentificationIndex].created_at;

  // if this observation wasn't part of a taxon swap, we're good. Just return the confirmation date
  if (!obs.identifications[curatorIdentificationIndex].taxon_change) {
    return { deprecatedTaxonIds: [], originalConfirmationDate: curatorConfirmationDate };
  }

  // confirm that the data model is one of the known taxon change types. If not, abort.
  if (
    ['TaxonSwap', 'TaxonSplit', 'TaxonMerge'].indexOf(
      obs.identifications[curatorIdentificationIndex].taxon_change.type,
    ) === -1
  ) {
    console.error('Unknown taxon change type. This is a problem with the script.', {
      observationId: obs.id,
      identification: obs.identifications[curatorIdentificationIndex],
    });
    process.exit(1);
  }

  type HistoricalCuratorObsIdentification = {
    readonly taxonId: number;
    readonly confirmationDate: string;
    readonly isTaxonChange: boolean;
  };

  const curatorObservations: HistoricalCuratorObsIdentification[] = [];
  const targetCurator = obs.identifications[curatorIdentificationIndex].user.login;
  let lastCuratorObservation = obs.identifications[curatorIdentificationIndex];

  for (let i = curatorIdentificationIndex; i >= 0; i--) {
    const currIdentification = obs.identifications[i];

    if (currIdentification.user.login !== targetCurator) {
      continue;
    }

    if (
      // ignore the most recent curator identification on the observation - we know it's a taxon change
      i !== curatorIdentificationIndex
    ) {
      taxonChangeData.push({
        id: obs.id,
        previousSpeciesName: currIdentification.taxon.name,
        newSpeciesName: lastCuratorObservation.taxon.name,
        yearChanged: new Date(lastCuratorObservation.created_at).getFullYear(),
        taxonChangeId: lastCuratorObservation.taxon_change.id,
      });

      // if this is also a taxon switch, reset the "last" curator identification to this one and keep going back through
      // the earlier identifications
      if (currIdentification.taxon_change) {
        lastCuratorObservation = currIdentification;
      }
    }

    curatorObservations.push({
      taxonId: currIdentification.taxon_id,
      confirmationDate: currIdentification.created_at,
      isTaxonChange: !!currIdentification.taxon_change,
    });
  }

  // now loop through the curator observations. The first one that ISN'T a taxon change will be the original observation.
  // This could be a single taxon swap or a series. Any earlier identifications by the curator don't matter.
  const deprecatedTaxonIds: number[] = [];
  let originalConfirmationDate: string;
  for (let i = 0; i < curatorObservations.length; i++) {
    if (i !== 0) {
      deprecatedTaxonIds.push(curatorObservations[i].taxonId);
    }
    if (!curatorObservations[i].isTaxonChange) {
      originalConfirmationDate = curatorObservations[i].confirmationDate;
      break;
    }
  }

  return { deprecatedTaxonIds, originalConfirmationDate };
};

export const getUniqueItems = (arr: number[]) => arr.filter((value, index, array) => array.indexOf(value) === index);

// TODO problem: taxon ID "227436" shouldn't show up in the final list
// https://www.inaturalist.org/observations?place_id=7085&taxon_id=227436&verifiable=any
// the issue is that a curator has approved a higher-level taxon, but not the same as the original observation.
const parseDataFile = (
  file: string,
  curators: string[],
  taxonsToReturn: Taxon[],
  processedData,
  taxonsToRemove: number[],
  taxonChangeData: TaxonChangeData[],
) => {
  const content: GetDataPacketResponse = JSON.parse(fs.readFileSync(file, 'utf-8'));

  content.results.forEach((obs) => {
    // now loop through all identifications on this observation and log the first one that was confirmed or added by
    // one of our curators
    // *** assumption: the array is ordered oldest to newest
    let curatorTaxonId: number | null = null;
    for (let i = 0; i < obs.identifications.length; i++) {
      if (!obs.identifications[i].current) {
        continue;
      }

      if (!curators.includes(obs.identifications[i].user.login)) {
        continue;
      }

      if (obs.identifications[i].taxon.rank !== 'species' && obs.identifications[i].taxon.rank !== 'subspecies') {
        continue;
      }

      const isSubspeciesIdent = obs.identifications[i].taxon.rank === 'subspecies';

      // we're not currently interested in subspecies, but need to factor in confirmed subspecies observations.
      let speciesName: string;
      if (isSubspeciesIdent) {
        const speciesAncestor =
          obs.identifications[i].taxon.ancestors[obs.identifications[i].taxon.ancestors.length - 1];
        curatorTaxonId = speciesAncestor.id;
        speciesName = speciesAncestor.name;
      } else {
        curatorTaxonId = obs.identifications[i].taxon.id;
        speciesName = obs.identifications[i].taxon.name;
      }

      // as noted, group all species + subspecies under the species taxon ID.
      if (!processedData[curatorTaxonId]) {
        processedData[curatorTaxonId] = {
          speciesName: null,
          observations: [],
          taxonomy: null,
        };
      }

      const { deprecatedTaxonIds, originalConfirmationDate } = getConfirmationDateAccountingForTaxonChanges(
        i,
        obs,
        taxonChangeData,
      );
      taxonsToRemove.push(...deprecatedTaxonIds);

      processedData[curatorTaxonId].speciesName = speciesName;
      processedData[curatorTaxonId].observations.push({
        observationId: obs.id,
        dateObserved: obs.observed_on_details ? obs.observed_on_details.date : null,
        observationCreatedAt: obs.created_at_details.date,
        confirmationDate: originalConfirmationDate,
        confirmationDateUnix: new Date(originalConfirmationDate).getTime(),
        curator: obs.identifications[i].user.login,
        observer: {
          username: obs.user.login,
          name: obs.user.name,
          id: obs.user.id,
        },
      });

      // only bother calculating the taxonomy for this taxon once
      if (!processedData[curatorTaxonId].taxonomy) {
        processedData[curatorTaxonId].taxonomy = getTaxonomy(obs.identifications[i].taxon.ancestors, taxonsToReturn);
      }

      // we ignore any later identifications; we're only interested in the earliest one that met our curator requirement
      break;
    }

    // if there aren't any identifications added, delete the taxon - it will get automatically added later if there
    // are other records with valid observations. (This can happen when ???)
    if (curatorTaxonId && !processedData[curatorTaxonId].observations.length) {
      delete processedData[curatorTaxonId];
    }
  });
};

export const parseDataFiles = (numFiles: number, curators: string[], taxon: Taxon[], tempFolder: string) => {
  const newAdditions = {};
  const taxonsToRemove: number[] = [];
  const taxonChangeData = [];

  for (let i = 1; i <= numFiles; i++) {
    parseDataFile(
      path.resolve(`${tempFolder}/packet-${i}.json`),
      curators,
      taxon,
      newAdditions,
      taxonsToRemove,
      taxonChangeData,
    );
  }

  // remove any taxons that we're not interested in (i.e. old, replaced ones)
  const items = getUniqueItems(taxonsToRemove);
  items.forEach((taxonId) => {
    delete newAdditions[taxonId];
  });

  const taxonChangeDataGroupedByYear = {};
  taxonChangeData.forEach((row) => {
    if (!taxonChangeDataGroupedByYear[row.yearChanged]) {
      taxonChangeDataGroupedByYear[row.yearChanged] = {};
    }

    if (!taxonChangeDataGroupedByYear[row.yearChanged][row.previousSpeciesName]) {
      taxonChangeDataGroupedByYear[row.yearChanged][row.previousSpeciesName] = {
        newSpeciesName: row.newSpeciesName,
        taxonChangeId: row.taxonChangeId,
      };
    } else {
      // TODO
      // if (taxonChangeDataGroupedByYear[row.yearChanged][row.previousSpeciesName] !== row.newSpeciesName) {
      //   console.log('Error: ', row.previousSpeciesName, [
      //     taxonChangeDataGroupedByYear[row.yearChanged][row.previousSpeciesName],
      //     row.newSpeciesName,
      //   ]);
      // }
    }
  });

  return {
    newAdditions,
    taxonChangeDataGroupedByYear,
  };
};
