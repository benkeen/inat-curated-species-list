import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import { getMainSettings, updateMainSettings } from '../../api/api';
import { Spinner } from '../loading/spinner';
import type { MainSettings } from '../../types';

export const MainSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<MainSettings>({
    curators: '',
    taxonId: null,
    placeId: null,
    omitObservationsByUsers: '',
    baselineCompletionDate: '',
  });

  useEffect(() => {
    (async () => {
      const resp = await getMainSettings();
      const { settings } = await resp.json();

      setSettings(settings);
      setLoading(false);
    })();
  }, []);

  const updateData = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setSaved(false);
    setLoading(true);

    const resp = await updateMainSettings(settings);
    const { success, error: updateSettingsError } = await resp.json();
    if (success) {
      setError('');
      setSaved(true);
    } else {
      setError(updateSettingsError);
    }

    setLoading(false);
  };

  const loader = loading ? <Spinner /> : null;

  const getAlert = () => {
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (saved) {
      return (
        <Alert severity="success" style={{ marginBottom: 15 }}>
          The settings have been saved.
        </Alert>
      );
    }

    return null;
  };

  return (
    <>
      <h2>Project settings</h2>

      {loader}
      {getAlert()}

      <form onSubmit={onSubmit}>
        <Grid container spacing={2}>
          <Grid size={3}>Curators</Grid>
          <Grid size={9}>
            <TextField
              size="small"
              fullWidth
              value={settings.curators || ''}
              onChange={(e) => updateData('curators', e.target.value)}
              helperText="Comma-delimited list of curator iNaturalist usernames, e.g. username1,username2"
            />
          </Grid>
          <Grid size={3}>Taxon ID</Grid>
          <Grid size={9}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                size="small"
                type="number"
                sx={{ width: 120 }}
                value={settings.taxonId || ''}
                onChange={(e) => updateData('taxonId', e.target.value)}
              />
              {settings.taxonId && (
                <Button
                  variant="outlined"
                  size="small"
                  href={`https://www.inaturalist.org/taxa/${settings.taxonId}`}
                  target="_blank"
                  rel="noreferrer"
                  component="a"
                >
                  Confirm »
                </Button>
              )}
            </Box>
          </Grid>
          <Grid size={3}>Place ID</Grid>
          <Grid size={9}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TextField
                size="small"
                type="number"
                sx={{ width: 120 }}
                value={settings.placeId || ''}
                onChange={(e) => updateData('placeId', e.target.value)}
              />
              {settings.placeId && (
                <Button
                  variant="outlined"
                  size="small"
                  href={`https://www.inaturalist.org/observations?place_id=${settings.placeId}&subview=map`}
                  target="_blank"
                  rel="noreferrer"
                  component="a"
                >
                  Confirm »
                </Button>
              )}
            </Box>
          </Grid>
          <Grid size={3}>Omit observations by users</Grid>
          <Grid size={9}>
            <TextField
              size="small"
              fullWidth
              value={settings.omitObservationsByUsers || ''}
              onChange={(e) => updateData('omitObservationsByUsers', e.target.value)}
              helperText="Comma-delimited list of iNaturalist usernames whose observations should be ignored"
            />
          </Grid>
          <Grid size={3}>Baseline completion date</Grid>
          <Grid size={9}>
            <TextField
              size="small"
              type="date"
              value={settings.baselineCompletionDate || ''}
              onChange={(e) => updateData('baselineCompletionDate', e.target.value)}
            />
          </Grid>
        </Grid>

        <p>
          <Button variant="outlined" type="submit" size="small">
            Save
          </Button>
        </p>
      </form>
    </>
  );
};
