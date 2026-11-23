import { afterEach, describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CuratedSpeciesData, unminifySpeciesData } from '@ecophilia/inat-curated-species-list-common';
import { GeneratorConfig, GetDataPacketResponse } from '../types/generator.types';
import { extractSpeciesList } from './extraction';
import { minifySpeciesData } from './minification';

const packet: GetDataPacketResponse = {
  total_results: 1,
  results: [
    {
      id: 1,
      observed_on_details: { date: '2026-01-01' },
      created_at_details: { date: '2026-01-01' },
      user: { login: 'observer', name: 'Observer', id: 1 },
      taxon: { id: 123, rank: 'species', name: 'X alpha', is_active: true },
      identifications: [
        {
          taxon_id: 123,
          user: { login: 'curator' },
          current: true,
          created_at: '2026-01-01',
          previous_observation_taxon: { id: 123, name: 'X alpha', rank: 'species' },
          taxon: {
            id: 123,
            name: 'X alpha',
            rank: 'species',
            is_active: true,
            ancestors: [
              { id: 47157, name: 'Lepidoptera', rank: 'order', is_active: true },
              { id: 42, name: 'X', rank: 'genus', is_active: true },
            ],
          },
        },
      ],
    },
  ],
};
let folder: string | undefined;
afterEach(() => {
  if (folder) fs.rmSync(folder, { recursive: true });
  folder = undefined;
});

const extract = (raw: GetDataPacketResponse, additional?: CuratedSpeciesData) => {
  folder = fs.mkdtempSync(path.join(os.tmpdir(), 'icsl-extraction-test-'));
  fs.writeFileSync(path.join(folder, 'packet-1.json'), JSON.stringify(raw));
  const config: GeneratorConfig = {
    curators: ['curator'],
    taxonId: 47157,
    placeId: 1,
    speciesDataFilename: 'species.json',
    trackNewAdditions: false,
    newAdditionsFilename: '',
    showLastGeneratedDate: false,
    trackTaxonChanges: false,
    tempFolder: folder,
    taxons: ['genus', 'species'],
  };
  return extractSpeciesList(config, folder, 1, additional);
};

describe('extracting taxonomy metadata', () => {
  test('preserves ancestor IDs and configured root, without adding baseline counts to curated counts', () => {
    const data = extract(packet);
    expect(data['123']).toMatchObject({
      count: 1,
      taxonIds: { genus: 42 },
      rootTaxon: { id: 47157, name: 'Lepidoptera', rank: 'order' },
    });
    const encoded = minifySpeciesData(data, ['genus', 'species']);
    expect(encoded.taxonIds![encoded.taxonMap.X!]).toBe(42);
  });

  test('enriches baseline-only entries from current raw ancestors and ignores withdrawn or inactive namesakes', () => {
    const raw = structuredClone(packet);
    const current = raw.results[0]!.identifications[0]!;
    const withdrawn = structuredClone(current);
    withdrawn.current = false;
    withdrawn.taxon.ancestors[1] = { id: 999, name: 'X', rank: 'genus' };
    current.taxon.ancestors.push({ id: 998, name: 'X', rank: 'genus', is_active: false });
    raw.results[0]!.identifications.push(withdrawn);
    const extra = unminifySpeciesData({
      taxonMap: { X: 'a' },
      taxonData: { '123': 'a|X alpha|99', '456': 'a|X beta|5' },
      taxons: ['genus', 'species'],
      dateGenerated: '',
      '@ecophilia/inat-curated-species-list-tools': '1',
    });
    const data = extract(raw, extra);
    expect(data['123']!.count).toBe(1);
    expect(data['456']).toMatchObject({ taxonIds: { genus: 42 }, count: '5' });
  });

  test('rejects ambiguous active ancestor IDs rather than picking a link arbitrarily', () => {
    const raw = structuredClone(packet);
    raw.results[0]!.identifications[0]!.taxon.ancestors.push({ id: 99, name: 'X', rank: 'genus', is_active: true });
    expect(() => extract(raw)).toThrow('Conflicting iNaturalist IDs');
  });
});
