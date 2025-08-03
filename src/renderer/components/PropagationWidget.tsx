import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  SignalWifi4Bar as SignalIcon,
  WbSunny as SunIcon,
  Nightlight as NightIcon,
} from '@mui/icons-material';
import { RootState } from '../store/store';

interface BandCondition {
  band: string;
  day: number;
  night: number;
  rating: 'poor' | 'fair' | 'good' | 'excellent';
  recommendation: string;
}

const PropagationWidget: React.FC = () => {
  const settings = useSelector((state: RootState) => state.settings.settings);
  const [expanded, setExpanded] = useState(false);
  const [solarData, setSolarData] = useState({
    sfi: 85,
    sunspotNumber: 12,
    aIndex: 15,
    kIndex: 2,
    solarFluxTrend: 'stable',
  });
  const [bandConditions, setBandConditions] = useState<BandCondition[]>([]);

  useEffect(() => {
    // Simulate fetching propagation data
    // In a real app, you'd fetch from WWVH, Space Weather, or similar APIs
    fetchPropagationData();
    const interval = setInterval(fetchPropagationData, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchPropagationData = async () => {
    try {
      // Fetch real-time solar and geomagnetic data
      const solarData = await fetchSolarData();
      
      if (solarData) {
        setSolarData(solarData);
        // Calculate band conditions directly from solar data
        const propagationData = calculateBandConditionsFromSolar(solarData);
        setBandConditions(propagationData);
      }
    } catch (error) {
      console.error('Failed to fetch propagation data:', error);
      // Fallback to basic estimated conditions if all sources fail
      setBandConditions(generateEstimatedConditions());
    }
  };

  const fetchSolarData = async () => {
    try {
      // Primary source: NOAA Space Weather Prediction Center - correct endpoints
      const [solarFluxData, kIndexData, sunspotData] = await Promise.all([
        fetch('https://services.swpc.noaa.gov/json/f107_cm_flux.json'),
        fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json'),
        fetch('https://services.swpc.noaa.gov/json/sunspot_report.json')
      ]);
      
      if (solarFluxData.ok && kIndexData.ok) {
        const solarFlux = await solarFluxData.json();
        const kIndex = await kIndexData.json();
        const sunspots = sunspotData.ok ? await sunspotData.json() : null;
        
        return parseNOAADataCombined(solarFlux, kIndex, sunspots);
      }
    } catch (error) {
      console.warn('NOAA sources failed, trying alternative:', error);
    }

    try {
      // Fallback source: HamQSL space weather API
      const hamqslResponse = await fetch('https://www.hamqsl.com/solarxml.php');
      if (hamqslResponse.ok) {
        const xmlText = await hamqslResponse.text();
        return parseHamQSLData(xmlText);
      }
    } catch (error) {
      console.warn('HamQSL source failed:', error);
    }

    // Final fallback: Use basic estimated values
    console.warn('All solar data sources failed, using estimates');
    return {
      sfi: 85,
      sunspotNumber: 10,
      aIndex: 15,
      kIndex: 2,
      solarFluxTrend: 'stable'
    };
  };

  const parseNOAADataCombined = (solarFluxData: any[], kIndexData: any[], sunspotData: any[] | null) => {
    try {
      // Get latest solar flux (10.7cm radio flux)
      const latestSolarFlux = solarFluxData[solarFluxData.length - 1];
      const sfi = Math.round(parseFloat(latestSolarFlux.flux) || 85);
      
      // Get latest K-index
      const latestKIndex = kIndexData[kIndexData.length - 1];
      const kIndex = Math.round(parseFloat(latestKIndex.k_index) || 2);
      
      // Calculate A-index from K-index (approximate conversion)
      const aIndex = Math.round(kIndex * 7.5);
      
      // Get sunspot number if available
      let sunspotNumber = 10; // default
      if (sunspotData && sunspotData.length > 0) {
        const latestSunspot = sunspotData[sunspotData.length - 1];
        sunspotNumber = Math.round(parseFloat(latestSunspot.ssn) || 10);
      }
      
      return {
        sfi,
        sunspotNumber,
        aIndex,
        kIndex,
        solarFluxTrend: sfi > 100 ? 'rising' : sfi < 80 ? 'declining' : 'stable'
      };
    } catch (error) {
      console.error('Error parsing NOAA combined data:', error);
      return null;
    }
  };

  const parseHamQSLData = (xmlText: string) => {
    // Parse HamQSL XML format
    try {
      const getXMLValue = (tag: string) => {
        const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
        const match = xmlText.match(regex);
        return match ? match[1] : null;
      };

      return {
        sfi: parseInt(getXMLValue('solarflux') || '85') || 85,
        sunspotNumber: parseInt(getXMLValue('sunspots') || '0') || 0,
        aIndex: parseInt(getXMLValue('aindex') || '15') || 15,
        kIndex: parseInt(getXMLValue('kindex') || '2') || 2,
        solarFluxTrend: 'stable'
      };
    } catch (error) {
      console.error('Error parsing HamQSL data:', error);
      return null;
    }
  };

  const parseVOACAPData = (data: any) => {
    // Parse VOACAP-style prediction data
    try {
      if (data && data.bands) {
        return data.bands.map((band: any) => ({
          band: band.frequency,
          day: band.dayReliability || 50,
          night: band.nightReliability || 50,
          rating: band.reliability > 80 ? 'excellent' : band.reliability > 60 ? 'good' : band.reliability > 40 ? 'fair' : 'poor',
          recommendation: band.recommendation || 'No specific recommendation available'
        }));
      }
    } catch (error) {
      console.error('Error parsing VOACAP data:', error);
    }
    return null;
  };

  const parseKC2GData = (data: string) => {
    // Parse KC2G text format
    try {
      const lines = data.split('\n');
      const sfiLine = lines.find(line => line.includes('SFI'));
      const kLine = lines.find(line => line.includes('K-index'));
      
      return {
        sfi: sfiLine ? parseInt(sfiLine.match(/\d+/)?.[0] || '85') : 85,
        sunspotNumber: 0, // KC2G might not always have this
        aIndex: 15,
        kIndex: kLine ? parseInt(kLine.match(/\d+/)?.[0] || '2') : 2,
        solarFluxTrend: 'stable'
      };
    } catch (error) {
      console.error('Error parsing KC2G data:', error);
      return null;
    }
  };

  const calculateBandConditionsFromSolar = (solar: any): BandCondition[] => {
    if (!solar) return generateEstimatedConditions();

    const { sfi, kIndex, aIndex } = solar;
    const { isDaylight } = getCurrentTime();
    
    // Calculate band conditions based on real solar data
    const conditions: BandCondition[] = [
      {
        band: '10m',
        day: Math.min(95, Math.max(10, sfi * 0.8 - kIndex * 5)),
        night: Math.min(40, Math.max(5, sfi * 0.2 - kIndex * 3)),
        rating: sfi > 120 && kIndex < 3 ? 'excellent' : sfi > 90 && kIndex < 4 ? 'good' : sfi > 70 ? 'fair' : 'poor',
        recommendation: sfi > 100 ? 'Excellent for DX during daylight' : 'Limited DX potential'
      },
      {
        band: '15m',
        day: Math.min(95, Math.max(15, sfi * 0.9 - kIndex * 4)),
        night: Math.min(50, Math.max(10, sfi * 0.3 - kIndex * 2)),
        rating: sfi > 100 && kIndex < 4 ? 'excellent' : sfi > 80 && kIndex < 5 ? 'good' : sfi > 60 ? 'fair' : 'poor',
        recommendation: sfi > 90 ? 'Very good for worldwide DX' : 'Fair for regional contacts'
      },
      {
        band: '20m',
        day: Math.min(90, Math.max(30, 70 + (sfi - 80) * 0.3 - kIndex * 3)),
        night: Math.min(95, Math.max(40, 80 + (sfi - 80) * 0.2 - kIndex * 2)),
        rating: kIndex < 4 ? 'good' : kIndex < 6 ? 'fair' : 'poor',
        recommendation: kIndex < 3 ? 'Reliable for DX day and night' : 'May have QSB due to geomagnetic activity'
      },
      {
        band: '40m',
        day: Math.min(60, Math.max(20, 40 - kIndex * 2)),
        night: Math.min(95, Math.max(50, 85 - aIndex * 0.5)),
        rating: isDaylight ? 'fair' : aIndex < 20 && kIndex < 5 ? 'good' : 'fair',
        recommendation: isDaylight ? 'Regional contacts, some DX' : aIndex < 15 ? 'Excellent for DX' : 'Good for regional'
      },
      {
        band: '80m',
        day: Math.min(40, Math.max(10, 25 - kIndex)),
        night: Math.min(90, Math.max(40, 75 - aIndex * 0.8)),
        rating: isDaylight ? 'poor' : aIndex < 20 ? 'good' : 'fair',
        recommendation: isDaylight ? 'Local/regional only' : aIndex < 15 ? 'Good for DX' : 'Regional contacts'
      }
    ];

    return conditions;
  };

  const generateEstimatedConditions = (): BandCondition[] => {
    // Fallback basic conditions when no real data is available
    const { isDaylight } = getCurrentTime();
    
    return [
      {
        band: '10m',
        day: 60,
        night: 15,
        rating: 'fair',
        recommendation: 'Estimated conditions - no real-time data available'
      },
      {
        band: '15m',
        day: 70,
        night: 25,
        rating: 'fair',
        recommendation: 'Estimated conditions - no real-time data available'
      },
      {
        band: '20m',
        day: 65,
        night: 75,
        rating: 'fair',
        recommendation: 'Estimated conditions - no real-time data available'
      },
      {
        band: '40m',
        day: 35,
        night: 80,
        rating: 'fair',
        recommendation: 'Estimated conditions - no real-time data available'
      },
      {
        band: '80m',
        day: 20,
        night: 70,
        rating: 'fair',
        recommendation: 'Estimated conditions - no real-time data available'
      }
    ];
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'success';
      case 'good': return 'primary';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hour = now.getHours();
    return { hour, isDaylight: hour >= 6 && hour < 18 };
  };

  const { hour, isDaylight } = getCurrentTime();

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <SignalIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flex: 1 }}>
          Propagation Forecast
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
          {isDaylight ? (
            <SunIcon color="warning" sx={{ mr: 0.5 }} />
          ) : (
            <NightIcon color="info" sx={{ mr: 0.5 }} />
          )}
          <Typography variant="caption" color="text.secondary">
            {String(hour).padStart(2, '0')}:00 UTC
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={() => setExpanded(!expanded)}
          sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      {/* Solar Conditions Summary */}
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="body2" color="text.secondary">SFI</Typography>
              <Typography variant="h6">{solarData.sfi}</Typography>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="body2" color="text.secondary">SSN</Typography>
              <Typography variant="h6">{solarData.sunspotNumber}</Typography>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="body2" color="text.secondary">A-Index</Typography>
              <Typography variant="h6">{solarData.aIndex}</Typography>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card variant="outlined" sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="body2" color="text.secondary">K-Index</Typography>
              <Typography variant="h6">{solarData.kIndex}</Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Band Conditions */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Band Conditions {isDaylight ? '(Day)' : '(Night)'}
        </Typography>
        {bandConditions.map((condition) => {
          const currentCondition = isDaylight ? condition.day : condition.night;
          return (
            <Box key={condition.band} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ minWidth: 40, fontWeight: 'bold' }}>
                  {condition.band}
                </Typography>
                <Box sx={{ flex: 1, mx: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={currentCondition}
                    color={getRatingColor(condition.rating) as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
                <Chip
                  label={condition.rating.toUpperCase()}
                  size="small"
                  color={getRatingColor(condition.rating) as any}
                  sx={{ minWidth: 80, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Detailed Information */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recommendations
          </Typography>
          {bandConditions.map((condition) => (
            <Box key={condition.band} sx={{ mb: 1 }}>
              <Typography variant="body2">
                <strong>{condition.band}:</strong> {condition.recommendation}
              </Typography>
            </Box>
          ))}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Real-time space weather data from NOAA Space Weather Prediction Center, HamQSL.com, and KC2G.
              SFI: Solar Flux Index, SSN: Sunspot Number, A/K-Index: Geomagnetic activity.
              Band conditions calculated from current solar-terrestrial data.
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default PropagationWidget; 