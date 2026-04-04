import fs from 'fs';
import path from 'path';
import { getBackupSettings } from './backup-settings.js';
import { getMainSettings } from './project-settings.js';
import type { UnconfirmedCheckProgress, UnconfirmedCheckResult } from './unconfirmed-species-state.js';

type SpeciesDataMinified = {
  taxonData: Record<string, string>;
};

const INAT_API_URL = 'https://api.inaturalist.org/v2/observations/species_counts';
const PER_PAGE = 200;
const REQUEST_DELAY_MS = 1000;

export type UnconfirmedSpeciesEntry = {
  name: string;
  taxonId: string;
  count: number;
};

export type UnconfirmedSpeciesData = {
  dateGenerated: string;
  totalReported: number;
  totalUnconfirmed: number;
  species: UnconfirmedSpeciesEntry[];
};

type InatSpeciesCountResult = {
  count: number;
  taxon: {
    id: number;
    name: string;
    is_active: boolean;
  };
};

type InatSpeciesCountResponse = {
  total_results: number;
  results: InatSpeciesCountResult[];
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchPage = async (placeId: number, taxonId: number, page: number): Promise<InatSpeciesCountResponse> => {
  const params = new URLSearchParams({
    verifiable: 'true',
    spam: 'false',
    place_id: String(placeId),
    taxon_id: String(taxonId),
    rank: 'species',
    per_page: String(PER_PAGE),
    page: String(page),
    fields: '(taxon:(id:!t,name:!t))',
  });
  const url = `${INAT_API_URL}?${params.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`iNat API request failed: ${resp.status} ${resp.statusText}`);
  }
  return resp.json() as Promise<InatSpeciesCountResponse>;
};

export const startUnconfirmedSpeciesCheck = async (
  onProgress: (progress: UnconfirmedCheckProgress) => void,
): Promise<UnconfirmedCheckResult> => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    throw new Error('Backup settings not configured.');
  }

  const settings = getMainSettings() as { placeId?: number; taxonId?: number };
  const { placeId, taxonId } = settings;
  if (!placeId || !taxonId) {
    throw new Error('Main settings not configured (placeId, taxonId required).');
  }

  const backupFolder = backupSettings.backupFolder;
  const rawFolder = path.join(backupFolder, 'raw-full-species-list');

  // Clear and recreate the raw folder
  if (fs.existsSync(rawFolder)) {
    fs.rmSync(rawFolder, { recursive: true, force: true });
  }
  fs.mkdirSync(rawFolder, { recursive: true });

  // Fetch first page to determine total
  const firstPage = await fetchPage(placeId, taxonId, 1);
  const totalResults = firstPage.total_results;
  const totalPages = Math.max(1, Math.ceil(totalResults / PER_PAGE));

  fs.writeFileSync(path.join(rawFolder, 'page-1.json'), JSON.stringify(firstPage), 'utf-8');

  onProgress({ phase: 'downloading', currentPage: 1, totalPages });

  // Fetch remaining pages
  for (let page = 2; page <= totalPages; page++) {
    await sleep(REQUEST_DELAY_MS);
    const pageData = await fetchPage(placeId, taxonId, page);
    fs.writeFileSync(path.join(rawFolder, `page-${page}.json`), JSON.stringify(pageData), 'utf-8');
    onProgress({ phase: 'downloading', currentPage: page, totalPages });
  }

  // Processing phase
  onProgress({ phase: 'processing', currentPage: totalPages, totalPages });

  // Aggregate all species from raw files
  const allSpecies = new Map<string, { name: string; count: number }>();
  for (let page = 1; page <= totalPages; page++) {
    const raw = fs.readFileSync(path.join(rawFolder, `page-${page}.json`), 'utf-8');
    const pageData = JSON.parse(raw) as InatSpeciesCountResponse;
    for (const entry of pageData.results) {
      const id = String(entry.taxon.id);
      if (!allSpecies.has(id)) {
        allSpecies.set(id, { name: entry.taxon.name, count: entry.count });
      }
    }
  }

  // Load species-data.json to get confirmed taxon IDs
  const speciesDataFile = path.join(backupFolder, 'species-data.json');
  let confirmedIds = new Set<string>();
  if (fs.existsSync(speciesDataFile)) {
    const speciesDataRaw = fs.readFileSync(speciesDataFile, 'utf-8');
    const speciesData = JSON.parse(speciesDataRaw) as SpeciesDataMinified;
    confirmedIds = new Set(Object.keys(speciesData.taxonData));
  }

  // Find unconfirmed species and sort by count descending
  const unconfirmedSpecies: UnconfirmedSpeciesEntry[] = [];
  for (const [taxonId, { name, count }] of allSpecies) {
    if (!confirmedIds.has(taxonId)) {
      unconfirmedSpecies.push({ name, taxonId, count });
    }
  }
  unconfirmedSpecies.sort((a, b) => b.count - a.count);

  const result: UnconfirmedSpeciesData = {
    dateGenerated: new Date().toISOString(),
    totalReported: allSpecies.size,
    totalUnconfirmed: unconfirmedSpecies.length,
    species: unconfirmedSpecies,
  };

  fs.writeFileSync(path.join(backupFolder, 'unconfirmed-species.json'), JSON.stringify(result), 'utf-8');

  return {
    totalReported: result.totalReported,
    totalUnconfirmed: result.totalUnconfirmed,
    completedAt: result.dateGenerated,
  };
};

export const getUnconfirmedSpecies = (): { exists: boolean; data: UnconfirmedSpeciesData | null } => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return { exists: false, data: null };
  }

  const filePath = path.join(backupSettings.backupFolder, 'unconfirmed-species.json');
  if (!fs.existsSync(filePath)) {
    return { exists: false, data: null };
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return { exists: true, data: JSON.parse(raw) as UnconfirmedSpeciesData };
  } catch {
    return { exists: false, data: null };
  }
};
