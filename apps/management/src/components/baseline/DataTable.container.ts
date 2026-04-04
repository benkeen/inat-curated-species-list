import { connect } from 'react-redux';
import * as actions from '../../store/baselineData/baselineData.actions';
import * as selectors from '../../store/baselineData/baselineData.selectors';
import { DataTable } from './DataTable';
import { ReduxState } from '../../store/types';
import { SortCol, SortDir } from './BaselineData.types';

type OwnProps = {
  filterText: string;
};

const mapStateToProps = (state: ReduxState, ownProps: OwnProps) => {
  const sorted = selectors.getSortedBaselineData(state);
  const data = ownProps.filterText
    ? sorted.filter((row) => row.name.toLowerCase().includes(ownProps.filterText.toLowerCase()))
    : sorted;
  return {
    data,
    sortDir: selectors.getSortDir(state),
    sortCol: selectors.getSortCol(state),
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  onSort: (sortCol: SortCol, sortDir: SortDir) => dispatch(actions.sortBaselineData(sortCol, sortDir)),
  onDeleteRows: (taxonIds: number[]) => dispatch(actions.deleteAndSaveBaselineSpecies(taxonIds)),
});

const container = connect(mapStateToProps, mapDispatchToProps)(DataTable);

export default container;
