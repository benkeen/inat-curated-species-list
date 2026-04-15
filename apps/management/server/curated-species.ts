import fs from 'fs';
import path from 'path';
import { getBackupSettings } from './backup-settings.js';
import { getMainSettings } from './project-settings.js';

const OUTPUT_FILENAME = 'curated-species.json';

type TaxonomyMap = Record<string, string>;

type CuratedSpeciesEntry = {
  id: number;
  name: string;
  curatorReviewCount: number;
  taxonomy: TaxonomyMap;
};

export type CuratedSpeciesFile = {
  generationDate: string;
  data: CuratedSpeciesEntry[];
};

type Ancestor = {
  rank: string;
  name: string;
};

type InatTaxon = {
  id: number;
  name: string;
  rank: string;
  ancestors?: Ancestor[];
};

type Identification = {
  user?: { login: string };
  current: boolean;
  hidden: boolean;
  taxon?: InatTaxon;
  taxon_id: number;
};

type Observation = {
  user?: { login: string };
  identifications?: Identification[];
};

type PacketContent = {
  results?: Observation[];
};

const TAXONOMY_RANKS = ['superfamily', 'family', 'subfamily', 'tribe', 'genus', 'species'];

function buildTaxonomy(taxon: InatTaxon): TaxonomyMap {
  const taxonomy: TaxonomyMap = {};
  for (const ancestor of taxon.ancestors ?? []) {
    if (TAXONOMY_RANKS.includes(ancestor.rank)) {
      taxonomy[ancestor.rank] = ancestor.name;
    }
  }
  if (TAXONOMY_RANKS.includes(taxon.rank)) {
    taxonomy[taxon.rank] = taxon.name;
  }
  return taxonomy;
}

export const generateCuratedSpecies = (): CuratedSpeciesFile => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    throw new Error('Backup settings not configured.');
  }

  const settings = getMainSettings();

  const rawCurators = settings['curators'] as string | string[] | undefined;
  const curatorList: string[] = Array.isArray(rawCurators)
    ? rawCurators
    : typeof rawCurators === 'string' && rawCurators.trim()
      ? rawCurators
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  if (!curatorList.length) {
    throw new Error('No curators configured in main settings.');
  }

  const rawOmitUsers = settings['omitObservationsByUsers'] as string;
  const omitUsers = rawOmitUsers
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const rawDataFolder = path.join(backupSettings.backupFolder, 'temp', 'inat-curated-observation-data');
  if (!fs.existsSync(rawDataFolder)) {
    throw new Error(`Raw iNat data folder not found at: ${rawDataFolder}. Run the iNat download first.`);
  }

  const files = fs.readdirSync(rawDataFolder).filter((f) => f.endsWith('.json'));

  // taxonId → { name, curatorReviewCount, taxonomy }
  const speciesMap = new Map<number, CuratedSpeciesEntry>();

  for (const file of files) {
    const content = JSON.parse(fs.readFileSync(path.join(rawDataFolder, file), { encoding: 'utf-8' })) as PacketContent;

    for (const obs of content.results ?? []) {
      if (omitUsers.includes((obs.user?.login ?? '').toLowerCase())) {
        continue;
      }

      for (const ident of obs.identifications ?? []) {
        if (
          !curatorList.includes(ident.user?.login ?? '') ||
          !ident.current ||
          ident.hidden ||
          !ident.taxon ||
          ident.taxon.rank !== 'species'
        ) {
          continue;
        }

        const taxonId = ident.taxon.id;
        const existing = speciesMap.get(taxonId);
        if (existing) {
          existing.curatorReviewCount += 1;
        } else {
          speciesMap.set(taxonId, {
            id: taxonId,
            name: ident.taxon.name,
            curatorReviewCount: 1,
            taxonomy: buildTaxonomy(ident.taxon),
          });
        }
      }
    }
  }

  const data = [...speciesMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  const result: CuratedSpeciesFile = {
    generationDate: new Date().toISOString(),
    data,
  };

  fs.writeFileSync(
    path.join(backupSettings.backupFolder, OUTPUT_FILENAME),
    JSON.stringify(result, null, '\t'),
    'utf-8',
  );

  return result;
};

export const getCuratedSpecies = (): CuratedSpeciesFile | null => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return null;
  }

  const filePath = path.join(backupSettings.backupFolder, OUTPUT_FILENAME);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CuratedSpeciesFile;
  } catch {
    return null;
  }
};
