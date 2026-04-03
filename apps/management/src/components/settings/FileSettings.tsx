import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import { getMainConfig, updateMainConfig } from '../../api/api';
import { Spinner } from '../loading/spinner';

export const FileSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [backupFolder, setBackupFolder] = useState('');

  useEffect(() => {
    (async () => {
      const resp = await getMainConfig();
      const { backupSettings } = await resp.json();

      if (backupSettings.backupFolder) {
        setBackupFolder(backupSettings.backupFolder);
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
      <h2>File/Backup Settings</h2>

      {loader}
      {getAlert()}

      <p>
        This application uses a "flatfile" database, meaning the <b>configuration settings</b>,{' '}
        <b>curated species data</b>, <b>baseline species</b> and more are stored in files on the server running this
        application. That location is then backed up in git (a code repository), at a location of your choice.{' '}
        <i>This provides a paper trail of every change that occurs and wards against data loss</i>. The data that's
        stored is intended to be public in nature: no passwords or anything sensitive beyond the iNat usernames of the
        curators and names of the people on the New Additions list.
      </p>

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

        <h3>Git repository settings</h3>

        <Grid container spacing={2}>
          <Grid size={3}>Username</Grid>
          <Grid size={9}>
            <input type="text" style={{ width: 200 }} />
          </Grid>
          <Grid size={3}>Passcode</Grid>
          <Grid size={9}>
            <input type="text" style={{ width: 200 }} />
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
