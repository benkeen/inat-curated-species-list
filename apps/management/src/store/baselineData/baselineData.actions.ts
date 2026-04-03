import { getBaselineSpecies } from '../../api/api';
import { SortCol, SortDir } from '../../components/baseline/BaselineData.types';

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
