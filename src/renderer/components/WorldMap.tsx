import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Paper, Typography, Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, ImageOverlay, Rectangle } from 'react-leaflet';
import type { LatLngBoundsExpression } from 'leaflet';
import { RootState } from '../store/store';
import 'leaflet/dist/leaflet.css';

const WorldMap: React.FC = () => {
  const dxSpots = useSelector((state: RootState) => state.cluster.dxSpots);
  const rbnSpots = useSelector((state: RootState) => state.cluster.rbnSpots);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const theme = useSelector((state: RootState) => state.settings.settings.theme);
  const [showType, setShowType] = React.useState<'dx' | 'rbn' | 'both'>('both');
  const [overlayLayers, setOverlayLayers] = React.useState<Array<'drap' | 'aurora'>>([]);

  const worldBounds: LatLngBoundsExpression = [[-90, -180], [90, 180]];

  const [drapUrl, setDrapUrl] = React.useState<string>(
    `https://services.swpc.noaa.gov/images/d-rap/global/d-rap_global.png?t=${Date.now()}`
  );
  const [auroraUrl, setAuroraUrl] = React.useState<string>(
    `https://services.swpc.noaa.gov/images/ovation_aurora_latest.jpg?t=${Date.now()}`
  );
  const [drapLoaded, setDrapLoaded] = React.useState<boolean>(false);
  const [drapError, setDrapError] = React.useState<boolean>(false);
  const [auroraLoaded, setAuroraLoaded] = React.useState<boolean>(false);
  const [auroraError, setAuroraError] = React.useState<boolean>(false);
  const [auroraPoints, setAuroraPoints] = React.useState<Array<{ lat: number; lon: number; value: number }>>([]);

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

  const handleOverlayChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLayers: Array<'drap' | 'aurora'>,
  ) => {
    setOverlayLayers(newLayers || []);
  };

  // Periodically refresh overlay images to bypass caching (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      setDrapUrl(`https://services.swpc.noaa.gov/images/d-rap/global/d-rap_global.png?t=${Date.now()}`);
      setAuroraUrl(`https://services.swpc.noaa.gov/images/ovation_aurora_latest.jpg?t=${Date.now()}`);
      setDrapLoaded(false);
      setAuroraLoaded(false);
      setDrapError(false);
      setAuroraError(false);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch OVATION aurora JSON periodically to render as heatmap points if image unavailable
  useEffect(() => {
    let isActive = true;
    const fetchAurora = async () => {
      try {
        const res = await fetch('https://services.swpc.noaa.gov/json/ovation_aurora_latest.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const coords: [number, number, number][] = data.coordinates || [];
        // Subsample to keep performance reasonable
        const downsampled: Array<{ lat: number; lon: number; value: number }> = [];
        const step = 8; // take every 8th point for performance
        for (let i = 0; i < coords.length; i += step) {
          const [lon, lat, value] = coords[i];
          // Keep only meaningful intensity
          if (value > 10) {
            downsampled.push({ lat, lon, value });
          }
        }
        if (isActive) setAuroraPoints(downsampled);
      } catch {
        // ignore
      }
    };
    fetchAurora();
    const id = setInterval(fetchAurora, 5 * 60 * 1000);
    return () => {
      isActive = false;
      clearInterval(id);
    };
  }, []);

  const getAuroraColor = (value: number): string => {
    // Map 0-100 to 120 (green) -> 0 (red)
    const v = Math.max(0, Math.min(100, value));
    const hue = (120 * (100 - v)) / 100;
    const alpha = Math.min(0.7, 0.2 + v / 150);
    return `hsla(${hue}, 90%, 50%, ${alpha})`;
  };

  const filteredDXSpots = dxSpots.filter(spot => spot.latitude && spot.longitude);
  const filteredRBNSpots = rbnSpots.filter(spot => spot.latitude && spot.longitude);

  return (
    <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          World Map
        </Typography>
        <ToggleButtonGroup value={showType} exclusive onChange={handleShowTypeChange} size="small">
          <ToggleButton value="dx">DX</ToggleButton>
          <ToggleButton value="rbn">RBN</ToggleButton>
          <ToggleButton value="both">Both</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">Layers:</Typography>
          <ToggleButtonGroup
            value={overlayLayers}
            onChange={handleOverlayChange}
            size="small"
          >
            <Tooltip
              title="D-Region Absorption (NOAA SWPC D-RAP). Warmer areas indicate stronger HF absorption (degraded lower HF, especially during flares)."
              arrow
            >
              <ToggleButton value="drap">D-RAP</ToggleButton>
            </Tooltip>
            <Tooltip
              title="Auroral Oval (NOAA SWPC OVATION). Higher intensity near the poles implies potential absorption/auroral effects and degraded polar paths."
              arrow
            >
              <ToggleButton value="aurora">Aurora</ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Box>
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

          {/* Overlays */}
          {overlayLayers.includes('drap') && (
            <ImageOverlay
              url={drapUrl}
              bounds={worldBounds}
              opacity={theme === 'dark' ? 0.55 : 0.5}
              crossOrigin="anonymous"
              zIndex={550}
              eventHandlers={{
                load: () => setDrapLoaded(true),
                error: () => setDrapError(true),
              }}
              attribution='D-RAP: NOAA SWPC'
            />
          )}
          {overlayLayers.includes('aurora') && (
            <ImageOverlay
              url={auroraUrl}
              bounds={worldBounds}
              opacity={0.45}
              crossOrigin="anonymous"
              zIndex={540}
              eventHandlers={{
                load: () => setAuroraLoaded(true),
                error: () => setAuroraError(true),
              }}
              attribution='Aurora: NOAA SWPC OVATION'
            />
          )}

          {/* Aurora JSON fallback heatmap (visible if toggle enabled and image failed OR always augment image) */}
          {overlayLayers.includes('aurora') && (auroraError || auroraPoints.length > 0) && (
            <>
              {auroraPoints.map((p, idx) => (
                <CircleMarker
                  key={`aur-${idx}`}
                  center={[p.lat, p.lon]}
                  radius={2}
                  pathOptions={{
                    color: getAuroraColor(p.value),
                    fillColor: getAuroraColor(p.value),
                    fillOpacity: 0.6,
                    opacity: 0.6,
                  }}
                />
              ))}
            </>
          )}
          
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
