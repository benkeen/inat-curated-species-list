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

      const url = `https://api.inaturalist.org/v2/observations?place_id=${placeId}&taxon_id=${taxonIdInput}&per_page=1&quality_grade=research&order=desc&order_by=created_at&fields=(taxon:(name:!t))`;

      const [inatResp, curatorResp] = await Promise.all([fetch(url), getCuratorReviewCount(taxonId).catch(() => null)]);

      if (!inatResp.ok) throw new Error(`iNat API returned ${inatResp.status}`);
      const [inatData, curatorData] = await Promise.all([
        inatResp.json(),
        curatorResp ? curatorResp.json().catch(() => null) : Promise.resolve(null),
      ]);

      if (!inatData.results?.length) {
        setLookupError('No research grade observations found for this taxon in the configured place.');
      } else {
        setLookupResult({
          name: inatData.results[0].taxon.name,
          researchGradeCount: inatData.total_results,
          curatorReviewCount: curatorData?.count ?? null,
        });
      }
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
        curatorReviewCount: lookupResult.curatorReviewCount ?? undefined,
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
