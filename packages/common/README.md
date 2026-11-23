## Common code for @ecophilia/inat-curated-species-list

This contains some shared types, constants and helpers used by:

- [@ecophilia/inat-curated-species-list-ui](../ui)
- [@ecophilia/inat-curated-species-list-tools](../tools)

Generated checklists optionally include `taxonIds`, a mapping from the existing
`taxonMap` short codes to numeric iNaturalist taxon IDs, and `rootTaxon`:
`{ id: number, name: string, rank: Taxon }`. Species IDs remain the keys of
`taxonData`. Older files without this metadata remain supported.

The expanded species records optionally carry `taxonIds` keyed by rank and
`rootTaxon`. Generation extracts these from downloaded identification ancestors;
metadata lookup uses current identifications and excludes inactive ancestors.
Baseline-only species can obtain IDs from those same packets. Minification
deduplicates IDs and rejects conflicting IDs for a shared taxon name
instead of producing incorrect links.
