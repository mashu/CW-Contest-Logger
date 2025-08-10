import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { RootState, AppDispatch } from './store/store';
import { loadSettings } from './store/settingSlice';
import { loadQSOs, addQSO } from './store/qsoSlice';
import { endContest } from './store/contestSlice';
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
  const contest = useSelector((state: RootState) => state.contest);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [contestOpen, setContestOpen] = React.useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = React.useState(false);

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
        case 'menu-start-contest':
          if (!contest.isActive) {
            setContestOpen(true);
          }
          break;
        case 'menu-end-contest':
          if (contest.isActive) {
            if (window.confirm('Are you sure you want to end the contest?')) {
              dispatch(endContest());
            }
          }
          break;
        case 'menu-new-log':
          if (window.confirm('Are you sure you want to start a new log? This will clear all QSOs.')) {
            dispatch({ type: 'qsos/clearLog' });
            // Explicitly save the cleared state
            window.electronAPI.saveQSOs([]);
          }
          break;
      }
    });
  }, []);

  useEffect(() => {
    // Auto-save QSOs (but not on initial empty state)
    if (initialLoadComplete) {
      window.electronAPI.saveQSOs(qsos);
    }
  }, [qsos, initialLoadComplete]);

  const loadInitialData = async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      dispatch(loadSettings(settings));

      const savedQSOs = await window.electronAPI.getQSOs();
      dispatch(loadQSOs(savedQSOs));
      
      // Mark initial load as complete to enable auto-saving
      setInitialLoadComplete(true);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Still mark as complete even if there's an error to enable auto-saving
      setInitialLoadComplete(true);
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
        <Header 
          onSettingsClick={() => setSettingsOpen(true)}
          onContestClick={() => setContestOpen(true)}
        />
        
        <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main Content Area */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            p: { xs: 1, sm: 1.5, md: 2 },  // Responsive padding
            minWidth: 0  // Allows flex child to shrink below content size
          }}>
            <EntryForm />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Statistics />
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <LogTable />
            </Box>
          </Box>

          {/* Right Sidebar - Responsive width */}
          {(showDXCluster || showMap || showPropagation) && (
            <Box sx={{ 
              width: { xs: 280, sm: 320, md: 360, lg: 400 },  // Responsive width
              display: 'flex', 
              flexDirection: 'column', 
              p: { xs: 0.5, sm: 1, md: 1.5 },  // Reduced padding
              pl: { xs: 0.5, sm: 1, md: 2 },   // Extra left padding for separation
              minWidth: 0  // Allows shrinking
            }}>
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
