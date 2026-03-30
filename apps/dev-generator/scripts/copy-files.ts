import config from '../config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  speciesDataFilename,
  newAdditionsFilename,
  taxonChangesFilename,
  tempFolder,
  trackNewAdditions,
  trackTaxonChanges,
} = config;

const sourceFolder = path.resolve(__dirname, '..', tempFolder);
const targetFolder = path.resolve(__dirname, '../../dev-ui/public');

fs.copyFileSync(`${sourceFolder}/${speciesDataFilename}`, `${targetFolder}/${speciesDataFilename}`);

if (trackNewAdditions && newAdditionsFilename) {
  fs.copyFileSync(`${sourceFolder}/${newAdditionsFilename}`, `${targetFolder}/${newAdditionsFilename}`);
}

if (trackTaxonChanges && taxonChangesFilename) {
  fs.copyFileSync(`${sourceFolder}/${taxonChangesFilename}`, `${targetFolder}/${taxonChangesFilename}`);
}
