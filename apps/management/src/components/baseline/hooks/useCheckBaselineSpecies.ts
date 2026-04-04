import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getBaselineData } from '../../../store/baselineData/baselineData.selectors';
import { getPlaceId } from '../../../store/main/main.selectors';
import { bulkUpdateAndSaveBaselineSpecies } from '../../../store/baselineData/baselineData.actions';
import { BaselineDataObj } from '../BaselineData.types';

export type CheckPhase = 'pass1' | 'pass2' | 'pass3' | 'saving';
export type CheckStatus = 'idle' | 'running' | 'complete';

type UpdateResult = {
  id: number;
  isActive: boolean;
  researchGradeReviewCount: number;
  totalObservationCount: number;
};

const SPECIES_COUNTS_BATCH_SIZE = 20;
const TAXA_BATCH_SIZE = 30;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const tallyChanges = (updates: UpdateResult[], baselineData: BaselineDataObj) => {
  let newInactiveCount = 0;
  let totalInactiveCount = 0;
  let rgChangeCount = 0;
  for (const update of updates) {
    if (!update.isActive) totalInactiveCount++;
    const existing = baselineData[update.id as any];
    if (existing) {
      if (existing.isActive && !update.isActive) newInactiveCount++;
      if ((existing.researchGradeReviewCount || 0) !== update.researchGradeReviewCount) rgChangeCount++;
    }
  }
  return { newInactiveCount, totalInactiveCount, rgChangeCount };
};

export const useCheckBaselineSpecies = () => {
  const dispatch = useDispatch();
  const baselineData = useSelector(getBaselineData);
  const placeId = useSelector(getPlaceId);

  const [status, setStatus] = useState<CheckStatus>('idle');
  const [phase, setPhase] = useState<CheckPhase>('pass1');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [inactiveChanges, setInactiveChanges] = useState(0);
  const [totalInactiveCount, setTotalInactiveCount] = useState(0);
  const [rgChanges, setRgChanges] = useState(0);

  const reset = useCallback(() => {
    setStatus('idle');
    setPhase('pass1');
    setProgress(0);
    setTotal(0);
    setInactiveChanges(0);
    setTotalInactiveCount(0);
    setRgChanges(0);
  }, []);

  const start = useCallback(async () => {
    setStatus('running');
    setPhase('pass1');
    setProgress(0);

    const species = Object.keys(baselineData).map((id) => ({
      id: parseInt(id),
      ...baselineData[id as any],
    }));

    // --- Pass 1: species_counts — get research grade counts ---
    const pass1Batches: (typeof species)[] = [];
    for (let i = 0; i < species.length; i += SPECIES_COUNTS_BATCH_SIZE) {
      pass1Batches.push(species.slice(i, i + SPECIES_COUNTS_BATCH_SIZE));
    }
    setTotal(pass1Batches.length);

    // rgCounts[taxonId] = count from species_counts (0 if not found)
    const rgCounts = new Map<number, number>(species.map((s) => [s.id, 0]));

    for (let i = 0; i < pass1Batches.length; i++) {
      if (i > 0) await sleep(1000);
      const batch = pass1Batches[i];
      const taxonIds = batch.map((s) => s.id).join(',');
      const url = `https://api.inaturalist.org/v2/observations/species_counts?spam=false&taxon_id=${taxonIds}&place_id=${placeId}&preferred_place_id=${placeId}&quality_grade=research&locale=en-US&per_page=50&fields=(taxon:(id:!t,name:!t,rank:!t))`;

      try {
        const resp = await fetch(url);
        const data = await resp.json();
        for (const result of data.results || []) {
          rgCounts.set(result.taxon.id, result.count);
        }
      } catch {
        // keep 0 for this batch on error
      }

      setProgress(i + 1);
    }

    // --- Pass 2: /v1/taxa/{ids} batches — definitive is_active per taxon ---
    const pass2Batches: (typeof species)[] = [];
    for (let i = 0; i < species.length; i += TAXA_BATCH_SIZE) {
      pass2Batches.push(species.slice(i, i + TAXA_BATCH_SIZE));
    }
    setPhase('pass2');
    setProgress(0);
    setTotal(pass2Batches.length);

    // isActive[taxonId] = active state from taxa endpoint; falls back to existing value
    const isActiveMap = new Map<number, boolean>(species.map((s) => [s.id, s.isActive]));

    for (let i = 0; i < pass2Batches.length; i++) {
      if (i > 0) await sleep(1000);
      const batch = pass2Batches[i];
      const ids = batch.map((s) => s.id).join(',');
      const url = `https://api.inaturalist.org/v1/taxa/${ids}?per_page=${TAXA_BATCH_SIZE}`;

      try {
        const resp = await fetch(url);
        const data = await resp.json();
        for (const taxon of data.results || []) {
          isActiveMap.set(taxon.id, taxon.is_active);
        }
      } catch {
        // keep existing is_active for this batch on error
      }

      setProgress(i + 1);
    }

    // --- Pass 3: species_counts (verifiable=true) — get total observation counts ---
    const pass3Batches: (typeof species)[] = [];
    for (let i = 0; i < species.length; i += SPECIES_COUNTS_BATCH_SIZE) {
      pass3Batches.push(species.slice(i, i + SPECIES_COUNTS_BATCH_SIZE));
    }
    setPhase('pass3');
    setProgress(0);
    setTotal(pass3Batches.length);

    // totalObsCounts[taxonId] = total verifiable observations (0 if not found)
    const totalObsCounts = new Map<number, number>(species.map((s) => [s.id, 0]));

    for (let i = 0; i < pass3Batches.length; i++) {
      if (i > 0) await sleep(1000);
      const batch = pass3Batches[i];
      const taxonIds = batch.map((s) => s.id).join(',');
      const url = `https://api.inaturalist.org/v2/observations/species_counts?taxon_id=${taxonIds}&place_id=${placeId}&preferred_place_id=${placeId}&verifiable=true&per_page=50&fields=(taxon:(id:!t,name:!t,rank:!t))`;

      try {
        const resp = await fetch(url);
        const data = await resp.json();
        for (const result of data.results || []) {
          totalObsCounts.set(result.taxon.id, result.count);
        }
      } catch {
        // keep 0 for this batch on error
      }

      setProgress(i + 1);
    }

    const updates: UpdateResult[] = species.map((s) => ({
      id: s.id,
      isActive: isActiveMap.get(s.id) ?? s.isActive,
      researchGradeReviewCount: rgCounts.get(s.id) ?? 0,
      totalObservationCount: totalObsCounts.get(s.id) ?? 0,
    }));

    // --- Save ---
    const { newInactiveCount, totalInactiveCount, rgChangeCount } = tallyChanges(updates, baselineData);
    setInactiveChanges(newInactiveCount);
    setTotalInactiveCount(totalInactiveCount);
    setRgChanges(rgChangeCount);

    setPhase('saving');
    await (dispatch as any)(bulkUpdateAndSaveBaselineSpecies(updates));

    setStatus('complete');
  }, [baselineData, dispatch, placeId]);

  return { status, phase, progress, total, inactiveChanges, totalInactiveCount, rgChanges, start, reset };
};
