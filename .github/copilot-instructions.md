# Project Guidelines

## About

This is a Turborepo monorepo for **inat-curated-species-list** — a tool for generating and displaying curated species checklists sourced from iNaturalist observations approved by designated expert curators. It is location and taxon agnostic.

Packages are split across two folders:

- `apps/` — runnable applications (management UI, dev UI, data generator)
- `packages/` — shared libraries (UI components, common types/helpers, standalone widget, data tools)

## Conventions

- React hooks for a component should be placed in a `./hooks` subfolder relative to that component.
