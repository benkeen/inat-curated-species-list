import { nanoid } from 'nanoid';
import { Taxon, TaxonomyMap } from '@imerss/inat-curated-species-list-common';
import { Identification, INatTaxonAncestor, Observation } from '../types/generator.types';

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

  for (let i = curatorIdentificationIndex; i >= 0; i--) {
    const currIdentification = obs.identifications[i];
    if (currIdentification.user.login !== targetCurator) {
      continue;
    }

    curatorObservations.push({
      taxonId: currIdentification.taxon_id,
      confirmationDate: currIdentification.created_at,
      isTaxonChange: !!currIdentification.taxon_change,
    });
  }

  // now loop through the curator obseervations. The first one that ISN'T a taxon change will be the original observation.
  // this could be a single taxon swap or a series. Any earlier identifications by the curator don't matter.
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

/*
Scenario:

Digrammia extenuata
https://www.inaturalist.org/observations/195907292

Showing up in list, but there's an older record here:
https://www.inaturalist.org/observations?ident_user_id=oneofthedavesiknow,gpohl,crispinguppy&place_id=7085&taxon_id=452657&verifiable=any

Taxon ID: 452657
*/
