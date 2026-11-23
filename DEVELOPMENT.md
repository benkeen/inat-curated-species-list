## Development

1. Select the right version of node.
   `nvm use`

2. Bootstrap the monorepo
   `pnpm install`

3. Run the management app.
   `pnpm dev`

   Open the Vite URL printed in the terminal. The management API uses port 3000.

   To run the component demo instead, use `pnpm --filter inat-curated-list-dev-ui dev`.
   It also uses port 3000 by default, so stop the management app first.

---

## Plan to remove dependency on baseline species in iNat

### Setup work

1. First, generate a `baseline.json` file containing all species from the user account that entered the _known baseline species data_. This data file will be incorporated into the curated list generation script in lieu of the data already being in iNat.

```typescript
[
  {
    id: number;
    speciesName: string;
    taxonomy: []; // figure out type here
  }
  ...
]
```

3. Update the generation script for species data, new additions & taxon changes to factor in this data as a baseline. Accepting it as existing data.
4. Do a diff of old vs new files to confirm it's correct, then delete all observations on iNat made by that account.

- One off: run the generation script, then filter out anything in `baseline.json` that's already been identified on iNat.

### Regular usage

Okay! At this point, here's how regular usage of the script will work.

1. Run the generation script, but always have a copy of the last-ran `new-additions-data.json` file. That's essential.

   > Store the data files in a repo. It's the only sensible way. That would simplify logging change to `new-additions-data.json` and greatly simplify debugging when issues come up (we'll have the full history). Every time you run it, it would generate new JSON files for new additions, species + taxon changes & they would be committed to the repo if any changes took place.

2. Do a diff between the new additions data files (before + after). if there are new additions:
   1. Ping iNat (find endpoint here) to see if there's been a taxon change for the taxon IDs and names for any new additions.
   2. If there have been changes, examine `baseline.json` and see if any of that data is out of date. If so, set the new taxon names and IDs and re-run the generation script.
   3. If not, it's a genuine new addition.

### Notes

- Q: What about taxon changes for the baseline species that HAVE no observations?

  - these won't get updated and are effectively orphaned.
  - other than looping through each one (slow!) and updating, what options do we have? Though perhaps a script to do this could be ran very rarely.

- So part of this script would be describing how to manually create the baseline species - or providing a script to generate it from iNat.
