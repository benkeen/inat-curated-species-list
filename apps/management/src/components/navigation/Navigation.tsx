import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import SettingsIcon from '@mui/icons-material/Settings';
import BackupIcon from '@mui/icons-material/Backup';
import PublishIcon from '@mui/icons-material/Publish';

export const Navigation = () => {
  const location = useLocation();
  type NavItem = {
    label: string;
    path: string;
  };
  const navItems: NavItem[] = [
    {
      label: 'Curated checklist',
      path: '/curated-checklist',
    },
    {
      label: 'New additions',
      path: '/new-additions',
    },
    {
      label: 'Taxon changes',
      path: '/taxon-changes',
    },
    {
      label: 'Baseline species',
      path: '/baseline-species',
    },
    {
      label: 'Unconfirmed species',
      path: '/unconfirmed-species',
    },
    {
      label: 'Accounts',
      path: '/accounts',
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 260, position: 'fixed' }}>
      <nav>
        <List>
          {navItems.map(({ label, path }) => (
            <ListItem disablePadding key={label}>
              <ListItemButton
                component={(props) => <RouterLink {...props} to={path} />}
                selected={location.pathname === path}
              >
                <ListItemText primary={label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider />
        <List
          subheader={
            <ListSubheader component="div" id="nested-list-subheader">
              Settings
            </ListSubheader>
          }
        >
          <ListItem disablePadding>
            <ListItemButton component={(props) => <RouterLink {...props} to="/settings/main" />}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Main Settings" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={(props) => <RouterLink {...props} to="/settings/files" />}>
              <ListItemIcon>
                <BackupIcon />
              </ListItemIcon>
              <ListItemText primary="Files/Backup" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={(props) => <RouterLink {...props} to="/settings/publish" />}>
              <ListItemIcon>
                <PublishIcon />
              </ListItemIcon>
              <ListItemText primary="Publish Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
    </Box>
  );
};
