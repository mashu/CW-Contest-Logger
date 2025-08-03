import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { RootState, AppDispatch } from './store/store';
import { loadSettings } from './store/settingSlice';
import { loadQSOs, addQSO } from './store/qsoSlice';
import Header from './components/Header';
import LogTable from './components/LogTable';
import EntryForm from './components/EntryForm';
import DXCluster from './components/DXCluster';
import WorldMap from './components/WorldMap';
import Statistics from './components/Statistics';
import SettingsDialog from './components/SettingsDialog';
import ContestDialog from './components/ContestDialog';
import PropagationWidget from './components/PropagationWidget';
import './services/clusterService'; // Initialize cluster service

declare global {
  interface Window {
    electronAPI: {
      saveSettings: (settings: any) => Promise<any>;
      getSettings: () => Promise<any>;
      exportADI: (qsos: any[]) => Promise<any>;
      importADI: () => Promise<any>;
      openLogLocation: () => Promise<any>;
      qrzLookup: (callsign: string, username?: string, password?: string) => Promise<any>;
      saveQSOs: (qsos: any[]) => Promise<any>;
      getQSOs: () => Promise<any>;
      onMenuAction: (callback: (action: string) => void) => void;
      fetchSolarData: () => Promise<any>;
    };
  }
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useSelector((state: RootState) => state.settings.settings.theme);
  const showMap = useSelector((state: RootState) => state.cluster.showMap);
  const showDXCluster = useSelector((state: RootState) => state.cluster.showDXCluster);
  const showPropagation = useSelector((state: RootState) => state.cluster.showPropagation);
  const qsos = useSelector((state: RootState) => state.qsos.qsos);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [contestOpen, setContestOpen] = React.useState(false);

  useEffect(() => {
    // Load initial data
    loadInitialData();

    // Listen for menu actions
    window.electronAPI.onMenuAction((action) => {
      switch (action) {
        case 'menu-export-adi':
          handleExportADI();
          break;
        case 'menu-import-adi':
          handleImportADI();
          break;
        case 'menu-open-log':
          handleOpenLog();
          break;
        case 'menu-toggle-dx-cluster':
          dispatch({ type: 'cluster/toggleDXCluster' });
          break;
        case 'menu-toggle-map':
          dispatch({ type: 'cluster/toggleMap' });
          break;
        case 'menu-toggle-propagation':
          dispatch({ type: 'cluster/togglePropagation' });
          break;
        case 'menu-contest-settings':
          setContestOpen(true);
          break;
        case 'menu-new-log':
          if (window.confirm('Are you sure you want to start a new log? This will clear all QSOs.')) {
            dispatch({ type: 'qsos/clearLog' });
          }
          break;
      }
    });
  }, []);

  useEffect(() => {
    // Auto-save QSOs
    if (qsos.length > 0) {
      window.electronAPI.saveQSOs(qsos);
    }
  }, [qsos]);

  const loadInitialData = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      dispatch(loadSettings(settings));

      const savedQSOs = await window.electronAPI.getQSOs();
      dispatch(loadQSOs(savedQSOs));
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleExportADI = async () => {
    try {
      const result = await window.electronAPI.exportADI(qsos);
      if (result.success) {
        alert(`Log exported successfully to: ${result.path}`);
      }
    } catch (error) {
      alert('Error exporting log');
      console.error('Export error:', error);
    }
  };

  const handleImportADI = async () => {
    try {
      const result = await window.electronAPI.importADI();
      if (result.success && result.qsos) {
        const confirmMsg = `Import ${result.qsos.length} QSOs from ${result.path}?\nThis will be added to your current log.`;
        if (window.confirm(confirmMsg)) {
          result.qsos.forEach((qso: any) => dispatch(addQSO(qso)));
          alert(`Successfully imported ${result.qsos.length} QSOs`);
        }
      }
    } catch (error) {
      alert('Error importing ADI file');
      console.error('Import error:', error);
    }
  };

  const handleOpenLog = async () => {
    try {
      const result = await window.electronAPI.openLogLocation();
      if (result.success) {
        alert(`Current log stored at: ${result.path}\nLocation opened in file manager.`);
      }
    } catch (error) {
      alert('Error opening log location');
      console.error('Open log error:', error);
    }
  };

  const muiTheme = createTheme({
    palette: {
      mode: theme,
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: theme === 'dark' ? '#0a0a0a' : '#fafafa',
        paper: theme === 'dark' ? '#1a1a1a' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Segoe UI", "Arial", sans-serif',
      h6: {
        fontWeight: 600,
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header onSettingsClick={() => setSettingsOpen(true)} />
        
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main Content Area */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
            <EntryForm />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Statistics />
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <LogTable />
            </Box>
          </Box>

          {/* Right Sidebar */}
          {(showDXCluster || showMap || showPropagation) && (
            <Box sx={{ width: 400, display: 'flex', flexDirection: 'column', p: 2 }}>
              {/* Propagation Widget */}
              {showPropagation && (
                <Box sx={{ mb: (showMap || showDXCluster) ? 2 : 0 }}>
                  <PropagationWidget />
                </Box>
              )}
              
              {/* Calculate heights based on visible components */}
              {(() => {
                const visibleCount = [showPropagation, showMap, showDXCluster].filter(Boolean).length;
                const remainingComponents = [showMap, showDXCluster].filter(Boolean).length;
                
                // Heights when propagation is visible
                if (showPropagation && remainingComponents === 2) {
                  // All three visible: propagation takes ~40%, map and dx get 30% each
                  return (
                    <>
                      {showMap && (
                        <Box sx={{ height: '30%', mb: showDXCluster ? 2 : 0 }}>
                          <WorldMap />
                        </Box>
                      )}
                      {showDXCluster && (
                        <Box sx={{ height: '30%' }}>
                          <DXCluster />
                        </Box>
                      )}
                    </>
                  );
                } else if (showPropagation && remainingComponents === 1) {
                  // Propagation + one other: other gets ~60%
                  return (
                    <>
                      {showMap && (
                        <Box sx={{ height: '60%' }}>
                          <WorldMap />
                        </Box>
                      )}
                      {showDXCluster && (
                        <Box sx={{ height: '60%' }}>
                          <DXCluster />
                        </Box>
                      )}
                    </>
                  );
                } else {
                  // No propagation widget, original layout
                  return (
                    <>
                      {showMap && (
                        <Box sx={{ height: showDXCluster ? '50%' : '100%', mb: showDXCluster ? 2 : 0 }}>
                          <WorldMap />
                        </Box>
                      )}
                      {showDXCluster && (
                        <Box sx={{ height: showMap ? '50%' : '100%' }}>
                          <DXCluster />
                        </Box>
                      )}
                    </>
                  );
                }
              })()}
            </Box>
          )}
        </Box>
      </Box>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ContestDialog open={contestOpen} onClose={() => setContestOpen(false)} />
    </ThemeProvider>
  );
}

export default App;
