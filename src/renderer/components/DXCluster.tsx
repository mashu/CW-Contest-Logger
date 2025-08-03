import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import { Refresh as RefreshIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { RootState, AppDispatch } from '../store/store';
import { format } from 'date-fns';

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
      id={`cluster-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
}

const DXCluster: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const dxSpots = useSelector((state: RootState) => state.cluster.dxSpots);
  const rbnSpots = useSelector((state: RootState) => state.cluster.rbnSpots);
  const filters = useSelector((state: RootState) => state.cluster.filters);
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getBandColor = (band: string): any => {
    const colors: Record<string, any> = {
      '160m': 'error',
      '80m': 'warning',
      '40m': 'info',
      '20m': 'success',
      '15m': 'primary',
      '10m': 'secondary',
    };
    return colors[band] || 'default';
  };

  const SpotItem = ({ spot, type }: { spot: any; type: 'dx' | 'rbn' }) => (
    <ListItem
      sx={{
        py: 0.5,
        px: 1,
        '&:hover': { backgroundColor: 'action.hover' },
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{ fontFamily: 'monospace', fontWeight: 'bold', minWidth: 80 }}
            >
              {spot.call}
            </Typography>
            <Chip
              label={spot.frequency.toFixed(3)}
              size="small"
              color={getBandColor(spot.band)}
              sx={{ minWidth: 70, fontFamily: 'monospace' }}
            />
            {type === 'rbn' && (
              <Chip
                label={`${spot.snr}dB`}
                size="small"
                variant="outlined"
                sx={{ minWidth: 50 }}
              />
            )}
            {spot.distance && (
              <Typography variant="caption" color="text.secondary">
                {spot.distance}km @ {spot.bearing}°
              </Typography>
            )}
          </Box>
        }
        secondary={
          <span style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {type === 'dx' ? spot.comment : `${spot.speed} WPM`}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {format(new Date(spot.time), 'HH:mm:ss')} by {spot.spotter}
            </span>
          </span>
        }
      />
    </ListItem>
  );

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 2, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ flex: 1 }}>
            DX Cluster
          </Typography>
          <IconButton size="small">
            <FilterIcon />
          </IconButton>
          <IconButton size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`DX Spots (${dxSpots.length})`} />
          <Tab label={`RBN (${rbnSpots.length})`} />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <TabPanel value={tabValue} index={0}>
          <List sx={{ height: '100%', overflow: 'auto', p: 0 }}>
            {dxSpots.map((spot) => (
              <SpotItem key={spot.id} spot={spot} type="dx" />
            ))}
            {dxSpots.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No DX spots received"
                  secondary="Waiting for cluster connection..."
                />
              </ListItem>
            )}
          </List>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <List sx={{ height: '100%', overflow: 'auto', p: 0 }}>
            {rbnSpots.map((spot) => (
              <SpotItem key={spot.id} spot={spot} type="rbn" />
            ))}
            {rbnSpots.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No RBN spots received"
                  secondary="Waiting for RBN connection..."
                />
              </ListItem>
            )}
          </List>
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default DXCluster;
