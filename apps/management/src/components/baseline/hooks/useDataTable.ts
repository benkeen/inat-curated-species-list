import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../../../store/baselineData/baselineData.actions';
import * as selectors from '../../../store/baselineData/baselineData.selectors';
import { SortCol, SortDir } from '../BaselineData.types';

export const useDataTable = (filterText: string) => {
  const dispatch = useDispatch();

  const sorted = useSelector(selectors.getSortedBaselineData);
  const sortCol = useSelector(selectors.getSortCol);
  const sortDir = useSelector(selectors.getSortDir);

  const data = filterText ? sorted.filter((row) => row.name.toLowerCase().includes(filterText.toLowerCase())) : sorted;

  const onSort = (col: SortCol, dir: SortDir) => dispatch(actions.sortBaselineData(col, dir));
  const onDeleteRows = (taxonIds: number[]) => dispatch(actions.deleteAndSaveBaselineSpecies(taxonIds) as any);

  return { data, sortCol, sortDir, onSort, onDeleteRows };
};
