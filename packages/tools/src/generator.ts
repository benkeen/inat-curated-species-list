#!/usr/bin/env tsx
/**
 * The main data file generation script.
 */
import path from 'path';
import fs from 'fs';
import colors from 'ansi-colors';
import { downloadDataPackets } from './request';
import { extractSpeciesList } from './extraction';
import { minifySpeciesData } from './minification';
import { clearTempFolder, initLogger } from './logs';
import { DEFAULT_TAXONS } from './constants';
import {
  getNumINatPacketFiles,
  parseDataFiles,
  DIVIDER,
  startStep,
  completeStep,
  configFilePath,
  formatElapsed,
} from './helpers';
import { GeneratorConfig, NewAddition } from '../types/generator.types';
import { CuratedSpeciesData } from '@ecophilia/inat-curated-species-list-common';
import { performance } from 'perf_hooks';

export type { GeneratorConfig };

const generateSpeciesDataFile = (config: GeneratorConfig, speciesData: CuratedSpeciesData, tempFolder: string) => {
  const minifiedSpeciesData = minifySpeciesData(speciesData, config.taxons ?? DEFAULT_TAXONS);

  const filename = path.resolve(tempFolder, config.speciesDataFilename);
  if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
  }
  if (fs.existsSync(filename)) {
    fs.unlinkSync(filename);
  }
  fs.writeFileSync(filename, JSON.stringify(minifiedSpeciesData));

  return filename;
};

const sortByConfirmationDate = (a: { confirmationDateUnix: number }, b: { confirmationDateUnix: number }) => {
  if (a.confirmationDateUnix < b.confirmationDateUnix) {
    return -1;
  } else if (a.confirmationDateUnix > b.confirmationDateUnix) {
    return 1;
  }
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

    // ignore any taxons that have confirmed observations prior to `baselineEndDate`
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

  // sort remaining data
  newAdditionsArray.sort((a, b) =>
    a.confirmationDate < b.confirmationDate ? -1 : a.confirmationDate > b.confirmationDate ? 1 : 0,
  );

  return {
    newAdditionsArray,
    taxonChangeDataGroupedByYear,
  };
};

(async () => {
  // check the user has specified a config file
  if (!configFilePath) {
    console.error('Please specify a --config parameter linking to your config.ts file.');
    process.exit(1);
  }

  // check the file exists
  const configFile = path.resolve(process.cwd(), configFilePath);
  if (!fs.existsSync(configFile)) {
    console.error(`The config file cannot be found at this location: ${configFile}`);
    process.exit(1);
  }

  // assumption here is that it's returning an object of type GeneratorConfig. Runtime check?
  const config = await import(configFile);
  const cleanConfig: GeneratorConfig = {
    tempFolder: './temp',
    speciesDataFilename: 'species-data.json',
    newAdditionsFilename: 'new-additions-data.json',
    taxons: DEFAULT_TAXONS,
    omitTaxonChangeIds: [],
    useLocalInatDataFiles: false,
    ...config.default,
  };

  const tempFolderFullPath = path.resolve(process.cwd(), cleanConfig.tempFolder);

  console.log(`\n${DIVIDER}`);
  console.log(colors.bold('  iNat Curated Species List Generator'));
  console.log(DIVIDER);

  const totalStart = performance.now();
  let currentStep = 1;
  const generatedFiles: string[] = [];

  // when `processLocalFilesMode` is enabled, the iNat data has already been generated and is present on disk under `packet-X.json` files.
  let numPacketFiles: number;
  if (cleanConfig.useLocalInatDataFiles) {
    numPacketFiles = getNumINatPacketFiles(tempFolderFullPath);
  } else {
    clearTempFolder(tempFolderFullPath);
    const logger = initLogger(tempFolderFullPath);

    const t = startStep(currentStep++, 'Downloading data from iNat');
    numPacketFiles = await downloadDataPackets(cleanConfig, tempFolderFullPath, logger);
    completeStep(t);
  }

  {
    let t = startStep(currentStep++, 'Extracting species list');
    const speciesData = extractSpeciesList(cleanConfig, tempFolderFullPath, numPacketFiles);
    completeStep(t);

    t = startStep(currentStep++, 'Generating species data file');
    const speciesDataFilename = generateSpeciesDataFile(cleanConfig, speciesData, tempFolderFullPath);
    generatedFiles.push(speciesDataFilename);
    completeStep(t);
  }

  let t = startStep(currentStep++, 'Parsing iNat data');
  const { newAdditionsArray, taxonChangeDataGroupedByYear } = getDataFilesContent(
    cleanConfig,
    numPacketFiles,
    tempFolderFullPath,
  );
  completeStep(t);

  if (cleanConfig.trackNewAdditions) {
    t = startStep(currentStep++, 'Generating new additions file');
    const newAdditionsFilename = path.resolve(`${tempFolderFullPath}/${cleanConfig.newAdditionsFilename}`);
    fs.writeFileSync(newAdditionsFilename, JSON.stringify(newAdditionsArray), 'utf-8');
    generatedFiles.push(newAdditionsFilename);
    completeStep(t);
  }

  if (cleanConfig.trackTaxonChanges) {
    t = startStep(currentStep++, 'Generating taxon changes file');
    const taxonChangesFilename = path.resolve(`${tempFolderFullPath}/${cleanConfig.taxonChangesFilename}`);
    fs.writeFileSync(taxonChangesFilename, JSON.stringify(taxonChangeDataGroupedByYear), 'utf-8');
    generatedFiles.push(taxonChangesFilename);
    completeStep(t);
  }

  const totalElapsed = formatElapsed(performance.now() - totalStart);
  console.log(`\n${DIVIDER}`);
  console.log(
    `  ${colors.bold.green('✓ Complete')} ${colors.dim(`in ${totalElapsed}`)} — ${colors.bold(String(generatedFiles.length))} file(s) generated:`,
  );
  generatedFiles.forEach((f) => console.log(`    ${colors.dim('→')} ${f}`));
  console.log(`${DIVIDER}\n`);
})();
