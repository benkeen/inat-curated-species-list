# Project Guidelines

## About

This is a Turborepo monorepo for **inat-curated-species-list** — a tool for generating and displaying curated species checklists sourced from iNaturalist observations approved by designated expert curators. It is location and taxon agnostic.

Packages are split across two folders:

- `apps/` — runnable applications (management UI, dev UI, data generator)
- `packages/` — shared libraries (UI components, common types/helpers, standalone widget, data tools)

## Key Data Files

All user data is stored in a **backup folder** — a local git repo configured by the user via the management UI. There is also one local config file stored inside the management app server itself.

### Local to the management server (`apps/management/server/generated/`)

| File                   | Contents                                              |
| ---------------------- | ----------------------------------------------------- |
| `backup-settings.json` | Path to the backup folder: `{ backupFolder: string }` |

### In the backup folder

| File                                               | Contents                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `project-settings.json`                            | Project-wide settings: `{ main: { placeId, taxonId, curators, omitObservationsByUsers, baselineCompletionDate }, newAdditions: { enabled }, taxonChanges: { enabled } }`                                                                                                                                                                  |
| `baseline-species.json`                            | User-curated species baseline list: `{ validationDate: string, data: [{ id, name, isActive, researchGradeReviewCount, totalObservationCount, publicNotes, privateNotes }] }`. Note: `curatorReviewCount` was previously stored here but has been removed — it now lives exclusively in `curator-review-summary.json`.                     |
| `curator-review-summary.json`                      | Aggregated count of current, non-hidden curator identifications per species, derived from `temp/inat-curated-observation-data/`. Shape: `{ generatedAt: string, fileCount: number, counts: Record<taxonId, number> }`. This is the single source of truth for curator review counts covering all species, not just those on the baseline. |
| `species-data.json`                                | Generated public checklist output (minified). Produced by the "Generate Checklist" step.                                                                                                                                                                                                                                                  |
| `new-additions-data.json`                          | Species added to the checklist after the baseline completion date, grouped by year. Produced by the "Generate Checklist" step.                                                                                                                                                                                                            |
| `taxon-changes-data.json`                          | Taxon changes (splits, merges, etc.) grouped by year. Produced by the "Generate Checklist" step.                                                                                                                                                                                                                                          |
| `unconfirmed-species.json`                         | Species observed in the region but not yet curator-approved. Shape: `{ dateGenerated, totalReported, totalUnconfirmed, species: [{ taxonId, name, ... }] }`                                                                                                                                                                               |
| `logs/inat-curated-observations-download.json`     | Metadata about the last iNat data download: `{ lastRun, totalObservations, totalPackets, durationSeconds, success, error? }`                                                                                                                                                                                                              |
| `temp/inat-curated-observation-data/packet-N.json` | Raw paginated iNaturalist API responses downloaded during the iNat data download step. Consumed by checklist generation and curator summary generation.                                                                                                                                                                                   |

## Conventions

- React hooks for a component should be placed in a `./hooks` subfolder relative to that component.
