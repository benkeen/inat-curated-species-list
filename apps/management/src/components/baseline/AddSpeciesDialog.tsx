import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useDispatch, useSelector } from 'react-redux';
import { addAndSaveBaselineSpecies } from '../../store/baselineData/baselineData.actions';
import { getBaselineData } from '../../store/baselineData/baselineData.selectors';
import { getPlaceId } from '../../store/main/main.selectors';
import { getCuratorReviewCount } from '../../api/api';

type Props = {
  open: boolean;
  onClose: () => void;
};

type LookupResult = {
  name: string;
  researchGradeCount: number;
  curatorReviewCount: number | null;
};

export const AddSpeciesDialog = ({ open, onClose }: Props) => {
  const dispatch = useDispatch();
  const placeId = useSelector(getPlaceId);
  const existingData = useSelector(getBaselineData);

  const [taxonIdInput, setTaxonIdInput] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleClose = () => {
    setTaxonIdInput('');
    setLookupResult(null);
    setNotes('');
    setLookupError(null);
    onClose();
  };

  const handleSelect = async () => {
    if (!taxonIdInput) return;
    setLoading(true);
    setLookupResult(null);
    setLookupError(null);

    try {
      const taxonId = parseInt(taxonIdInput, 10);

      if (existingData[taxonId]) {
        setLookupError('This taxon ID is already in the baseline species list.');
        setLoading(false);
        return;
      }

      const speciesCountsUrl = `https://api.inaturalist.org/v2/observations/species_counts?spam=false&taxon_id=${taxonIdInput}&place_id=${placeId}&preferred_place_id=${placeId}&quality_grade=research&locale=en-US&per_page=1&fields=(taxon:(id:!t,is_active:!t,name:!t,preferred_common_name:!t,rank:!t))`;

      const [speciesCountsResp, curatorResp] = await Promise.all([
        fetch(speciesCountsUrl),
        getCuratorReviewCount(taxonId).catch(() => null),
      ]);

      if (!speciesCountsResp.ok) throw new Error(`iNat API returned ${speciesCountsResp.status}`);
      const [speciesCountsData, curatorData] = await Promise.all([
        speciesCountsResp.json(),
        curatorResp ? curatorResp.json().catch(() => null) : Promise.resolve(null),
      ]);

      let taxonName: string;
      let researchGradeCount: number;

      if (speciesCountsData.results?.length > 0) {
        taxonName = speciesCountsData.results[0].taxon.name;
        researchGradeCount = speciesCountsData.results[0].count;
      } else {
        // No RG observations in region — look up taxon name separately
        researchGradeCount = 0;
        const taxaResp = await fetch(
          `https://api.inaturalist.org/v2/taxa/${taxonIdInput}?fields=(name:!t,is_active:!t)`,
        );
        if (!taxaResp.ok) throw new Error(`iNat taxa API returned ${taxaResp.status}`);
        const taxaData = await taxaResp.json();
        if (!taxaData.results?.length) {
          setLookupError('Taxon not found on iNaturalist.');
          setLoading(false);
          return;
        }
        taxonName = taxaData.results[0].name;
      }

      setLookupResult({
        name: taxonName,
        researchGradeCount,
        curatorReviewCount: curatorData?.count ?? null,
      });
    } catch (e: any) {
      setLookupError(e.message || 'Failed to fetch data from iNaturalist.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!lookupResult || !taxonIdInput) return;
    setSaving(true);
    await (dispatch as any)(
      addAndSaveBaselineSpecies({
        id: parseInt(taxonIdInput, 10),
        name: lookupResult.name,
        isActive: true,
        researchGradeReviewCount: lookupResult.researchGradeCount,
      }),
    );
    setSaving(false);
    handleClose();
  };

  const canAdd = Boolean(lookupResult && taxonIdInput && !loading);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Species</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <TextField
              label="iNat Taxon ID"
              size="small"
              type="number"
              value={taxonIdInput}
              onChange={(e) => {
                setTaxonIdInput(e.target.value);
                setLookupResult(null);
                setLookupError(null);
              }}
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ width: 160 }}
            />
            <Button
              variant="outlined"
              size="small"
              sx={{ mt: 0.5 }}
              onClick={handleSelect}
              disabled={!taxonIdInput || !placeId || loading}
            >
              {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
              Select
            </Button>
          </Box>

          {lookupError && <Alert severity="error">{lookupError}</Alert>}

          {lookupResult && (
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="body2">
                <b>Species:</b> <em>{lookupResult.name}</em>
              </Typography>
              <Typography variant="body2">
                <b>Research grade observations in region:</b> {lookupResult.researchGradeCount.toLocaleString()}
              </Typography>
              {lookupResult.curatorReviewCount !== null && (
                <Typography variant="body2">
                  <b>Curator reviews on record:</b> {lookupResult.curatorReviewCount.toLocaleString()}
                  {lookupResult.curatorReviewCount > 0 && (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ ml: 1, color: 'warning.main', fontStyle: 'italic' }}
                    >
                      — may already appear on the checklist
                    </Typography>
                  )}
                </Typography>
              )}
            </Paper>
          )}

          <TextField
            label="Notes"
            size="small"
            multiline
            minRows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" size="small" onClick={handleAdd} disabled={!canAdd || saving}>
          {saving ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
          Add species
        </Button>
      </DialogActions>
    </Dialog>
  );
};
