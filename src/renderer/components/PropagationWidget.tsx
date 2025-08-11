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
  Tooltip,
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
  const [isLoading, setIsLoading] = useState(true);
  const [solarData, setSolarData] = useState({
    sfi: 85,
    sunspotNumber: 12,
    aIndex: 15,
    kIndex: 2,
    solarFluxTrend: 'stable',
    source: 'Loading...',
  });
  const [bandConditions, setBandConditions] = useState<BandCondition[]>([]);

  // Performance timing utility
  const perfTimer = {
    start: (label: string) => {
      const startTime = performance.now();
      console.log(`📡 [PROPAGATION] Starting: ${label}`);
      return {
        end: () => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          console.log(`📡 [PROPAGATION] Completed: ${label} in ${duration.toFixed(2)}ms`);
          return duration;
        }
      };
    }
  };

  useEffect(() => {
    // Defer initial data fetch to not block startup
    const deferredTimer = perfTimer.start('Propagation widget initialization');
    
    // Show estimated data immediately, then load real data after a delay
    setBandConditions(generateEstimatedConditions());
    setIsLoading(false);
    deferredTimer.end();
    
    // Fetch real data after 2 seconds to allow UI to render first
    const deferredTimeout = setTimeout(() => {
      fetchPropagationData();
    }, 2000);
    
    // Set up periodic updates after initial load
    const interval = setInterval(fetchPropagationData, 300000); // Update every 5 minutes
    
    return () => {
      clearTimeout(deferredTimeout);
      clearInterval(interval);
    };
  }, []);

  const fetchPropagationData = async () => {
    const fetchTimer = perfTimer.start('Solar data fetch and processing');
    try {
      // Fetch real-time solar and geomagnetic data
      const solarDataTimer = perfTimer.start('Solar data API call');
      const solarData = await fetchSolarData();
      solarDataTimer.end();
      
      if (solarData) {
        const processingTimer = perfTimer.start('Band conditions calculation');
        setSolarData(solarData);
        // Calculate band conditions directly from solar data
        const propagationData = calculateBandConditionsFromSolar(solarData);
        setBandConditions(propagationData);
        processingTimer.end();
      }
      fetchTimer.end();
    } catch (error) {
      console.error('Failed to fetch propagation data:', error);
      // Fallback to basic estimated conditions if all sources fail
      setBandConditions(generateEstimatedConditions());
      fetchTimer.end();
    }
  };

  const fetchSolarData = async (): Promise<any> => {
    try {
      const result = await window.electronAPI.fetchSolarData();
      console.log('Solar data from main process:', result);
      
      if (result && result.data) {
        // Handle null values by providing reasonable defaults
        const data = result.data;
        return {
          sfi: data.sfi ?? 150,
          kIndex: data.kIndex ?? 2,
          aIndex: data.aIndex ?? 15,
          sunspotNumber: data.sunspotNumber ?? 50,
          source: data.source || 'Unknown'
        };
      } else {
        throw new Error('No data received from main process');
      }
    } catch (error) {
      console.error('Failed to fetch solar data:', error);
      return {
        sfi: 150,
        kIndex: 2,
        aIndex: 15,
        sunspotNumber: 50,
        source: 'Fallback'
      };
    }
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

  const getSFITooltip = (sfi: number) => {
    let interpretation = '';
    let effects = '';
    
    if (sfi >= 200) {
      interpretation = 'Very High Solar Activity';
      effects = 'Excellent 10m/15m DX, possible 6m openings';
    } else if (sfi >= 150) {
      interpretation = 'High Solar Activity';
      effects = 'Very good 10m/15m DX, good 20m conditions';
    } else if (sfi >= 100) {
      interpretation = 'Moderate Solar Activity';
      effects = 'Good 15m/20m DX, fair 10m conditions';
    } else if (sfi >= 70) {
      interpretation = 'Low Solar Activity';
      effects = 'Fair 20m DX, poor higher frequency bands';
    } else {
      interpretation = 'Very Low Solar Activity';
      effects = 'Poor HF conditions, rely on 40m/80m';
    }

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Solar Flux Index (SFI): {sfi}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Current Level:</strong> {interpretation}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>HF Effects:</strong> {effects}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Interpretation:</strong>
        </Typography>
        <Typography variant="caption" component="div">
          • &gt;200: Exceptional conditions, all bands active<br/>
          • 150-200: Excellent conditions, 10m-20m very good<br/>
          • 100-150: Good conditions, 15m/20m reliable<br/>
          • 70-100: Fair conditions, 20m main DX band<br/>
          • &lt;70: Poor conditions, lower bands better
        </Typography>
      </Box>
    );
  };

  const getSSNTooltip = (ssn: number) => {
    let interpretation = '';
    let effects = '';
    
    if (ssn >= 100) {
      interpretation = 'Very High Sunspot Activity';
      effects = 'Excellent propagation on 10m-15m bands';
    } else if (ssn >= 50) {
      interpretation = 'High Sunspot Activity';
      effects = 'Good propagation on higher frequency bands';
    } else if (ssn >= 20) {
      interpretation = 'Moderate Sunspot Activity';
      effects = 'Fair to good 15m/20m propagation';
    } else if (ssn >= 5) {
      interpretation = 'Low Sunspot Activity';
      effects = 'Poor higher band conditions, 20m fair';
    } else {
      interpretation = 'Solar Minimum';
      effects = 'Very poor HF conditions overall';
    }

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Sunspot Number (SSN): {ssn}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Current Level:</strong> {interpretation}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>HF Effects:</strong> {effects}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Interpretation:</strong>
        </Typography>
        <Typography variant="caption" component="div">
          • &gt;100: Solar maximum, all bands excellent<br/>
          • 50-100: High activity, 10m-15m very good<br/>
          • 20-50: Moderate activity, 15m-20m good<br/>
          • 5-20: Low activity, mainly 20m/40m<br/>
          • &lt;5: Solar minimum, poor HF conditions
        </Typography>
      </Box>
    );
  };

  const getAIndexTooltip = (aIndex: number) => {
    let interpretation = '';
    let effects = '';
    
    if (aIndex >= 50) {
      interpretation = 'Severe Geomagnetic Storm';
      effects = 'Very poor HF, possible blackouts, aurora';
    } else if (aIndex >= 30) {
      interpretation = 'Major Geomagnetic Storm';
      effects = 'Poor HF conditions, strong aurora activity';
    } else if (aIndex >= 20) {
      interpretation = 'Minor Geomagnetic Storm';
      effects = 'Degraded HF, especially higher latitudes';
    } else if (aIndex >= 8) {
      interpretation = 'Unsettled Geomagnetic Field';
      effects = 'Some HF degradation, possible flutter';
    } else {
      interpretation = 'Quiet Geomagnetic Field';
      effects = 'Stable HF propagation conditions';
    }

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          A-Index: {aIndex}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Current Level:</strong> {interpretation}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>HF Effects:</strong> {effects}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Interpretation:</strong>
        </Typography>
        <Typography variant="caption" component="div">
          • &gt;50: Severe storm, HF blackouts possible<br/>
          • 30-50: Major storm, very poor HF<br/>
          • 20-30: Minor storm, degraded HF<br/>
          • 8-20: Unsettled, some HF degradation<br/>
          • &lt;8: Quiet, stable propagation
        </Typography>
      </Box>
    );
  };

  const getKIndexTooltip = (kIndex: number) => {
    let interpretation = '';
    let effects = '';
    
    if (kIndex >= 8) {
      interpretation = 'Severe Geomagnetic Storm (G4)';
      effects = 'HF blackouts, strong aurora to mid-latitudes';
    } else if (kIndex >= 7) {
      interpretation = 'Strong Geomagnetic Storm (G3)';
      effects = 'Very poor HF, aurora visible at lower latitudes';
    } else if (kIndex >= 6) {
      interpretation = 'Moderate Geomagnetic Storm (G2)';
      effects = 'Poor HF propagation, possible aurora';
    } else if (kIndex >= 5) {
      interpretation = 'Minor Geomagnetic Storm (G1)';
      effects = 'Some HF degradation, aurora at high latitudes';
    } else if (kIndex >= 4) {
      interpretation = 'Unsettled Geomagnetic Conditions';
      effects = 'Slight HF degradation possible';
    } else {
      interpretation = 'Quiet Geomagnetic Conditions';
      effects = 'Stable HF propagation';
    }

    return (
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          K-Index: {kIndex}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Current Level:</strong> {interpretation}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>HF Effects:</strong> {effects}
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Interpretation:</strong>
        </Typography>
        <Typography variant="caption" component="div">
          • 9: Extreme storm (G5), complete HF blackout<br/>
          • 7-8: Severe storm (G4), very poor HF<br/>
          • 6: Strong storm (G3), poor HF conditions<br/>
          • 5: Moderate storm (G2), degraded HF<br/>
          • 4: Minor storm (G1), slight HF effects<br/>
          • 0-3: Quiet to unsettled, stable HF
        </Typography>
      </Box>
    );
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
        <Box sx={{ mr: 1 }}>
          <Chip 
            label={`Data: ${solarData.source || 'Unknown'}`}
            size="small"
            variant="outlined"
            color={solarData.source === 'NOAA' ? 'success' : solarData.source === 'HamQSL' ? 'primary' : 'default'}
            sx={{ fontSize: '0.7rem', height: '20px' }}
          />
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
            <Tooltip 
              title={getSFITooltip(solarData.sfi)} 
              arrow 
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: { maxWidth: 400, fontSize: '0.875rem' }
                }
              }}
            >
              <Card variant="outlined" sx={{ textAlign: 'center', py: 1, cursor: 'help' }}>
                <Typography variant="body2" color="text.secondary">SFI</Typography>
                <Typography variant="h6">{solarData.sfi}</Typography>
              </Card>
            </Tooltip>
          </Grid>
          <Grid item xs={3}>
            <Tooltip 
              title={getSSNTooltip(solarData.sunspotNumber)} 
              arrow 
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: { maxWidth: 400, fontSize: '0.875rem' }
                }
              }}
            >
              <Card variant="outlined" sx={{ textAlign: 'center', py: 1, cursor: 'help' }}>
                <Typography variant="body2" color="text.secondary">SSN</Typography>
                <Typography variant="h6">{solarData.sunspotNumber}</Typography>
              </Card>
            </Tooltip>
          </Grid>
          <Grid item xs={3}>
            <Tooltip 
              title={getAIndexTooltip(solarData.aIndex)} 
              arrow 
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: { maxWidth: 400, fontSize: '0.875rem' }
                }
              }}
            >
              <Card variant="outlined" sx={{ textAlign: 'center', py: 1, cursor: 'help' }}>
                <Typography variant="body2" color="text.secondary">A-Index</Typography>
                <Typography variant="h6">{solarData.aIndex}</Typography>
              </Card>
            </Tooltip>
          </Grid>
          <Grid item xs={3}>
            <Tooltip 
              title={getKIndexTooltip(solarData.kIndex)} 
              arrow 
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: { maxWidth: 400, fontSize: '0.875rem' }
                }
              }}
            >
              <Card variant="outlined" sx={{ textAlign: 'center', py: 1, cursor: 'help' }}>
                <Typography variant="body2" color="text.secondary">K-Index</Typography>
                <Typography variant="h6">{solarData.kIndex}</Typography>
              </Card>
            </Tooltip>
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