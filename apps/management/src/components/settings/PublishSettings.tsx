import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import { getMainConfig, updateMainConfig } from '../../api/api';
import { Spinner } from '../loading/spinner';

export const PublishSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [backupFolder, setBackupFolder] = useState('');

  useEffect(() => {
    (async () => {
      const resp = await getMainConfig();
      const { config } = await resp.json();

      if (config.backupFolder) {
        setBackupFolder(config.backupFolder);
      }
      setLoading(false);
    })();
  }, []);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setSaved(false);
    setLoading(true);

    const resp = await updateMainConfig({ backupFolder });
    const { success, error: updateConfigError } = await resp.json();
    if (success) {
      setError('');
      setSaved(true);
    } else {
      setError(updateConfigError);
    }

    setLoading(false);
  };

  const loader = loading ? <Spinner /> : null;

  const getAlert = () => {
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (saved) {
      return <Alert severity="success">The settings have been saved.</Alert>;
    }

    return null;
  };

  return (
    <>
      <h2>Publish Settings</h2>

      {loader}
      {getAlert()}

      <p>This tabs will contain all the settings for FTP info + filenames for the generated content to be uploaded.</p>

      <form onSubmit={onSubmit}>
        <Grid container spacing={2}>
          <Grid size={3}>Backup Folder</Grid>
          <Grid size={9}>
            <input
              type="text"
              style={{ width: '100%' }}
              value={backupFolder}
              onChange={(e) => setBackupFolder(e.target.value)}
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
