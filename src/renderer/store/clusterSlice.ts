import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DXSpot {
  id: string;
  spotter: string;
  frequency: number;
  call: string;
  comment: string;
  time: string;
  band: string;
  mode: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  bearing?: number;
}

export interface RBNSpot {
  id: string;
  spotter: string;
  frequency: number;
  call: string;
  snr: number;
  speed: number;
  time: string;
  band: string;
  latitude?: number;
  longitude?: number;
}

interface ClusterState {
  dxSpots: DXSpot[];
  rbnSpots: RBNSpot[];
  isConnected: boolean;
  showDXCluster: boolean;
  showRBN: boolean;
  showMap: boolean;
  showPropagation: boolean;
  filters: {
    bands: string[];
    modes: string[];
    continents: string[];
    minDistance: number;
    onlyNeeded: boolean;
  };
}

const initialState: ClusterState = {
  dxSpots: [],
  rbnSpots: [],
  isConnected: false,
  showDXCluster: true,
  showRBN: true,
  showMap: true,
  showPropagation: true,
  filters: {
    bands: ['160m', '80m', '40m', '20m', '15m', '10m'],
    modes: ['CW', 'SSB', 'RTTY'],
    continents: ['NA', 'SA', 'EU', 'AF', 'AS', 'OC'],
    minDistance: 0,
    onlyNeeded: false,
  },
};

const clusterSlice = createSlice({
  name: 'cluster',
  initialState,
  reducers: {
    addDXSpot: (state, action: PayloadAction<DXSpot>) => {
      state.dxSpots.unshift(action.payload);
      if (state.dxSpots.length > 100) {
        state.dxSpots.pop();
      }
    },
    addRBNSpot: (state, action: PayloadAction<RBNSpot>) => {
      state.rbnSpots.unshift(action.payload);
      if (state.rbnSpots.length > 200) {
        state.rbnSpots.pop();
      }
    },
    clearDXSpots: (state) => {
      state.dxSpots = [];
    },
    clearRBNSpots: (state) => {
      state.rbnSpots = [];
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    toggleDXCluster: (state) => {
      state.showDXCluster = !state.showDXCluster;
    },
    toggleRBN: (state) => {
      state.showRBN = !state.showRBN;
    },
    toggleMap: (state) => {
      state.showMap = !state.showMap;
    },
    togglePropagation: (state) => {
      state.showPropagation = !state.showPropagation;
    },
    updateFilters: (state, action: PayloadAction<Partial<ClusterState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  addDXSpot,
  addRBNSpot,
  clearDXSpots,
  clearRBNSpots,
  setConnected,
  toggleDXCluster,
  toggleRBN,
  toggleMap,
  togglePropagation,
  updateFilters,
} = clusterSlice.actions;

export default clusterSlice.reducer;
