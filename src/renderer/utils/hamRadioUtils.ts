// Ham Radio utility functions

export const BANDS = {
  '160m': { min: 1.8, max: 2.0 },
  '80m': { min: 3.5, max: 4.0 },
  '40m': { min: 7.0, max: 7.3 },
  '30m': { min: 10.1, max: 10.15 },
  '20m': { min: 14.0, max: 14.35 },
  '17m': { min: 18.068, max: 18.168 },
  '15m': { min: 21.0, max: 21.45 },
  '12m': { min: 24.89, max: 24.99 },
  '10m': { min: 28.0, max: 29.7 },
  '6m': { min: 50.0, max: 54.0 },
  '2m': { min: 144.0, max: 148.0 },
};

// Convert frequency to band
export function frequencyToBand(freq: number): string {
  for (const [band, range] of Object.entries(BANDS)) {
    if (freq >= range.min && freq <= range.max) {
      return band;
    }
  }
  return '';
}

// Validate callsign format
export function isValidCallsign(call: string): boolean {
  // Basic callsign validation regex
  const callsignRegex = /^[A-Z0-9]{1,3}[0-9][A-Z0-9]{0,3}[A-Z]$/;
  return callsignRegex.test(call.toUpperCase());
}

// Validate grid square
export function isValidGridSquare(grid: string): boolean {
  const gridRegex = /^[A-R]{2}[0-9]{2}([A-X]{2})?$/;
  return gridRegex.test(grid.toUpperCase());
}

// Convert grid square to lat/lon
export function gridSquareToLatLon(grid: string): { lat: number; lon: number } | null {
  if (!isValidGridSquare(grid)) return null;
  
  const gridUpper = grid.toUpperCase();
  const lon = (gridUpper.charCodeAt(0) - 65) * 20 + 
              (parseInt(gridUpper[2]) * 2) - 180 + 1;
  const lat = (gridUpper.charCodeAt(1) - 65) * 10 + 
              parseInt(gridUpper[3]) - 90 + 0.5;
  
  return { lat, lon };
}

// Calculate distance between two grid squares
export function calculateDistance(grid1: string, grid2: string): number | null {
  const loc1 = gridSquareToLatLon(grid1);
  const loc2 = gridSquareToLatLon(grid2);
  
  if (!loc1 || !loc2) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lon - loc1.lon);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Calculate bearing between two grid squares
export function calculateBearing(grid1: string, grid2: string): number | null {
  const loc1 = gridSquareToLatLon(grid1);
  const loc2 = gridSquareToLatLon(grid2);
  
  if (!loc1 || !loc2) return null;
  
  const dLon = toRad(loc2.lon - loc1.lon);
  const lat1Rad = toRad(loc1.lat);
  const lat2Rad = toRad(loc2.lat);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = toDeg(Math.atan2(y, x));
  return Math.round((bearing + 360) % 360);
}

// Helper functions
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

function toDeg(rad: number): number {
  return rad * (180 / Math.PI);
}

// Parse DX cluster spot
export function parseDXSpot(line: string): any | null {
  // Example: DX de W3LPL:     7003.0  JA1ABC       CW up 2                        0430Z
  const dxRegex = /DX de ([A-Z0-9\/\-]+):\s+(\d+\.\d+)\s+([A-Z0-9\/\-]+)\s+(.*?)\s+(\d{4}Z)/i;
  const match = line.match(dxRegex);
  
  if (match) {
    return {
      spotter: match[1],
      frequency: parseFloat(match[2]) / 1000, // Convert to MHz
      call: match[3],
      comment: match[4].trim(),
      time: match[5],
      band: frequencyToBand(parseFloat(match[2]) / 1000),
    };
  }
  
  return null;
}

// Parse RBN spot
export function parseRBNSpot(line: string): any | null {
  // Example: DX de DL8LAS-#:  14040.0  DF2RG        CW    24 dB  28 WPM  CQ      1150Z
  const rbnRegex = /DX de ([A-Z0-9\/\-#]+):\s+(\d+\.\d+)\s+([A-Z0-9\/\-]+)\s+CW\s+(\d+)\s+dB\s+(\d+)\s+WPM/i;
  const match = line.match(rbnRegex);
  
  if (match) {
    return {
      spotter: match[1],
      frequency: parseFloat(match[2]) / 1000, // Convert to MHz
      call: match[3],
      snr: parseInt(match[4]),
      speed: parseInt(match[5]),
      band: frequencyToBand(parseFloat(match[2]) / 1000),
    };
  }
  
  return null;
}

// Contest scoring functions
export function calculateScore(qsos: any[], contestType: string): any {
  const score = {
    qsos: qsos.length,
    points: 0,
    multipliers: new Set<string>(),
    total: 0,
  };
  
  // Calculate based on contest type
  switch (contestType) {
    case 'CQ WW':
      // Points: Same country=0, Same continent=1, Different continent=3
      // Multipliers: DXCC entities + CQ zones
      qsos.forEach(qso => {
        score.points += qso.points || 1;
        if (qso.dxcc) score.multipliers.add(`dxcc-${qso.dxcc}`);
        if (qso.cqZone) score.multipliers.add(`zone-${qso.cqZone}`);
      });
      break;
      
    case 'CQ WPX':
      // Points based on band and distance
      // Multipliers: Unique prefixes
      qsos.forEach(qso => {
        score.points += qso.points || 1;
        const prefix = extractPrefix(qso.call);
        if (prefix) score.multipliers.add(prefix);
      });
      break;
      
    default:
      // Generic scoring
      qsos.forEach(qso => {
        score.points += qso.points || 1;
      });
  }
  
  score.total = score.points * score.multipliers.size;
  return {
    ...score,
    multipliers: score.multipliers.size,
  };
}

// Extract prefix from callsign
export function extractPrefix(call: string): string {
  // Simple prefix extraction - would need more complex logic for special cases
  const match = call.match(/^([A-Z0-9]+[0-9])/);
  return match ? match[1] : call;
}

// Get CQ zone from grid square
export function getCQZone(grid: string): number | null {
  const loc = gridSquareToLatLon(grid);
  if (!loc) return null;
  
  // Simplified CQ zone calculation
  // In reality, this would need a proper zone boundary database
  if (loc.lat > 50 && loc.lon > -20 && loc.lon < 40) return 14; // Europe
  if (loc.lat > 25 && loc.lat < 50 && loc.lon > -130 && loc.lon < -65) return 4; // Eastern US
  if (loc.lat > 25 && loc.lat < 50 && loc.lon > -160 && loc.lon < -130) return 3; // Western US
  // ... etc
  
  return null;
}

// Format frequency for display
export function formatFrequency(freq: number): string {
  return freq.toFixed(3);
}

// Get mode from frequency (CW portions of bands)
export function getModeFromFrequency(freq: number): string {
  const cwPortions = [
    { min: 1.8, max: 1.84 },
    { min: 3.5, max: 3.6 },
    { min: 7.0, max: 7.04 },
    { min: 10.1, max: 10.15 },
    { min: 14.0, max: 14.07 },
    { min: 18.068, max: 18.095 },
    { min: 21.0, max: 21.07 },
    { min: 24.89, max: 24.915 },
    { min: 28.0, max: 28.07 },
  ];
  
  for (const portion of cwPortions) {
    if (freq >= portion.min && freq <= portion.max) {
      return 'CW';
    }
  }
  
  return 'SSB';
}
