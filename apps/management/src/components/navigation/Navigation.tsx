import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { Link as RouterLink, useLocation } from 'react-router-dom';

export const Navigation = () => {
  const location = useLocation();
  type NavItem = {
    label: string;
    path: string;
  };
  const managementItems: NavItem[] = [
    {
      label: 'iNat Sync',
      path: '/update-inat-data',
    },
    {
      label: 'Baseline species',
      path: '/baseline-species',
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
      label: 'Unconfirmed species',
      path: '/unconfirmed-species',
    },
    {
      label: 'Accounts',
      path: '/accounts',
    },
  ];
  const viewItems: NavItem[] = [
    {
      label: 'Curated checklist',
      path: '/curated-checklist',
    },
  ];

  const renderNavItems = (items: NavItem[]) =>
    items.map(({ label, path }) => (
      <ListItem disablePadding key={label}>
        <ListItemButton
          component={(props) => <RouterLink {...props} to={path} />}
          selected={location.pathname === path}
        >
          <ListItemText primary={label} />
        </ListItemButton>
      </ListItem>
    ));

  return (
    <Box sx={{ width: '100%', maxWidth: 260, position: 'fixed' }}>
      <nav>
        <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
          Management
        </Typography>
        <List>{renderNavItems(managementItems)}</List>
        <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
          View
        </Typography>
        <List>{renderNavItems(viewItems)}</List>
      </nav>
    </Box>
  );
};
