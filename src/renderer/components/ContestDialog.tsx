import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Alert,
  Box,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { RootState, AppDispatch } from '../store/store';
import { startContest, endContest } from '../store/contestSlice';
import { updateSettings } from '../store/settingSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

interface ContestDialogProps {
  open: boolean;
  onClose: () => void;
}

const contestTypes = [
  { value: 'CQ WW', exchange: '599 + CQ Zone', duration: 48 },
  { value: 'CQ WPX', exchange: '599 + Serial', duration: 48 },
  { value: 'ARRL DX', exchange: '599 + State/Power', duration: 48 },
  { value: 'IARU HF', exchange: '599 + ITU Zone', duration: 24 },
  { value: 'WAE', exchange: '599 + Serial/QTC', duration: 48 },
  { value: 'Field Day', exchange: 'Class + Section', duration: 24 },
  { value: 'Sprint', exchange: 'Call + Name + QTH', duration: 4 },
  { value: 'Custom', exchange: 'Custom', duration: 24 },
];

const ContestDialog: React.FC<ContestDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const contest = useSelector((state: RootState) => state.contest);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const [contestName, setContestName] = React.useState('');
  const [exchange, setExchange] = React.useState('599');
  const [tabValue, setTabValue] = React.useState(0);
  
  // Local settings state
  const [localSettings, setLocalSettings] = React.useState({
    contestMode: settings.contestMode || 'CQ WW',
    cwSpeed: settings.cwSpeed || 25,
    duplicateCheck: settings.duplicateCheck ?? true,
    autoTime: settings.autoTime ?? true,
    soundEnabled: settings.soundEnabled ?? true,
  });

  React.useEffect(() => {
    if (open) {
      // Reset to default contest mode when opening
      setContestName(settings.contestMode || 'CQ WW');
      const defaultContest = contestTypes.find(c => c.value === (settings.contestMode || 'CQ WW'));
      if (defaultContest) {
        setExchange(defaultContest.exchange);
      }
      
      // Update local settings
      setLocalSettings({
        contestMode: settings.contestMode || 'CQ WW',
        cwSpeed: settings.cwSpeed || 25,
        duplicateCheck: settings.duplicateCheck ?? true,
        autoTime: settings.autoTime ?? true,
        soundEnabled: settings.soundEnabled ?? true,
      });
    }
  }, [open, settings]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleContestTypeChange = (value: string) => {
    setContestName(value);
    const selected = contestTypes.find(c => c.value === value);
    if (selected) {
      setExchange(selected.exchange);
    }
  };

  const handleSettingChange = (field: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleStartContest = () => {
    if (!contestName) {
      alert('Please select a contest');
      return;
    }
    
    // Save preferences
    dispatch(updateSettings({
      ...settings,
      ...localSettings,
      contestMode: contestName, // Update default contest mode
    }));
    
    // Start the contest
    dispatch(startContest({ name: contestName, exchange }));
    onClose();
  };

  const handleEndContest = () => {
    if (window.confirm('Are you sure you want to end the contest?')) {
      dispatch(endContest());
      onClose();
    }
  };

  const handleSavePreferences = () => {
    dispatch(updateSettings({
      ...settings,
      ...localSettings,
    }));
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Contest Management
        <Typography variant="caption" display="block" color="text.secondary">
          Shortcuts: Ctrl+Shift+S (Start) • Ctrl+Shift+E (End) • Ctrl+Shift+C (Settings)
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ minHeight: 400 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Active Contest" />
            <Tab label="Preferences" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {contest.isActive ? (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Contest "{contest.contestName}" is currently active
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Started
                  </Typography>
                  <Typography variant="body1">
                    {contest.startTime && new Date(contest.startTime).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {contest.startTime && (
                      Math.floor((Date.now() - new Date(contest.startTime).getTime()) / 3600000)
                    )} hours
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    QSOs
                  </Typography>
                  <Typography variant="body1">
                    {contest.score.qsos}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Serial Number
                  </Typography>
                  <Typography variant="body1">
                    {contest.serialNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Exchange Format
                  </Typography>
                  <Typography variant="body1">
                    {contest.exchange}
                  </Typography>
                </Grid>
              </Grid>
            </>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Start New Contest
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Contest Type</InputLabel>
                  <Select
                    value={contestName}
                    onChange={(e) => handleContestTypeChange(e.target.value)}
                    label="Contest Type"
                  >
                    {contestTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.value} ({type.duration}h)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exchange Format"
                  value={exchange}
                  onChange={(e) => setExchange(e.target.value)}
                  helperText="Define the exchange format for this contest"
                />
              </Grid>
            </Grid>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Contest Preferences
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Contest Mode</InputLabel>
                <Select
                  value={localSettings.contestMode}
                  onChange={(e) => handleSettingChange('contestMode', e.target.value)}
                  label="Default Contest Mode"
                >
                  {contestTypes.filter(t => t.value !== 'Custom').map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="CW Speed (WPM)"
                value={localSettings.cwSpeed}
                onChange={(e) => handleSettingChange('cwSpeed', parseInt(e.target.value))}
                helperText="Default CW speed for contests"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.duplicateCheck}
                    onChange={(e) => handleSettingChange('duplicateCheck', e.target.checked)}
                  />
                }
                label="Duplicate Check"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Warn when logging duplicate contacts
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.autoTime}
                    onChange={(e) => handleSettingChange('autoTime', e.target.checked)}
                  />
                }
                label="Auto Time/Date"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Automatically fill current time and date for new QSOs
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.soundEnabled}
                    onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                  />
                }
                label="Sound Alerts"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Enable sound notifications for contest events
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {tabValue === 0 ? (
          contest.isActive ? (
            <Button onClick={handleEndContest} color="error" variant="contained">
              End Contest
            </Button>
          ) : (
            <Button onClick={handleStartContest} variant="contained">
              Start Contest
            </Button>
          )
        ) : (
          <Button onClick={handleSavePreferences} variant="contained">
            Save Preferences
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContestDialog;
