import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AccountCircle from '@mui/icons-material/AccountCircle';
import Logout from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link as RouterLink } from 'react-router-dom';
import { useInatDownloadStatus } from '../../hooks/useInatDownloadStatus';

export const Header = () => {
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  const { status: downloadStatus, startedAt, progress } = useInatDownloadStatus();

  const downloadTooltip = (() => {
    if (downloadStatus !== 'running') return '';
    if (!progress || !startedAt || progress.packetNum <= 1) return 'Active iNat observation download';
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const msPerPacket = elapsed / progress.packetNum;
    const remainingMs = (progress.totalPackets - progress.packetNum) * msPerPacket;
    const mins = Math.floor(remainingMs / 60_000);
    const secs = Math.round((remainingMs % 60_000) / 1000);
    const etaStr = mins > 0 ? `~${mins}m ${secs}s remaining` : `~${secs}s remaining`;
    return `Active iNat observation download — ${etaStr}`;
  })();

  return (
    <>
      <AppBar position="fixed" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ my: 2 }}>
            Curated Checklist Manager
          </Typography>{' '}
          <Divider />
          <Box sx={{ flexGrow: 1 }} />
          {downloadStatus === 'running' && (
            <Tooltip title={downloadTooltip}>
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            </Tooltip>
          )}
          <IconButton
            size="large"
            aria-label="settings"
            color="inherit"
            onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
          >
            <SettingsIcon />
          </IconButton>
          <Menu
            anchorEl={settingsMenuAnchor}
            open={Boolean(settingsMenuAnchor)}
            onClose={() => setSettingsMenuAnchor(null)}
          >
            <MenuItem
              component={RouterLink}
              to="/settings/main"
              onClick={() => setSettingsMenuAnchor(null)}
              sx={{ fontSize: '0.85rem' }}
            >
              Project settings
            </MenuItem>
            <MenuItem
              component={RouterLink}
              to="/settings/files"
              onClick={() => setSettingsMenuAnchor(null)}
              sx={{ fontSize: '0.85rem' }}
            >
              Files/Backup
            </MenuItem>
            <MenuItem
              component={RouterLink}
              to="/settings/publish"
              onClick={() => setSettingsMenuAnchor(null)}
              sx={{ fontSize: '0.85rem' }}
            >
              Publish Settings
            </MenuItem>
          </Menu>
          <IconButton size="large" color="inherit">
            <AccountCircle />
          </IconButton>
          <IconButton size="large" aria-label="" color="inherit">
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
    </>
  );
};
