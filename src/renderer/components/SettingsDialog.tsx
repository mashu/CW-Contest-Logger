import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Tab,
  Tabs,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import { RootState, AppDispatch } from '../store/store';
import { updateSettings } from '../store/settingSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const settings = useSelector((state: RootState) => state.settings.settings);
  const [tabValue, setTabValue] = React.useState(0);
  const [localSettings, setLocalSettings] = React.useState(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChange = (field: string, value: any) => {
    setLocalSettings({ ...localSettings, [field]: value });
  };

  const handleSave = async () => {
    dispatch(updateSettings(localSettings));
    await window.electronAPI.saveSettings(localSettings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Station" />
          <Tab label="Contest" />
          <Tab label="Connections" />
          <Tab label="Interface" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Call Sign"
                value={localSettings.callsign}
                onChange={(e) => handleChange('callsign', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grid Square"
                value={localSettings.gridSquare}
                onChange={(e) => handleChange('gridSquare', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={localSettings.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="QTH"
                value={localSettings.qth}
                onChange={(e) => handleChange('qth', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Default Contest Mode</InputLabel>
                <Select
                  value={localSettings.contestMode}
                  onChange={(e) => handleChange('contestMode', e.target.value)}
                  label="Default Contest Mode"
                >
                  <MenuItem value="CQ WW">CQ WW</MenuItem>
                  <MenuItem value="CQ WPX">CQ WPX</MenuItem>
                  <MenuItem value="ARRL DX">ARRL DX</MenuItem>
                  <MenuItem value="IARU HF">IARU HF</MenuItem>
                  <MenuItem value="WAE">WAE</MenuItem>
                  <MenuItem value="Field Day">Field Day</MenuItem>
                  <MenuItem value="Custom">Custom</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.autoTime}
                    onChange={(e) => handleChange('autoTime', e.target.checked)}
                  />
                }
                label="Automatic Date/Time"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.soundEnabled}
                    onChange={(e) => handleChange('soundEnabled', e.target.checked)}
                  />
                }
                label="Enable Sound Effects"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DX Cluster URL"
                value={localSettings.dxClusterUrl}
                onChange={(e) => handleChange('dxClusterUrl', e.target.value)}
                helperText="Format: telnet://hostname:port"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="RBN URL"
                value={localSettings.rbnUrl}
                onChange={(e) => handleChange('rbnUrl', e.target.value)}
                helperText="Format: telnet://hostname:port"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rig Interface</InputLabel>
                <Select
                  value={localSettings.rigInterface}
                  onChange={(e) => handleChange('rigInterface', e.target.value)}
                  label="Rig Interface"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="hamlib">Hamlib</MenuItem>
                  <MenuItem value="flrig">FLRig</MenuItem>
                  <MenuItem value="omnirig">OmniRig</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom>CW Speed (WPM)</Typography>
              <Slider
                value={localSettings.cwSpeed}
                onChange={(e, value) => handleChange('cwSpeed', value)}
                min={5}
                max={50}
                marks
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
