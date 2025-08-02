import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ContestState {
  isActive: boolean;
  contestName: string;
  startTime: string | null;
  endTime: string | null;
  score: {
    qsos: number;
    points: number;
    multipliers: number;
    total: number;
  };
  rates: {
    last10: number;
    last60: number;
    total: number;
  };
  bands: string[];
  exchange: string;
  serialNumber: number;
}

const initialState: ContestState = {
  isActive: false,
  contestName: '',
  startTime: null,
  endTime: null,
  score: {
    qsos: 0,
    points: 0,
    multipliers: 0,
    total: 0,
  },
  rates: {
    last10: 0,
    last60: 0,
    total: 0,
  },
  bands: ['160m', '80m', '40m', '20m', '15m', '10m'],
  exchange: '599',
  serialNumber: 1,
};

const contestSlice = createSlice({
  name: 'contest',
  initialState,
  reducers: {
    startContest: (state, action: PayloadAction<{ name: string; exchange: string }>) => {
      state.isActive = true;
      state.contestName = action.payload.name;
      state.exchange = action.payload.exchange;
      state.startTime = new Date().toISOString();
      state.serialNumber = 1;
      state.score = {
        qsos: 0,
        points: 0,
        multipliers: 0,
        total: 0,
      };
    },
    endContest: (state) => {
      state.isActive = false;
      state.endTime = new Date().toISOString();
    },
    updateScore: (state, action: PayloadAction<Partial<ContestState['score']>>) => {
      state.score = { ...state.score, ...action.payload };
      state.score.total = state.score.points * state.score.multipliers;
    },
    updateRates: (state, action: PayloadAction<Partial<ContestState['rates']>>) => {
      state.rates = { ...state.rates, ...action.payload };
    },
    incrementSerial: (state) => {
      state.serialNumber += 1;
    },
    setExchange: (state, action: PayloadAction<string>) => {
      state.exchange = action.payload;
    },
  },
});

export const {
  startContest,
  endContest,
  updateScore,
  updateRates,
  incrementSerial,
  setExchange,
} = contestSlice.actions;

export default contestSlice.reducer;
