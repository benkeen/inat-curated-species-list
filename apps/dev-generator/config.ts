import type { GeneratorConfig } from '@ecophilia/inat-curated-species-list-tools';

const config: GeneratorConfig = {
  curators: ['oneofthedavesiknow', 'gpohl', 'crispinguppy'],
  taxonId: 47157,
  placeId: 7085,
  tempFolder: './temp',
  useLocalInatDataFiles: false,
  showLastGeneratedDate: true,
  baselineEndDate: '2024-01-01',

  // species data file
  speciesDataFilename: 'species-data.json',

  // new additions data file
  trackNewAdditions: true,
  newAdditionsFilename: 'new-additions-data.json',

  // taxon changes file
  trackTaxonChanges: true,
  taxonChangesFilename: 'taxon-changes-data.json',

  omitTaxonChangeIds: [136709],
};

export default config;
