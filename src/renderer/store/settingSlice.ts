import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Settings {
  callsign: string;
  gridSquare: string;
  name: string;
  qth: string;
  contestMode: string;
  dxClusterUrl: string;
  rbnUrl: string;
  autoTime: boolean;
  soundEnabled: boolean;
  cwSpeed: number;
  rigInterface: string;
  theme: 'light' | 'dark';
}

interface SettingsState {
  settings: Settings;
  isLoading: boolean;
}

const initialState: SettingsState = {
  settings: {
    callsign: '',
    gridSquare: '',
    name: '',
    qth: '',
    contestMode: 'CQ WW',
    dxClusterUrl: 'telnet://dxc.nc7j.com:7373',
    rbnUrl: 'telnet://telnet.reversebeacon.net:7000',
    autoTime: true,
    soundEnabled: true,
    cwSpeed: 25,
    rigInterface: 'none',
    theme: 'dark',
  },
  isLoading: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<Settings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    loadSettings: (state, action: PayloadAction<Settings>) => {
      state.settings = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    toggleTheme: (state) => {
      state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { updateSettings, loadSettings, setLoading, toggleTheme } = settingsSlice.actions;
export default settingsSlice.reducer;
