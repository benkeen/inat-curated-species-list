## @ecophilia/inat-curated-species-list-tools

This package contains a script to generate the data files used for the [@ecophilia/inat-curated-species-list](https://github.com/IMERSS/inat-curated-species-list)
react components. Depending on what you want, it creates three separate JSON files for use by the script. The filenames
are configurable, but these are the defaults:

1. `species-data.json`: the primary species data file for the curated checklist. This contains full taxonomy information for whatever
   taxons you need for display purposes.
2. `new-additions.json`: a list of additions to the checklist from a specific date onwards, grouped by year. It treats identifications
   for species made before that date to be part of the baseline. Those will only ever appear in the `species-data.json` data but never in the
   `new-additions.json` file.
3. `taxon-changes.json`: a list of taxon changes grouped by year. This also uses the same baselineEndDate date as the cut-off for new additions.
