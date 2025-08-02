import { store } from '../store/store';
import { addDXSpot, addRBNSpot, setConnected } from '../store/clusterSlice';
import { parseDXSpot, parseRBNSpot, gridSquareToLatLon, calculateDistance, calculateBearing } from '../utils/hamRadioUtils';
import { v4 as uuidv4 } from 'uuid';

// Mock telnet connection for demo purposes
// In a real app, you would use node-telnet-client or similar
class ClusterService {
  private mockDXInterval: NodeJS.Timeout | null = null;
  private mockRBNInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  // Mock callsigns and locations for demo
  private mockStations = [
    { call: 'JA1ABC', grid: 'PM95' },
    { call: 'VK2DEF', grid: 'QF56' },
    { call: 'G0XYZ', grid: 'IO91' },
    { call: 'W6TEST', grid: 'CM87' },
    { call: 'PY2BR', grid: 'GG66' },
    { call: 'UA9CDV', grid: 'LP53' },
    { call: 'ZS6DN', grid: 'KG44' },
    { call: 'VU2ESE', grid: 'MK82' },
  ];

  private frequencies = [
    3505.5, 3525.0, 3535.5, 3545.0,
    7005.0, 7015.5, 7025.0, 7035.5,
    14005.5, 14015.0, 14025.5, 14035.0,
    21005.0, 21015.5, 21025.0, 21035.5,
    28005.5, 28015.0, 28025.5, 28035.0,
  ];

  connect() {
    if (this.isConnected) return;
    
    this.isConnected = true;
    store.dispatch(setConnected(true));
    
    // Simulate DX spots
    this.mockDXInterval = setInterval(() => {
      this.generateMockDXSpot();
    }, 15000); // New spot every 15 seconds
    
    // Simulate RBN spots
    this.mockRBNInterval = setInterval(() => {
      this.generateMockRBNSpot();
    }, 5000); // New RBN spot every 5 seconds
    
    // Generate initial spots
    for (let i = 0; i < 5; i++) {
      this.generateMockDXSpot();
      this.generateMockRBNSpot();
    }
  }

  disconnect() {
    if (this.mockDXInterval) {
      clearInterval(this.mockDXInterval);
      this.mockDXInterval = null;
    }
    
    if (this.mockRBNInterval) {
      clearInterval(this.mockRBNInterval);
      this.mockRBNInterval = null;
    }
    
    this.isConnected = false;
    store.dispatch(setConnected(false));
  }

  private generateMockDXSpot() {
    const station = this.mockStations[Math.floor(Math.random() * this.mockStations.length)];
    const spotter = this.mockStations[Math.floor(Math.random() * this.mockStations.length)];
    const frequency = this.frequencies[Math.floor(Math.random() * this.frequencies.length)];
    
    const comments = [
      'CQ TEST', 'UP 2', '599 CA', 'QSX 7040', 'CQ DX', 'CQ NA', 'CQ AS',
      'loud', 'weak sig', 'calling CQ', 'contest', 'RTTY up 1'
    ];
    
    const userGrid = store.getState().settings.settings.gridSquare || 'FN20';
    const stationLoc = gridSquareToLatLon(station.grid);
    
    let distance: number | undefined;
    let bearing: number | undefined;
    
    if (stationLoc) {
      distance = calculateDistance(userGrid, station.grid) || undefined;
      bearing = calculateBearing(userGrid, station.grid) || undefined;
    }
    
    const spot: any = {
      id: uuidv4(),
      spotter: spotter.call,
      frequency: frequency / 1000,
      call: station.call,
      comment: comments[Math.floor(Math.random() * comments.length)],
      time: new Date().toISOString(),
      band: this.frequencyToBand(frequency / 1000),
      mode: 'CW',
      latitude: stationLoc?.lat,
      longitude: stationLoc?.lon,
      distance,
      bearing,
    };
    
    store.dispatch(addDXSpot(spot));
  }

  private generateMockRBNSpot() {
    const station = this.mockStations[Math.floor(Math.random() * this.mockStations.length)];
    const frequency = this.frequencies[Math.floor(Math.random() * this.frequencies.length)];
    
    const userGrid = store.getState().settings.settings.gridSquare || 'FN20';
    const stationLoc = gridSquareToLatLon(station.grid);
    
    const spot: any = {
      id: uuidv4(),
      spotter: `SK3W-#`,
      frequency: frequency / 1000,
      call: station.call,
      snr: Math.floor(Math.random() * 30) + 10,
      speed: Math.floor(Math.random() * 15) + 20,
      time: new Date().toISOString(),
      band: this.frequencyToBand(frequency / 1000),
      latitude: stationLoc?.lat,
      longitude: stationLoc?.lon,
    };
    
    store.dispatch(addRBNSpot(spot));
  }

  private frequencyToBand(freq: number): string {
    if (freq >= 3.5 && freq <= 4.0) return '80m';
    if (freq >= 7.0 && freq <= 7.3) return '40m';
    if (freq >= 14.0 && freq <= 14.35) return '20m';
    if (freq >= 21.0 && freq <= 21.45) return '15m';
    if (freq >= 28.0 && freq <= 29.7) return '10m';
    return '';
  }
}

// Export singleton instance
export const clusterService = new ClusterService();

// Auto-connect on app start (for demo)
setTimeout(() => {
  clusterService.connect();
}, 2000);
