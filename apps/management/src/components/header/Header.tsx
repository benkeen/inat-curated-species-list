import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import { UpdateInaturalistDataDialog } from './UpdateInaturalistDataDialog';

export const Header = () => {
  const [updateDataDialogVisible, setUpdateDataDialogVisibility] = useState(false);

  return (
    <>
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ my: 2 }}>
            Curated Checklist Manager
          </Typography>{' '}
          <Divider />
          <Box sx={{ flexGrow: 1 }} />
          <List>
            <ListItem key="" disablePadding>
              <ListItemButton onClick={() => setUpdateDataDialogVisibility(true)}>
                <ListItemIcon sx={{ minWidth: 30 }}>
                  <RefreshIcon />
                </ListItemIcon>
                <ListItemText sx={{ my: 0 }} primary="Update Checklist Data from iNat" />
              </ListItemButton>
            </ListItem>
          </List>
          <IconButton size="large" color="inherit">
            <AccountCircle />
          </IconButton>
          <IconButton size="large" aria-label="" color="inherit">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      <UpdateInaturalistDataDialog
        open={updateDataDialogVisible}
        onClose={() => setUpdateDataDialogVisibility(false)}
      />
    </>
  );
};
