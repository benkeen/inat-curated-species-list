import type { GeneratorConfig } from '@ecophilia/inat-curated-species-list-tools';

const config: GeneratorConfig = {
  curators: ['oneofthedavesiknow', 'gpohl', 'crispinguppy'],
  taxonId: 47157,
  placeId: 7085,
  speciesDataFilename: 'species-data.json',
  showLastGeneratedDate: true,
  baselineEndDate: '2024-01-01',
  trackNewAdditions: true,
  newAdditionsFilename: 'new-additions-data.json',
  trackTaxonChanges: true,
  taxonChangesFilename: 'taxon-changes-data.json',
  omitTaxonChangeIds: [136709],
  tempFolder: './temp',

  // only
  useLocalInatDataFiles: false,

  generateSpeciesFile: false,
  generateNewAdditionsFile: false,
  generateTaxonChangesFile: true,
};

export default config;
