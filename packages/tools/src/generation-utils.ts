import { parseDataFiles, getNumINatPacketFiles } from './helpers';
import { DEFAULT_TAXONS } from './constants';
import type { GeneratorConfig, NewAddition } from '../types/generator.types';

export { extractSpeciesList } from './extraction';
export { minifySpeciesData } from './minification';
export { getNumINatPacketFiles } from './helpers';
export { DEFAULT_TAXONS } from './constants';
export type { GeneratorConfig } from '../types/generator.types';

const sortByConfirmationDate = (a: { confirmationDateUnix: number }, b: { confirmationDateUnix: number }) => {
  if (a.confirmationDateUnix < b.confirmationDateUnix) return -1;
  if (a.confirmationDateUnix > b.confirmationDateUnix) return 1;
  return 0;
};

export const getDataFilesContent = (config: GeneratorConfig, numDataFiles: number, tempFolder: string) => {
  const { curators, taxons, baselineEndDate, omitTaxonChangeIds } = config;
  const { newAdditions, taxonChangeDataGroupedByYear } = parseDataFiles(
    numDataFiles,
    curators,
    taxons ?? DEFAULT_TAXONS,
    omitTaxonChangeIds ?? [],
    tempFolder,
  );

  const newAdditionsArray: NewAddition[] = [];
  Object.keys(newAdditions).forEach((taxonId) => {
    newAdditions[taxonId]!.observations.sort(sortByConfirmationDate);

    if (newAdditions[taxonId]!.observations[0]!.confirmationDate < (baselineEndDate ?? '')) {
      return;
    }

    newAdditionsArray.push({
      ...newAdditions[taxonId]!.observations[0],
      taxonId,
      speciesName: newAdditions[taxonId]!.speciesName,
      user: newAdditions[taxonId]!.observations[0]!.user,
      taxonomy: newAdditions[taxonId]!.taxonomy,
    });
  });

  newAdditionsArray.sort((a, b) =>
    a.confirmationDate < b.confirmationDate ? -1 : a.confirmationDate > b.confirmationDate ? 1 : 0,
  );

  return { newAdditionsArray, taxonChangeDataGroupedByYear };
};
