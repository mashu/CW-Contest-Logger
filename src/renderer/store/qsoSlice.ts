import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface QSO {
  id: string;
  call: string;
  date: string;
  time: string;
  band: string;
  frequency: number;
  mode: string;
  rstSent: string;
  rstRcvd: string;
  serialSent?: string;
  serialRcvd?: string;
  myGridSquare?: string;    // Your station's grid square
  gridSquare?: string;      // Contact's grid square  
  dxcc?: number;
  cqZone?: number;
  ituZone?: number;
  comment?: string;
  points: number;
  multiplier: boolean;
}

interface QSOState {
  qsos: QSO[];
  currentQSO: Partial<QSO>;
  duplicateCheck: boolean;
  lastQSOTime: string | null;
}

const initialState: QSOState = {
  qsos: [],
  currentQSO: {
    mode: 'CW',
    rstSent: '599',
    rstRcvd: '599',
  },
  duplicateCheck: true,
  lastQSOTime: null,
};

const qsoSlice = createSlice({
  name: 'qsos',
  initialState,
  reducers: {
    addQSO: (state, action: PayloadAction<QSO>) => {
      state.qsos.push(action.payload);
      state.lastQSOTime = new Date().toISOString();
      // Reset form but preserve operator's grid square 
      state.currentQSO = {
        mode: 'CW',
        rstSent: '599',
        rstRcvd: '599',
        myGridSquare: state.currentQSO.myGridSquare, // Preserve operator's grid
      };
    },
    updateCurrentQSO: (state, action: PayloadAction<Partial<QSO>>) => {
      state.currentQSO = { ...state.currentQSO, ...action.payload };
    },
    deleteQSO: (state, action: PayloadAction<string>) => {
      state.qsos = state.qsos.filter(qso => qso.id !== action.payload);
    },
    updateQSO: (state, action: PayloadAction<QSO>) => {
      const index = state.qsos.findIndex(qso => qso.id === action.payload.id);
      if (index !== -1) {
        state.qsos[index] = action.payload;
      }
    },
    loadQSOs: (state, action: PayloadAction<QSO[]>) => {
      state.qsos = action.payload;
    },
    clearLog: (state) => {
      state.qsos = [];
      state.lastQSOTime = null;
    },
    toggleDuplicateCheck: (state) => {
      state.duplicateCheck = !state.duplicateCheck;
    },
  },
});

export const {
  addQSO,
  updateCurrentQSO,
  deleteQSO,
  updateQSO,
  loadQSOs,
  clearLog,
  toggleDuplicateCheck,
} = qsoSlice.actions;

export default qsoSlice.reducer;
