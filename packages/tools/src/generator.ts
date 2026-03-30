#!/usr/bin/env tsx
/**
 * The main data file generation script.
 */
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import fs from 'fs';
import { downloadDataPackets } from './request';
import { extractSpeciesList } from './extraction';
import { minifySpeciesData } from './minification';
import { clearTempFolder, initLogger } from './logs';
import { DEFAULT_TAXONS } from './constants';
import { getNumINatPacketFiles, parseDataFiles } from './helpers';
import { GeneratorConfig, NewAddition } from '../types/generator.types';
import { CuratedSpeciesData } from '@ecophilia/inat-curated-species-list-common';
import { performance } from 'perf_hooks';

export type { GeneratorConfig };
const { config: configFilePath } = yargs(hideBin(process.argv)).argv;

const generateSpeciesDataFile = (config: GeneratorConfig, speciesData: CuratedSpeciesData, tempFolder: string) => {
  const minifiedSpeciesData = minifySpeciesData(speciesData, config.taxons);

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

const sortByConfirmationDate = (a, b) => {
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
    taxons,
    omitTaxonChangeIds,
    tempFolder,
  );

  const newAdditionsArray: NewAddition[] = [];
  Object.keys(newAdditions).forEach((taxonId) => {
    newAdditions[taxonId].observations.sort(sortByConfirmationDate);

    // ignore any taxons that have confirmed observations prior to `baselineEndDate`
    if (newAdditions[taxonId].observations[0].confirmationDate < baselineEndDate) {
      return;
    }

    newAdditionsArray.push({
      ...newAdditions[taxonId].observations[0],
      taxonId,
      speciesName: newAdditions[taxonId].speciesName,
      user: newAdditions[taxonId].observations[0].user,
      taxonomy: newAdditions[taxonId].taxonomy,
    });
  });

  // sort remaining data
  newAdditionsArray.sort(sortByConfirmationDate);

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
    generateSpeciesFile: true,
    generateNewAdditionsFile: true,
    generateTaxonChangesFile: true,
    ...config.default,
  };

  const tempFolderFullPath = path.resolve(process.cwd(), cleanConfig.tempFolder);

  let currentStep = 1;

  // when `processLocalFilesMode` is enabled, the iNat data has already been generated and is present on disk under `packet-X.json` files.
  let numPacketFiles: number;
  if (cleanConfig.useLocalInatDataFiles) {
    numPacketFiles = getNumINatPacketFiles(tempFolderFullPath);
  } else {
    clearTempFolder(tempFolderFullPath);
    const logger = initLogger(tempFolderFullPath);
    const start = performance.now();

    console.log(`Step ${currentStep}: download data from iNat`);
    numPacketFiles = await downloadDataPackets(cleanConfig, tempFolderFullPath, logger);
    const end = performance.now();
    const date = new Date(end - start);
    console.log(`Time taken: ${date.getMinutes()}:${date.getSeconds()}s`);
    currentStep++;
  }

  const generatedFiles = [];
  if (cleanConfig.generateSpeciesFile) {
    console.log(`\nStep ${currentStep}: extract species list`);
    const speciesData = extractSpeciesList(cleanConfig, tempFolderFullPath, numPacketFiles);
    currentStep++;

    console.log(`\nStep ${currentStep}: generate species data file`);
    const speciesDataFilename = generateSpeciesDataFile(cleanConfig, speciesData, tempFolderFullPath);
    generatedFiles.push(speciesDataFilename);
    currentStep++;
  }

  console.log(`\nStep ${currentStep}: parsing iNat data`);
  const { newAdditionsArray, taxonChangeDataGroupedByYear } = getDataFilesContent(
    cleanConfig,
    numPacketFiles,
    tempFolderFullPath,
  );
  currentStep++;

  if (cleanConfig.trackNewAdditions && cleanConfig.generateNewAdditionsFile) {
    console.log(`\nStep ${currentStep}: generate new additions data file`);
    const newAdditionsFilename = path.resolve(`${tempFolderFullPath}/${cleanConfig.newAdditionsFilename}`);
    fs.writeFileSync(newAdditionsFilename, JSON.stringify(newAdditionsArray), 'utf-8');
    generatedFiles.push(newAdditionsFilename);
    currentStep++;
  }

  if (cleanConfig.trackTaxonChanges && cleanConfig.generateTaxonChangesFile) {
    console.log(`\nStep ${currentStep}: generate taxon changes data file`);
    const taxonChangesFilename = path.resolve(`${tempFolderFullPath}/${cleanConfig.taxonChangesFilename}`);
    fs.writeFileSync(taxonChangesFilename, JSON.stringify(taxonChangeDataGroupedByYear), 'utf-8');
    generatedFiles.push(taxonChangesFilename);
    currentStep++;
  }

  console.log('\n__________________________________________\n');
  console.log(`Complete. Data file(s) generated:`);
  console.log(generatedFiles.join('\n') + '\n\n');
})();
