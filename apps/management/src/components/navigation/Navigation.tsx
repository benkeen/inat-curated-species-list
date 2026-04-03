import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Link as RouterLink, useLocation } from 'react-router-dom';

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
        <Divider sx={{ borderColor: 'grey.200' }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              component={(props) => <RouterLink {...props} to="/update-inat-data" />}
              selected={location.pathname === '/update-inat-data'}
            >
              <ListItemText
                primary="Update iNat Data"
                primaryTypographyProps={{ fontWeight: 'bold', color: 'primary.main' }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </nav>
    </Box>
  );
};
