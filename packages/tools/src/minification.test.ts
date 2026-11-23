import { describe, expect, test } from 'vitest';
import { CuratedSpeciesDataMinified, unminifySpeciesData } from '@ecophilia/inat-curated-species-list-common';
import { minifySpeciesData } from './minification';

const legacy: CuratedSpeciesDataMinified = {
  taxonMap: { Noctuidae: 'a', Euxoa: 'b' },
  taxonData: { '123': 'a|b|Euxoa alpha|2', '456': 'a|b|Euxoa beta|3' },
  taxons: ['family', 'genus', 'species'],
  dateGenerated: '',
  '@ecophilia/inat-curated-species-list-tools': '1',
};

describe('taxon ID metadata', () => {
  test('roundtrips IDs once per code and shares them with baseline-only entries', () => {
    const data = unminifySpeciesData(legacy);
    data['123']!.taxonIds = { family: 48522, genus: 12345 };
    data['123']!.rootTaxon = { id: 47157, name: 'Lepidoptera', rank: 'order' };
    const result = minifySpeciesData(data, legacy.taxons);
    expect(Object.keys(result.taxonIds!)).toHaveLength(2);
    expect(result.taxonIds![result.taxonMap.Noctuidae!]).toBe(48522);
    expect(result.rootTaxon).toEqual(data['123']!.rootTaxon);
    const decoded = unminifySpeciesData(result);
    expect(decoded['456']!.taxonIds).toEqual({ family: 48522, genus: 12345 });
    expect(decoded['456']!.rootTaxon).toEqual(result.rootTaxon);
    expect(decoded['123']!.data).toEqual(data['123']!.data);
  });

  test('keeps older data compatible without inventing IDs or root metadata', () => {
    const result = minifySpeciesData(unminifySpeciesData(legacy), legacy.taxons);
    expect(result.taxonIds).toBeUndefined();
    expect(result.rootTaxon).toBeUndefined();
    expect(unminifySpeciesData(result)['123']!.taxonIds).toBeUndefined();
  });

  test('rejects conflicting IDs for names that share a compact code', () => {
    const data = unminifySpeciesData(legacy);
    data['123']!.taxonIds = { family: 1 };
    data['456']!.taxonIds = { family: 2 };
    expect(() => minifySpeciesData(data, legacy.taxons)).toThrow('Conflicting iNaturalist IDs');
  });

  test('rejects conflicting root metadata', () => {
    const data = unminifySpeciesData(legacy);
    data['123']!.rootTaxon = { id: 1, name: 'A', rank: 'order' };
    data['456']!.rootTaxon = { id: 2, name: 'B', rank: 'order' };
    expect(() => minifySpeciesData(data, legacy.taxons)).toThrow('Conflicting root taxon');
  });
});
