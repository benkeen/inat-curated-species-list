import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export const Spinner = () => {
  return (
    <Box sx={{ padding: 5, textAlign: 'center' }}>
      <CircularProgress />
    </Box>
  );
};
