import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Timer as TimerIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { endContest } from '../store/contestSlice';

interface HeaderProps {
  onSettingsClick: () => void;
  onContestClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onContestClick }) => {
  const dispatch = useDispatch<AppDispatch>();
  const contest = useSelector((state: RootState) => state.contest);
  const qsos = useSelector((state: RootState) => state.qsos.qsos);
  const [contestTime, setContestTime] = useState<string>('');

  // Update contest timer every second
  useEffect(() => {
    if (!contest.isActive || !contest.startTime) return;

    const updateTimer = () => {
      const startTime = new Date(contest.startTime!).getTime();
      const now = Date.now();
      const elapsed = now - startTime;
      
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      setContestTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [contest.isActive, contest.startTime]);

  // Calculate contest progress (assuming 24-48 hour contests)
  const getContestProgress = () => {
    if (!contest.isActive || !contest.startTime) return 0;
    const elapsed = Date.now() - new Date(contest.startTime).getTime();
    const hours = elapsed / 3600000;
    // Assume 24-hour contest for now, could be made configurable
    return Math.min((hours / 24) * 100, 100);
  };

  const handleQuickEndContest = () => {
    if (window.confirm('Quick end contest? This will stop the current contest.')) {
      dispatch(endContest());
    }
  };

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Contest Logger
          {contest.isActive && (
            <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 2 }}>
              <Chip
                icon={<TimerIcon />}
                label={`${contest.contestName} • ${contestTime}`}
                color="secondary"
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
              <Chip
                label={`${contest.score.qsos} QSOs • Serial: ${contest.serialNumber}`}
                color="primary"
                size="small"
                sx={{ ml: 1, color: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
            </Box>
          )}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {contest.isActive ? (
            <Tooltip title="End Contest (Ctrl+Shift+E)">
              <Button
                color="inherit"
                startIcon={<StopIcon />}
                onClick={handleQuickEndContest}
                sx={{ color: '#ffcdd2' }}
              >
                End Contest
              </Button>
            </Tooltip>
          ) : (
            <Tooltip title="Start Contest (Ctrl+Shift+S)">
              <Button
                color="inherit"
                startIcon={<StartIcon />}
                onClick={onContestClick}
              >
                Start Contest
              </Button>
            </Tooltip>
          )}
          
          <Tooltip title="Settings (Ctrl+,)">
            <Button
              color="inherit"
              startIcon={<SettingsIcon />}
              onClick={onSettingsClick}
            >
              Settings
            </Button>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* Contest Progress Bar */}
      {contest.isActive && (
        <LinearProgress
          variant="determinate"
          value={getContestProgress()}
          sx={{
            height: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#4caf50',
            },
          }}
        />
      )}
    </AppBar>
  );
};

export default Header;
