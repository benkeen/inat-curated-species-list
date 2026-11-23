import { GeneratorConfig, GetDataPacketResponse } from '../types/generator.types';
import { CuratedSpeciesData, RootTaxon, Taxon } from '@ecophilia/inat-curated-species-list-common';
import { getTaxonomy } from './helpers';
import { DEFAULT_TAXONS } from './constants';
import path from 'path';
import fs from 'fs';

export const extractSpeciesList = (
  config: GeneratorConfig,
  tempFolder: string,
  numRequests: number,
  additionalSpecies: CuratedSpeciesData = {},
) => {
  const curatedSpeciesData: CuratedSpeciesData = {};
  const ancestorIds = new Map<string, Set<number>>();
  let rootTaxon: RootTaxon | undefined;

  for (let packetNum = 1; packetNum <= numRequests; packetNum++) {
    const rawData: GetDataPacketResponse = JSON.parse(
      fs.readFileSync(path.resolve(tempFolder, `packet-${packetNum}.json`), 'utf-8'),
    );
    for (const observation of rawData.results) {
      for (const identification of observation.identifications) {
        if (!identification.current) continue;
        if (identification.taxon.id === config.taxonId) {
          rootTaxon = { id: identification.taxon.id, name: identification.taxon.name, rank: identification.taxon.rank };
        }
        for (const ancestor of identification.taxon.ancestors) {
          if (ancestor.is_active === false) continue;
          const key = JSON.stringify([ancestor.rank, ancestor.name]);
          const ids = ancestorIds.get(key) ?? new Set<number>();
          ids.add(ancestor.id);
          ancestorIds.set(key, ids);
          if (ancestor.id === config.taxonId) {
            rootTaxon = { id: ancestor.id, name: ancestor.name, rank: ancestor.rank };
          }
        }
      }
    }
    appendSpeciesFromPacket(
      rawData,
      config.curators,
      config.taxons ?? DEFAULT_TAXONS,
      curatedSpeciesData,
      config.omitObservationsByUsers ?? [],
    );
  }

  for (const [id, species] of Object.entries(additionalSpecies)) {
    curatedSpeciesData[id] ??= species;
  }
  for (const species of Object.values(curatedSpeciesData)) {
    species.taxonIds = {};
    for (const rank of config.taxons ?? DEFAULT_TAXONS) {
      if (rank === 'species' || !species.data[rank]) continue;
      const ids = ancestorIds.get(JSON.stringify([rank, species.data[rank]]));
      if (ids && ids.size > 1) {
        throw new Error(`Conflicting iNaturalist IDs for ${rank} "${species.data[rank]}": ${[...ids].join(', ')}.`);
      }
      if (ids?.size === 1) species.taxonIds[rank] = [...ids][0]!;
    }
    if (rootTaxon) species.rootTaxon = rootTaxon;
  }
  return curatedSpeciesData;
};

export const appendSpeciesFromPacket = (
  rawData: GetDataPacketResponse,
  curators: string[],
  taxonsToReturn: Taxon[],
  curatedSpeciesData: CuratedSpeciesData,
  omitUsers: string[] = [],
) => {
  const omitUsersLower = omitUsers.map((u) => u.toLowerCase());
  rawData.results.forEach((obs) => {
    if (omitUsersLower.includes(obs.user.login.toLowerCase())) {
      return;
    }
    obs.identifications.forEach((ident) => {
      if (curators.indexOf(ident.user.login) === -1) {
        return;
      }

      if (!ident.current) {
        return;
      }

      // ignore anything that isn't a species. Currently we're ignoring subspecies data and anything in a more general
      // rank isn't of use
      if (ident.taxon.rank !== 'species') {
        return;
      }

      // the data from the server is sorted by ID - oldest to newest - so here we've found the first *observation* of a species
      // that meets our curated reviewer requirements. This tracks when the species was *first confirmed* by a curated reviewer,
      // which might be vastly different from when the sighting was actually made
      if (!curatedSpeciesData[ident.taxon_id]) {
        const taxonomy = getTaxonomy(ident.taxon.ancestors, taxonsToReturn);
        taxonomy.species = ident.taxon.name;
        curatedSpeciesData[ident.taxon_id] = { data: taxonomy, count: 1 };

        // note: `count` just tracks how many observations have been reviewed and confirmed by our curators, not by anyone
      } else {
        curatedSpeciesData[ident.taxon_id]!.count++;
      }
    });
  });
};
