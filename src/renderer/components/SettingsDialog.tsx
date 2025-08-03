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
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Tabs,
  Tab,
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
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
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
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [tabValue, setTabValue] = React.useState(0);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = () => {
    dispatch(updateSettings(localSettings));
    onClose();
  };

  const handleClose = () => {
    setLocalSettings(settings);
    setTabValue(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent sx={{ minHeight: 400 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Station" />
            <Tab label="Connections" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* Station Settings */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Call Sign"
                value={localSettings.callsign || ''}
                onChange={(e) => handleChange('callsign', e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Grid Square"
                value={localSettings.gridSquare || ''}
                onChange={(e) => handleChange('gridSquare', e.target.value.toUpperCase())}
                helperText="Your station's grid square (e.g., FN20)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={localSettings.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="QTH"
                value={localSettings.qth || ''}
                onChange={(e) => handleChange('qth', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="QRZ.com Username"
                value={localSettings.qrzUsername || ''}
                onChange={(e) => handleChange('qrzUsername', e.target.value)}
                helperText="Required for callsign lookups"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="password"
                label="QRZ.com Password"
                value={localSettings.qrzPassword || ''}
                onChange={(e) => handleChange('qrzPassword', e.target.value)}
                helperText="Your QRZ.com account password"
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Connection Settings */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Cluster Connections
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DX Cluster URL"
                value={localSettings.dxClusterUrl || ''}
                onChange={(e) => handleChange('dxClusterUrl', e.target.value)}
                helperText="Telnet URL for DX cluster (e.g., telnet://dxc.nc7j.com:7373)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="RBN URL"
                value={localSettings.rbnUrl || ''}
                onChange={(e) => handleChange('rbnUrl', e.target.value)}
                helperText="Reverse Beacon Network URL"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rig Interface</InputLabel>
                <Select
                  value={localSettings.rigInterface || 'none'}
                  onChange={(e) => handleChange('rigInterface', e.target.value)}
                  label="Rig Interface"
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="hamlib">Ham Radio Control Libraries</MenuItem>
                  <MenuItem value="n1mm">N1MM Logger+</MenuItem>
                  <MenuItem value="omnirig">OmniRig</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;
