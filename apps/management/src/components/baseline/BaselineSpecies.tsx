import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton } from '@mui/material';
import { Spinner } from '../loading/spinner';
import DataTable from './DataTable.container';
import { AddSpeciesDialog } from './AddSpeciesDialog';
import { CheckBaselineSpeciesDialog } from './CheckBaselineSpeciesDialog';
import { useBaselineSpecies } from './hooks/useBaselineSpecies';

export const BaselineSpecies = () => {
  const { data, isLoading } = useBaselineSpecies();
  const [currentTab, setCurrentTab] = useState(0);
  const [filterInput, setFilterInput] = useState('');
  const [filterText, setFilterText] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [checkDialogOpen, setCheckDialogOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFilterText(filterInput), 300);
    return () => clearTimeout(t);
  }, [filterInput]);

  const getContent = () => {
    if (isLoading) {
      return <Spinner />;
    }

    if (!data.length) {
      return <Alert severity="info">You haven't provided any baseline species.</Alert>;
    }

    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            size="small"
            sx={{ width: 300 }}
            placeholder="Filter by species name…"
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            slotProps={{
              input: {
                endAdornment: filterInput && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setFilterInput('');
                        setFilterText('');
                      }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button variant="outlined" size="small" onClick={() => setAddDialogOpen(true)}>
            Add &raquo;
          </Button>
        </Box>
        <DataTable filterText={filterText} />
      </>
    );
  };

  return (
    <>
      <div style={{ flex: '0 0 auto' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Baseline Species
          {data.length > 0 && <Chip label={data.length} size="small" />}
          <Box sx={{ ml: 'auto' }}>
            <Button variant="outlined" size="small" onClick={() => setCheckDialogOpen(true)} disabled={!data.length}>
              Check Baseline Species
            </Button>
          </Box>
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

      <Box sx={{ display: currentTab !== 0 ? 'none' : 'block' }}>{getContent()}</Box>

      <Box sx={{ display: currentTab !== 1 ? 'none' : 'block', p: 2 }}>
        <p>
          This page lets you provide a list of species that you know are in the region, but don't have any observations
          on iNaturalist yet. These species will used to supplement actual observations made in the province, when
          constructing the final checklist.
        </p>
        <p>
          <b>This is an optional feature</b>. It's only needed when you have historical data of the relevant species in
          your region and iNat is currently missing records for those species.
        </p>

        <h3>Tips</h3>

        <p>
          Keep the list as short as possible. As soon as a species gets enough confirmation by curators, it should be
          removed from the baseline list. Note: while it's rare, technically iNat users can delete their own
          observations so if a species has very few, providing a baseline record will prevent it accidentally getting
          left off the checklist. But you'll want to keep the list short to minimize the amount of maintenance needed.
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

      <AddSpeciesDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />
      <CheckBaselineSpeciesDialog open={checkDialogOpen} onClose={() => setCheckDialogOpen(false)} />
    </>
  );
};
