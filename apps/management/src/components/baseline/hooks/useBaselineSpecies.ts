import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as actions from '../../../store/baselineData/baselineData.actions';
import * as selectors from '../../../store/baselineData/baselineData.selectors';

export const useBaselineSpecies = () => {
  const dispatch = useDispatch();

  const data = useSelector(selectors.getSortedBaselineData);
  const isLoading = useSelector(selectors.isLoading);
  const isLoaded = useSelector(selectors.isLoaded);
  const validationDate = useSelector(selectors.getValidationDate);

  useEffect(() => {
    dispatch(actions.loadBaselineData() as any);
  }, []);

  return { data, isLoading, isLoaded, validationDate };
};
