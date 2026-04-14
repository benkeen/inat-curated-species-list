import fs from 'fs';
import path from 'path';
import {
  extractSpeciesList,
  minifySpeciesData,
  getNumINatPacketFiles,
  getDataFilesContent,
  DEFAULT_TAXONS,
  type GeneratorConfig,
} from '@ecophilia/inat-curated-species-list-tools/generation-utils';
import { getBackupSettings } from './backup-settings.js';
import { getMainSettings } from './project-settings.js';
import { generateQueuedChanges } from './queued-changes.js';

type SpeciesDataValue = NonNullable<ReturnType<typeof extractSpeciesList>[string]>;

export type BaselineSpeciesEntry = {
  id: number;
  name: string;
  isActive: boolean;
  publicNotes: string;
  privateNotes: string;
  curatorReviewCount: number;
  researchGradeReviewCount: number;
  totalObservationCount: number;
  taxonomy: Record<string, string>;
};

type BaselineSpeciesFile = {
  validationDate: string;
  data: BaselineSpeciesEntry[];
};

type GenerateChecklistResult = {
  filesGenerated: string[];
  durationSeconds: number;
};

let isGenerating = false;

export const generateChecklistFiles = (): GenerateChecklistResult => {
  if (isGenerating) {
    throw new Error('Checklist generation is already in progress.');
  }

  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    throw new Error('Backup settings not configured.');
  }

  const settings = getMainSettings() as {
    placeId?: number;
    taxonId?: number;
    curators?: string | string[];
    baselineCompletionDate?: string;
    omitObservationsByUsers?: string | string[];
    taxonChangesFilename?: string;
  };

  const { placeId, taxonId, curators, baselineCompletionDate, omitObservationsByUsers } = settings;

  if (!placeId || !taxonId || !(Array.isArray(curators) ? curators.length : curators)) {
    throw new Error('Main settings not configured (placeId, taxonId, curators required).');
  }

  const backupFolder = backupSettings.backupFolder;
  const rawDataFolder = path.join(backupFolder, 'temp/inat-curated-observation-data');

  if (!fs.existsSync(rawDataFolder)) {
    throw new Error(`Raw iNat data folder not found at: ${rawDataFolder}. Run the iNat download first.`);
  }

  const numPacketFiles = getNumINatPacketFiles(rawDataFolder);
  if (numPacketFiles === 0) {
    throw new Error('No packet files found in the raw iNat data folder. Run the iNat download first.');
  }

  const curatorList = Array.isArray(curators) ? curators : curators!.split(',').map((c) => c.trim());
  const omitUsers = omitObservationsByUsers
    ? Array.isArray(omitObservationsByUsers)
      ? omitObservationsByUsers
      : omitObservationsByUsers.split(',').map((u) => u.trim())
    : [];

  const config: GeneratorConfig = {
    curators: curatorList,
    taxonId: Number(taxonId),
    placeId: Number(placeId),
    speciesDataFilename: 'species-data.json',
    trackNewAdditions: true,
    newAdditionsFilename: 'new-additions-data.json',
    showLastGeneratedDate: true,
    trackTaxonChanges: true,
    taxonChangesFilename: 'taxon-changes-data.json',
    tempFolder: rawDataFolder,
    useLocalInatDataFiles: true,
    taxons: DEFAULT_TAXONS,
    baselineEndDate: baselineCompletionDate,
    omitObservationsByUsers: omitUsers,
    omitTaxonChangeIds: [],
  };

  isGenerating = true;
  const startTime = Date.now();

  try {
    const speciesData = extractSpeciesList(config, rawDataFolder, numPacketFiles);

    const baselineSpeciesFile = path.join(backupFolder, 'baseline-species.json');
    if (fs.existsSync(baselineSpeciesFile)) {
      const baseline = JSON.parse(fs.readFileSync(baselineSpeciesFile, 'utf-8')) as BaselineSpeciesFile;
      for (const entry of baseline.data) {
        const taxonId = String(entry.id);
        if (speciesData[taxonId] || !entry.taxonomy || !entry.taxonomy['species']) {
          continue;
        }
        speciesData[taxonId] = {
          data: entry.taxonomy as SpeciesDataValue['data'],
          count: entry.curatorReviewCount ?? 0,
        };
      }
    }

    const fullSpeciesDataFile = path.join(backupFolder, 'species-data-full.json');
    fs.writeFileSync(fullSpeciesDataFile, JSON.stringify(speciesData, null, '\t'), 'utf-8');

    const minifiedSpeciesData = minifySpeciesData(speciesData, DEFAULT_TAXONS);

    const speciesDataFile = path.join(backupFolder, 'species-data.json');
    fs.writeFileSync(speciesDataFile, JSON.stringify(minifiedSpeciesData), 'utf-8');

    const { newAdditionsArray, taxonChangeDataGroupedByYear } = getDataFilesContent(
      config,
      numPacketFiles,
      rawDataFolder,
    );

    const newAdditionsFile = path.join(backupFolder, 'new-additions-data.json');
    fs.writeFileSync(newAdditionsFile, JSON.stringify(newAdditionsArray, null, '\t'), 'utf-8');

    const taxonChangesFile = path.join(backupFolder, 'taxon-changes-data.json');
    fs.writeFileSync(taxonChangesFile, JSON.stringify(taxonChangeDataGroupedByYear, null, '\t'), 'utf-8');

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    let queuedChanges = null;
    try {
      queuedChanges = generateQueuedChanges();
    } catch {
      // Non-fatal: queued changes generation failure should not block checklist generation
    }

    return {
      filesGenerated: [speciesDataFile, newAdditionsFile, taxonChangesFile],
      durationSeconds,
      queuedChanges,
    };
  } finally {
    isGenerating = false;
  }
};

export const getIsGenerating = () => isGenerating;
