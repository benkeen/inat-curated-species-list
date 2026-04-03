import { useDispatch, useSelector } from 'react-redux';
import { requestInatObservations } from '../../../store/main/main.actions';
import * as selectors from '../../../store/main/main.selectors';

export const useUpdateInaturalistData = () => {
  const dispatch = useDispatch();

  const isActive = useSelector(selectors.isInatObsDataRequestActive);
  const placeId = useSelector(selectors.getPlaceId);
  const taxonId = useSelector(selectors.getTaxonId);
  const curators = useSelector(selectors.getCurators);

  const startSync = () => dispatch(requestInatObservations({ placeId, taxonId, curators }) as any);

  return { isActive, startSync };
};
