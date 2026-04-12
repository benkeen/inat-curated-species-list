import * as actions from './baselineData.actions';
import * as mainActions from '../main/main.actions';
import { BaselineDataObj, SortCol, SortDir } from '../../components/baseline/BaselineData.types';
import { BaselineSpeciesInatData, MessageType } from '../../types';

export type BaselineDataState = {
  data: BaselineDataObj;
  sortCol: SortCol;
  sortDir: SortDir;
  sortedTaxonIds: number[];
  isLoading: boolean;
  isLoaded: boolean;
  validationDate: string | null;
  lastMessage: null;
  messageType: MessageType | null;
};

const getSortedTaxonIds = (data: BaselineSpeciesInatData[], sortDir: SortDir, sortCol: SortCol) =>
  data
    .sort((a, b) => {
      if (sortCol === 'name') {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();

        if (sortDir === 'asc') {
          if (aName < bName) {
            return -1;
          }
          if (aName > bName) {
            return 1;
          }
        } else {
          if (aName > bName) {
            return -1;
          }
          if (aName < bName) {
            return 1;
          }
        }
        return 0;
      } else if (sortCol === 'id') {
        if (sortDir === 'asc') {
          return a.id - b.id;
        } else {
          return b.id - a.id;
        }
      } else if (sortCol === 'researchGradeReviewCount') {
        if (sortDir === 'asc') {
          return (a.totalObservationCount || 0) - (b.totalObservationCount || 0);
        } else {
          return (b.totalObservationCount || 0) - (a.totalObservationCount || 0);
        }
      } else if (sortCol === 'isActive') {
        const aVal = a.isActive ? 1 : 0;
        const bVal = b.isActive ? 1 : 0;
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      } else if (sortCol === 'notes') {
        const aHas = a.publicNotes || a.privateNotes ? 1 : 0;
        const bHas = b.publicNotes || b.privateNotes ? 1 : 0;
        return sortDir === 'asc' ? aHas - bHas : bHas - aHas;
      }

      if (sortDir === 'asc') {
        return (a.curatorReviewCount || 0) - (b.curatorReviewCount || 0);
      } else {
        return (b.curatorReviewCount || 0) - (a.curatorReviewCount || 0);
      }
    })
    .map(({ id }) => id);

const initialState: BaselineDataState = {
  data: {},
  sortCol: 'name',
  sortDir: 'asc',
  sortedTaxonIds: [],
  isLoading: false,
  isLoaded: false,
  validationDate: null,
  lastMessage: null,
  messageType: null,
};

const baselineDataReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case mainActions.PURGE_STATE:
      return initialState;

    case actions.BASELINE_DATA_LOAD:
      return {
        ...state,
        isLoading: true,
      };

    case actions.BASELINE_DATA_LOADED:
      const dataArray: BaselineSpeciesInatData[] = action.payload.data;
      const dataObj: BaselineDataObj = {};
      dataArray.forEach(({ id, ...other }) => (dataObj[id] = other));

      return {
        ...state,
        isLoading: false,
        isLoaded: true,
        data: dataObj,
        sortedTaxonIds: getSortedTaxonIds(dataArray, state.sortDir, state.sortCol),
      };

    case actions.BASELINE_DATA_SORT: {
      const dataArray: BaselineSpeciesInatData[] = Object.keys(state.data).map((id) => ({
        id: parseInt(id),
        ...state.data[id],
      }));

      return {
        ...state,
        sortCol: action.payload.sortCol,
        sortDir: action.payload.sortDir,
        sortedTaxonIds: getSortedTaxonIds(dataArray, action.payload.sortDir, action.payload.sortCol),
      };
    }

    case actions.BASELINE_DATA_DELETE: {
      const idsToDelete: number[] = action.payload;
      const newData = { ...state.data };
      idsToDelete.forEach((id) => delete newData[id]);
      const newArray: BaselineSpeciesInatData[] = Object.keys(newData).map((id) => ({
        id: parseInt(id),
        ...newData[id],
      }));
      return {
        ...state,
        data: newData,
        sortedTaxonIds: getSortedTaxonIds(newArray, state.sortDir, state.sortCol),
      };
    }

    case actions.BASELINE_DATA_ADD: {
      const species: BaselineSpeciesInatData = action.payload;
      const newData: BaselineDataObj = {
        ...state.data,
        [species.id]: {
          name: species.name,
          isActive: species.isActive,
          researchGradeReviewCount: species.researchGradeReviewCount,
        },
      };
      const newArray: BaselineSpeciesInatData[] = Object.keys(newData).map((id) => ({
        id: parseInt(id),
        ...newData[id],
      }));
      return {
        ...state,
        data: newData,
        sortedTaxonIds: getSortedTaxonIds(newArray, state.sortDir, state.sortCol),
      };
    }

    case actions.BASELINE_DATA_BULK_UPDATE: {
      const updates: Array<{
        id: number;
        isActive: boolean;
        researchGradeReviewCount: number;
        totalObservationCount: number;
      }> = action.payload;
      const updatesMap = new Map(updates.map((u) => [u.id, u]));
      const newData = { ...state.data };
      for (const idStr of Object.keys(newData)) {
        const id = parseInt(idStr);
        const update = updatesMap.get(id);
        if (update) {
          newData[id] = {
            ...newData[id],
            isActive: update.isActive,
            researchGradeReviewCount: update.researchGradeReviewCount,
            totalObservationCount: update.totalObservationCount,
          };
        }
      }
      const newArray: BaselineSpeciesInatData[] = Object.keys(newData).map((id) => ({
        id: parseInt(id),
        ...newData[id],
      }));
      return {
        ...state,
        data: newData,
        sortedTaxonIds: getSortedTaxonIds(newArray, state.sortDir, state.sortCol),
      };
    }
    case actions.BASELINE_DATA_UPDATE_NOTES: {
      const { id, publicNotes, privateNotes } = action.payload;
      const newData = { ...state.data };
      if (newData[id]) {
        newData[id] = { ...newData[id], publicNotes, privateNotes };
      }
      const newArray: BaselineSpeciesInatData[] = Object.keys(newData).map((strId) => ({
        id: parseInt(strId),
        ...newData[strId],
      }));
      return {
        ...state,
        data: newData,
        sortedTaxonIds: getSortedTaxonIds(newArray, state.sortDir, state.sortCol),
      };
    }
    default:
      return state;
  }
};

export default baselineDataReducer;
