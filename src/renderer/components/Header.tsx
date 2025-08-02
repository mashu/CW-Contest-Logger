import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Timer as TimerIcon,
  WifiTethering as ConnectedIcon,
  WifiTetheringOff as DisconnectedIcon,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../store/store';
import { toggleTheme } from '../store/settingsSlice';
import { format } from 'date-fns';

interface HeaderProps {
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings.settings);
  const contest = useSelector((state: RootState) => state.contest);
  const isConnected = useSelector((state: RootState) => state.cluster.isConnected);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getContestDuration = () => {
    if (!contest.isActive || !contest.startTime) return '';
    const start = new Date(contest.startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          CW Contest Logger
        </Typography>

        {settings.callsign && (
          <Chip
            label={settings.callsign}
            color="secondary"
            size="small"
            sx={{ ml: 2 }}
          />
        )}

        <Box sx={{ flex: 1 }} />

        {contest.isActive && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <TimerIcon sx={{ mr: 1 }} />
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {getContestDuration()}
            </Typography>
          </Box>
        )}

        <Chip
          icon={isConnected ? <ConnectedIcon /> : <DisconnectedIcon />}
          label={isConnected ? 'Connected' : 'Disconnected'}
          color={isConnected ? 'success' : 'default'}
          size="small"
          sx={{ mr: 2 }}
        />

        <Typography variant="body1" sx={{ mr: 2, fontFamily: 'monospace' }}>
          {format(currentTime, 'HH:mm:ss')} UTC
        </Typography>

        <IconButton onClick={() => dispatch(toggleTheme())} color="inherit">
          {settings.theme === 'dark' ? <LightIcon /> : <DarkIcon />}
        </IconButton>

        <IconButton onClick={onSettingsClick} color="inherit">
          <SettingsIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
