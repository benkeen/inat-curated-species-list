import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
// import Button from '@mui/material/Button';
import Info from '@mui/icons-material/InfoOutlined';
// import { updateBaselineSpecies } from '../../api/api';
// import { AddBaselineTaxonsDialog } from './AddBaselineTaxonsDialog';
// import { ValidateBaselineSpeciesDialog } from './ValidateBaselineSpeciesDialog';
import { Spinner } from '../loading/spinner';
import DataTable from './DataTable.container';
import { BaselineDocDialog } from './BaselineDocDialog';
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// import { combineSpeciesLists } from '../../utils';
import { BaselineSpeciesInatData } from '../../types';

export type BaselineSpeciesProps = {
  readonly isLoading: boolean;
  readonly isLoaded: boolean;
  readonly data: BaselineSpeciesInatData[];
  readonly loadBaselineData: () => void;
  readonly validationDate: string | null;
};

export const BaselineSpecies = ({
  isLoading,
  isLoaded,
  data,
  loadBaselineData,
  validationDate,
}: BaselineSpeciesProps) => {
  // const [saving, setSaving] = useState(false);
  // const [error, setError] = useState('');
  // const [saved, setSaved] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // const [mainSettings, setMainSettings] = useState<MainSettings | {}>({});
  // const [addBaselineTaxonDialogOpen, setBaselineTaxonDialogOpen] = useState(false);
  // const [validateBaselineTaxonDialogOpen, setValidateBaselineTaxonDialogOpen] = useState(false);
  // const [baselineSpecies, setBaselineSpecies] = useState<BaselineSpeciesInatData[]>([]);

  useEffect(() => {
    if (!isLoaded) {
      loadBaselineData();
    }
  }, []);

  // const onSubmit = async (e?: any) => {
  //   e.preventDefault();
  //   // setSaving(true);

  //   const resp = await updateBaselineSpecies(data);
  //   const { success, error: updateConfigError } = await resp.json();

  //   // setSaving(false);

  //   if (success) {
  //     setError('');
  //     setSaved(true);
  //   } else {
  //     setError(updateConfigError);
  //   }
  // };

  const loader = isLoading ? <Spinner /> : null;

  // const getAlert = () => {
  //   if (error) {
  //     return <Alert severity="error">{error}</Alert>;
  //   }

  //   if (saved) {
  //     return <Alert severity="success">The baselines species have been saved.</Alert>;
  //   }

  //   return null;
  // };

  const getContent = () => {
    if (isLoading) {
      return 'loading...';
    }

    if (!data.length) {
      return <Alert severity="info">You haven't provided any baseline species.</Alert>;
    }

    return (
      <>
        <DataTable />
        {/* <div style={{ padding: '20px 0', display: 'flex' }}>
          <div style={{ flex: 1 }}>
            <Button
              variant="outlined"
              type="submit"
              size="medium"
              onClick={() => setBaselineTaxonDialogOpen(true)}
              startIcon={<AddCircleOutlineIcon />}
              style={{ marginRight: 10 }}
            >
              Add Species
            </Button>
            {data.length > 0 && (
              <Button
                variant="outlined"
                type="submit"
                size="medium"
                onClick={() => setValidateBaselineTaxonDialogOpen(true)}
                color="secondary"
              >
                Validate
              </Button>
            )}
          </div>

          <Button type="button" variant="contained" size="medium" onClick={onSubmit} disabled>
            Save
          </Button>
        </div> */}
      </>
    );
  };

  return (
    <>
      <div style={{ flex: '0 0 auto' }}>
        <h2>
          Baseline Species <Info onClick={() => setShowHelp(true)} />
        </h2>

        {loader}
        {/* {getAlert()} */}

        {validationDate && (
          <p>
            <small>
              Last validated: <b>...</b>
            </small>
          </p>
        )}
      </div>

      {/* <AddBaselineTaxonsDialog
        open={addBaselineTaxonDialogOpen}
        onClose={() => setBaselineTaxonDialogOpen(false)}
        onComplete={(data: BaselineSpeciesInatData[]) => {
          const updatedList = combineSpeciesLists(baselineSpecies, data);
          setBaselineSpecies(updatedList);
          setBaselineTaxonDialogOpen(false);
        }}
      /> */}

      {/* <ValidateBaselineSpeciesDialog
        placeId={mainSettings.placeId}
        taxonId={mainSettings.taxonId}
        open={validateBaselineTaxonDialogOpen}
        onClose={() => setValidateBaselineTaxonDialogOpen(false)}
        onComplete={(latestData: RegionSpecies) => {
          const updatedBaselineSpeciesData = baselineSpecies.map((row) => {
            if (latestData[row.id]) {
              return {
                ...row,
                isActive: latestData[row.id].isActive,
                researchGradeReviewCount: latestData[row.id].count,
              };
            }

            // TODO this should never occur. Remove altogether?
            return row;
          });

          // setBaselineSpecies(updatedBaselineSpeciesData);
          setValidateBaselineTaxonDialogOpen(false);
        }}
      /> */}

      {getContent()}
      <BaselineDocDialog open={showHelp} onClose={() => setShowHelp(false)} />
    </>
  );
};
