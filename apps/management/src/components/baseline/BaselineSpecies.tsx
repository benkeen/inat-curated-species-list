import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
// import Button from '@mui/material/Button';
// import { updateBaselineSpecies } from '../../api/api';
// import { AddBaselineTaxonsDialog } from './AddBaselineTaxonsDialog';
// import { ValidateBaselineSpeciesDialog } from './ValidateBaselineSpeciesDialog';
import { Spinner } from '../loading/spinner';
import DataTable from './DataTable.container';
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
// import { combineSpeciesLists } from '../../utils';
import { useBaselineSpecies } from './hooks/useBaselineSpecies';

export const BaselineSpecies = () => {
  const { data, isLoading, validationDate } = useBaselineSpecies();
  // const [saving, setSaving] = useState(false);
  // const [error, setError] = useState('');
  // const [saved, setSaved] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  // const [mainSettings, setMainSettings] = useState<MainSettings | {}>({});
  // const [addBaselineTaxonDialogOpen, setBaselineTaxonDialogOpen] = useState(false);
  // const [validateBaselineTaxonDialogOpen, setValidateBaselineTaxonDialogOpen] = useState(false);

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
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Baseline Species
          {data.length > 0 && <Chip label={data.length} size="small" />}
        </h2>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: '10px' }}>
          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            aria-label="baseline species tabs"
          >
            <Tab label="Species" />
            <Tab label="Notes" />
          </Tabs>
        </Box>
      </div>

      <Box hidden={currentTab !== 0}>
        {loader}
        {/* {getAlert()} */}

        {validationDate && (
          <p>
            <small>
              Last validated: <b>...</b>
            </small>
          </p>
        )}

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
      </Box>

      <Box hidden={currentTab !== 1} sx={{ p: 2 }}>
        <p>
          This page lets you provide a list of species that you know are in the region, but don't have any observations
          on iNaturalist yet. These species will used to supplement actual observations made in the province, when
          constructing the final checklist.
        </p>
        <p>
          <b>You don't need to use this feature</b>. This is only needed when you have prior knowledge of the species in
          your region and iNat is currently missing records for those species.
        </p>

        <h3>Tips</h3>

        <p>
          Keep the list as short as possible. Only add species that don't have actual confirmed iNat observations - or
          have very few. While it's rare, technically iNat users can delete their own observations so if a species has
          very few, providing a baseline record will prevent it accidentally getting left off the checklist.
        </p>
        <p>
          The reason that you want to keep this list short is because this area requires maintenance. Taxonomies change
          over time and this system can't automatically recognize every scenario, such as certain taxon splits. For
          example, you could one day add a species here that gets split. It would then be your responsibility to update
          the list to reflect that change, otherwise you could end up with a species on your checklist that doesn't
          actually occur in the region.
        </p>
        <p>
          We suggest making use of the feature to auto-remove species from the list, once the number of curator reviews
          meets a certain threshold. That provides it with padding in case a user deleted an observation.
        </p>

        <h3>Pruning the list</h3>

        <p>
          If you have a long list of baseline species, we suggest pruning it down over time. You can do this by sorting
          the checklist by the number of curator reviews, and then removing species from the baseline list once they
          have a certain number of reviews. That way, you can be confident that the species is actually occurring in the
          region, and you won't have to maintain it on the baseline list anymore.
        </p>
      </Box>
    </>
  );
};
