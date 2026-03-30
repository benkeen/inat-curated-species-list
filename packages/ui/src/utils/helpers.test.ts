import { NewAddition } from '@ecophilia/inat-curated-species-list-tools';
import { getNewAdditionDataForUI } from './helpers';
import { describe, expect, test } from 'vitest';

describe('getNewAdditionDataForUI', () => {
  test('...', () => {
    const { years } = getNewAdditionDataForUI([{ confirmationDate: '2024-01-02' }] as unknown as NewAddition[]);
    expect(years).toEqual(['2024', '2025']);
  });
});
