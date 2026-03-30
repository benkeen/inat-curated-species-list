## Changelog

**2.0.0**: Mar 2026, in development.

- Rewriting in TS, Turborepo.
- Separate the script into two published packages:

  - `@ecophilia/inat-curated-species-list-ui` - React components to render the data
  - `@ecophilia/inat-curated-species-list-tools` - CLI script for extracting the data from iNat's API and generating the data files

- private packages:

  - `@ecophilia/inat-curated-species-list-generator` - simple package that illustrates the use of `@ecophilia/inat-curated-species-list-tools`

- Adding option to show _recent additions to the curated list_.
- Remove front-end logic to dynamically ping iNat for the data.

**1.0.0**: Nov 11th 2022

- initial version.
