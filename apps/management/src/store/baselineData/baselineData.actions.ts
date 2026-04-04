import { getBaselineSpecies, updateBaselineSpecies } from '../../api/api';
import { SortCol, SortDir } from '../../components/baseline/BaselineData.types';
import { BaselineSpeciesInatData } from '../../types';

export const BASELINE_DATA_LOAD = 'BASELINE_DATA_LOAD';
export const BASELINE_DATA_LOADED = 'BASELINE_DATA_LOADED';
export const loadBaselineData = () => async (dispatch: any) => {
  dispatch({ type: BASELINE_DATA_LOAD });

  const resp = await getBaselineSpecies();
  const { validationDate, data } = await resp.json();

  dispatch({
    type: BASELINE_DATA_LOADED,
    payload: {
      validationDate,
      data,
    },
  });
};

export const BASELINE_DATA_SAVE = 'BASELINE_DATA_SAVE';
export const BASELINE_DATA_SAVED = 'BASELINE_DATA_SAVED';
export const saveBaselineData = (_data: any) => {};

export const BASELINE_DATA_SORT = 'BASELINE_DATA_SORT';
export const sortBaselineData = (sortCol: SortCol, sortDir: SortDir) => ({
  type: BASELINE_DATA_SORT,
  payload: { sortCol, sortDir },
});

export const deleteBaselineTaxon = (_taxonId: any) => {};

export const BASELINE_DATA_DELETE = 'BASELINE_DATA_DELETE';
export const deleteAndSaveBaselineSpecies = (taxonIds: number[]) => async (dispatch: any, getState: any) => {
  const state = getState();
  const remaining: BaselineSpeciesInatData[] = Object.keys(state.baselineData.data)
    .map((id) => ({ id: parseInt(id), ...state.baselineData.data[id] }))
    .filter(({ id }) => !taxonIds.includes(id));

  await updateBaselineSpecies({ data: remaining });
  dispatch({ type: BASELINE_DATA_DELETE, payload: taxonIds });
};

export const BASELINE_DATA_ADD = 'BASELINE_DATA_ADD';
export const addAndSaveBaselineSpecies = (species: BaselineSpeciesInatData) => async (dispatch: any, getState: any) => {
  const state = getState();
  const existingData: BaselineSpeciesInatData[] = Object.keys(state.baselineData.data).map((id) => ({
    id: parseInt(id),
    ...state.baselineData.data[id],
  }));

  const updated = [...existingData, species];
  await updateBaselineSpecies({ data: updated });

  dispatch({ type: BASELINE_DATA_ADD, payload: species });
};

export const BASELINE_DATA_BULK_UPDATE = 'BASELINE_DATA_BULK_UPDATE';
export const bulkUpdateAndSaveBaselineSpecies =
  (
    updates: Array<{ id: number; isActive: boolean; researchGradeReviewCount: number; totalObservationCount: number }>,
  ) =>
  async (dispatch: any, getState: any) => {
    const state = getState();
    const updatedArray: BaselineSpeciesInatData[] = Object.keys(state.baselineData.data).map((id) => {
      const numId = parseInt(id);
      const update = updates.find((u) => u.id === numId);
      const existing = { id: numId, ...state.baselineData.data[id] };
      if (update) {
        return {
          ...existing,
          isActive: update.isActive,
          researchGradeReviewCount: update.researchGradeReviewCount,
          totalObservationCount: update.totalObservationCount,
        };
      }
      return existing;
    });
    await updateBaselineSpecies({ data: updatedArray });
    dispatch({ type: BASELINE_DATA_BULK_UPDATE, payload: updates });
  };
