/**
 * One-off script to backfill curatorReviewCount for all existing species in baseline-species.json.
 *
 * Run from the apps/management directory:
 *   node server/backfill-curator-counts.js
 *
 * This will:
 *   1. Generate (or regenerate) the curator review summary from raw-inat-data/
 *   2. Update each entry in baseline-species.json with the matching curator review count
 */
import { generateCuratorSummary } from './curator-summary.js';
import { getBaselineSpecies, updateBaselineSpecies } from './baseline-species.js';

console.log('Generating curator review summary from raw-inat-data...');

let summary;
try {
  summary = generateCuratorSummary();
} catch (e) {
  console.error('Failed to generate curator summary:', e.message);
  process.exit(1);
}

console.log(
  `Summary generated. Files processed: ${summary.fileCount}, species with curator reviews: ${Object.keys(summary.counts).length}`,
);

const baselineData = getBaselineSpecies();

if (!baselineData?.data?.length) {
  console.log('No baseline species found in baseline-species.json. Nothing to update.');
  process.exit(0);
}

let updatedCount = 0;
const updatedData = baselineData.data.map((species) => {
  const count = summary.counts[String(species.id)] ?? 0;
  if (count > 0) {
    updatedCount++;
    return { ...species, curatorReviewCount: count };
  }
  return species;
});

const { success, error } = updateBaselineSpecies(updatedData);

if (!success) {
  console.error('Failed to write updated baseline-species.json:', error);
  process.exit(1);
}

console.log(`Done. Updated ${updatedCount} of ${updatedData.length} species with curator review counts.`);
