import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import { RootState } from '../store/store';
import 'leaflet/dist/leaflet.css';

const WorldMap: React.FC = () => {
  const dxSpots = useSelector((state: RootState) => state.cluster.dxSpots);
  const rbnSpots = useSelector((state: RootState) => state.cluster.rbnSpots);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const theme = useSelector((state: RootState) => state.settings.settings.theme);
  const [showType, setShowType] = React.useState<'dx' | 'rbn' | 'both'>('both');

  // Convert grid square to lat/lon
  const gridToLatLon = (grid: string): [number, number] | null => {
    if (!grid || grid.length < 4) return null;
    
    const lon = (grid.charCodeAt(0) - 65) * 20 + 
                (parseInt(grid[2]) * 2) - 180 + 1;
    const lat = (grid.charCodeAt(1) - 65) * 10 + 
                parseInt(grid[3]) - 90 + 0.5;
    
    return [lat, lon];
  };

  // Get user's location from grid square
  const userLocation = gridToLatLon(settings.gridSquare) || [40, -100];

  // Calculate great circle path
  const getGreatCirclePath = (start: [number, number], end: [number, number]) => {
    const points: [number, number][] = [];
    const steps = 50;
    
    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const lat = start[0] + (end[0] - start[0]) * f;
      const lon = start[1] + (end[1] - start[1]) * f;
      points.push([lat, lon]);
    }
    
    return points;
  };

  const handleShowTypeChange = (event: React.MouseEvent<HTMLElement>, newType: string | null) => {
    if (newType !== null) {
      setShowType(newType as 'dx' | 'rbn' | 'both');
    }
  };

  const filteredDXSpots = dxSpots.filter(spot => spot.latitude && spot.longitude);
  const filteredRBNSpots = rbnSpots.filter(spot => spot.latitude && spot.longitude);

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          World Map
        </Typography>
        <ToggleButtonGroup
          value={showType}
          exclusive
          onChange={handleShowTypeChange}
          size="small"
        >
          <ToggleButton value="dx">DX</ToggleButton>
          <ToggleButton value="rbn">RBN</ToggleButton>
          <ToggleButton value="both">Both</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapContainer
          center={userLocation}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            key={theme} // Force re-render when theme changes
            url={theme === 'dark' 
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            }
            attribution={theme === 'dark'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
          />
          
          {/* User location */}
          <CircleMarker
            center={userLocation}
            radius={8}
            fillColor="#2196f3"
            color={theme === 'dark' ? "#fff" : "#000"}
            weight={2}
            opacity={1}
            fillOpacity={1}
          >
            <Popup>
              <Typography variant="body2">
                {settings.callsign || 'Your Station'}<br />
                {settings.gridSquare}
              </Typography>
            </Popup>
          </CircleMarker>

          {/* DX Spots */}
          {(showType === 'dx' || showType === 'both') && filteredDXSpots.map((spot) => (
            <React.Fragment key={spot.id}>
              <CircleMarker
                center={[spot.latitude!, spot.longitude!]}
                radius={6}
                fillColor="#f50057"
                color={theme === 'dark' ? "#fff" : "#000"}
                weight={1}
                opacity={0.8}
                fillOpacity={0.8}
              >
                <Popup>
                  <Typography variant="body2">
                    <strong>{spot.call}</strong><br />
                    {spot.frequency.toFixed(3)} MHz<br />
                    {spot.comment}
                  </Typography>
                </Popup>
              </CircleMarker>
              <Polyline
                positions={getGreatCirclePath(userLocation, [spot.latitude!, spot.longitude!])}
                color="#f50057"
                weight={1}
                opacity={0.3}
              />
            </React.Fragment>
          ))}

          {/* RBN Spots */}
          {(showType === 'rbn' || showType === 'both') && filteredRBNSpots.map((spot) => (
            <React.Fragment key={spot.id}>
              <CircleMarker
                center={[spot.latitude!, spot.longitude!]}
                radius={4}
                fillColor="#4caf50"
                color={theme === 'dark' ? "#fff" : "#000"}
                weight={1}
                opacity={0.6}
                fillOpacity={0.6}
              >
                <Popup>
                  <Typography variant="body2">
                    <strong>{spot.call}</strong><br />
                    {spot.frequency.toFixed(3)} MHz<br />
                    {spot.snr} dB / {spot.speed} WPM
                  </Typography>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          ))}
        </MapContainer>
      </Box>
      
      <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-around' }}>
        <Typography variant="caption" color="text.secondary">
          DX: {filteredDXSpots.length} spots
        </Typography>
        <Typography variant="caption" color="text.secondary">
          RBN: {filteredRBNSpots.length} spots
        </Typography>
      </Box>
    </Paper>
  );
};

export default WorldMap;
