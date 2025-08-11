import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import * as fs from 'fs';

// Performance timing utility for main process
const mainPerfTimer = {
  start: (label: string) => {
    const startTime = process.hrtime.bigint();
    console.log(`🚀 [MAIN] Starting: ${label}`);
    return {
      end: () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to ms
        console.log(`🚀 [MAIN] Completed: ${label} in ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};

const store = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const windowTimer = mainPerfTimer.start('Window creation');
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin'
  });
  
  const loadTimer = mainPerfTimer.start('HTML file loading');
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Time when the renderer is ready
  mainWindow.webContents.once('did-finish-load', () => {
    loadTimer.end();
    windowTimer.end();
  });

  createMenu();
}

function createMenu() {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Log',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-log');
          }
        },
        {
          label: 'Open Log',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-open-log');
          }
        },
        { type: 'separator' },
        {
          label: 'Import ADI',
          accelerator: 'CmdOrCtrl+I',
          click: () => {
            mainWindow?.webContents.send('menu-import-adi');
          }
        },
        {
          label: 'Export to ADI',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('menu-export-adi');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle DX Cluster',
          accelerator: 'CmdOrCtrl+D',
          click: () => {
            mainWindow?.webContents.send('menu-toggle-dx-cluster');
          }
        },
        {
          label: 'Toggle Map',
          accelerator: 'CmdOrCtrl+M',
          click: () => {
            mainWindow?.webContents.send('menu-toggle-map');
          }
        },
        {
          label: 'Toggle Propagation',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            mainWindow?.webContents.send('menu-toggle-propagation');
          }
        },
        { type: 'separator' },
        {
          label: 'Contest Settings',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            mainWindow?.webContents.send('menu-contest-settings');
          }
        },
        {
          label: 'Start Contest',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            mainWindow?.webContents.send('menu-start-contest');
          }
        },
        {
          label: 'End Contest',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow?.webContents.send('menu-end-contest');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const appStartTimer = mainPerfTimer.start('Electron app startup');
app.whenReady().then(() => {
  appStartTimer.end();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('save-settings', async (event, settings) => {
  store.set('settings', settings);
  return { success: true };
});

ipcMain.handle('get-settings', async () => {
  const timer = mainPerfTimer.start('Settings load from store');
  const settings = store.get('settings', {
    callsign: '',
    gridSquare: '',
    contestMode: 'CQ WW',
    dxClusterUrl: 'telnet://dxc.nc7j.com:7373',
    rbnUrl: 'telnet://telnet.reversebeacon.net:7000'
  });
  timer.end();
  return settings;
});

ipcMain.handle('export-adi', async (event, qsos) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: `contest_log_${new Date().toISOString().split('T')[0]}.adi`,
    filters: [
      { name: 'ADI Files', extensions: ['adi', 'adif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (filePath) {
    const adiContent = generateADI(qsos);
    fs.writeFileSync(filePath, adiContent);
    return { success: true, path: filePath };
  }
  return { success: false };
});

function generateADI(qsos: any[]): string {
  let adi = 'ADIF Export from CW Logger\n';
  adi += '<PROGRAMID:9>CW Logger\n';
  adi += '<PROGRAMVERSION:3>1.0\n';
  adi += '<EOH>\n\n';

  qsos.forEach(qso => {
    adi += `<CALL:${qso.call.length}>${qso.call}`;
    adi += `<QSO_DATE:8>${qso.date.replace(/-/g, '')}`;
    adi += `<TIME_ON:6>${qso.time.replace(/:/g, '')}`;
    adi += `<BAND:${qso.band.length}>${qso.band}`;
    adi += `<MODE:2>CW`;
    adi += `<RST_SENT:3>${qso.rstSent}`;
    adi += `<RST_RCVD:3>${qso.rstRcvd}`;
    if (qso.serialSent) adi += `<STX:${qso.serialSent.length}>${qso.serialSent}`;
    if (qso.serialRcvd) adi += `<SRX:${qso.serialRcvd.length}>${qso.serialRcvd}`;
    if (qso.myGridSquare) adi += `<MY_GRIDSQUARE:${qso.myGridSquare.length}>${qso.myGridSquare}`;
    if (qso.gridSquare) adi += `<GRIDSQUARE:${qso.gridSquare.length}>${qso.gridSquare}`;
    if (qso.comment) adi += `<COMMENT:${qso.comment.length}>${qso.comment}`;
    adi += '<EOR>\n\n';
  });

  return adi;
}

ipcMain.handle('save-qsos', async (event, qsos) => {
  store.set('qsos', qsos);
  return { success: true };
});

ipcMain.handle('get-qsos', async () => {
  const timer = mainPerfTimer.start('QSO data load from store');
  const qsos = store.get('qsos', []);
  timer.end();
  return qsos;
});

ipcMain.handle('import-adi', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    filters: [
      { name: 'ADI Files', extensions: ['adi', 'adif'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (filePaths && filePaths[0]) {
    try {
      const adiContent = fs.readFileSync(filePaths[0], 'utf8');
      const qsos = parseADI(adiContent);
      return { success: true, path: filePaths[0], qsos };
    } catch (error) {
      console.error('Error reading ADI file:', error);
      return { success: false, error: 'Failed to read ADI file' };
    }
  }
  return { success: false };
});

ipcMain.handle('open-log-location', async () => {
  try {
    const userDataPath = app.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    await shell.showItemInFolder(configPath);
    return { success: true, path: userDataPath };
  } catch (error) {
    console.error('Error opening log location:', error);
    return { success: false, error: 'Failed to open log location' };
  }
});

// QRZ.com lookup with session management
let qrzSessionKey: string | null = null;
let qrzSessionExpiry: number = 0;

ipcMain.handle('qrz-lookup', async (event, callsign: string, username?: string, password?: string) => {
  try {
    // Check if we have a valid session
    if (!qrzSessionKey || Date.now() > qrzSessionExpiry) {
      if (!username || !password) {
        return { success: false, error: 'QRZ credentials required for first lookup' };
      }
      
      // Get new session key
      const sessionResult = await getQRZSession(username, password);
      if (!sessionResult.success) {
        return sessionResult;
      }
      qrzSessionKey = sessionResult.sessionKey;
      qrzSessionExpiry = Date.now() + (23 * 60 * 60 * 1000); // 23 hours
    }
    
    // Lookup callsign with session key
    if (!qrzSessionKey) {
      return { success: false, error: 'No valid session available' };
    }
    const lookupResult = await lookupQRZCallsign(callsign, qrzSessionKey);
    return lookupResult;
    
  } catch (error) {
    console.error('QRZ lookup error:', error);
    return { success: false, error: 'QRZ lookup failed' };
  }
});

async function getQRZSession(username: string, password: string): Promise<any> {
  try {
    const response = await fetch(`https://xmldata.qrz.com/xml/current/?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&agent=CWLogger/1.0`);
    
    if (!response.ok) {
      return { success: false, error: 'QRZ server error' };
    }
    
    const xmlText = await response.text();
    
    // Parse session key from XML
    const keyMatch = xmlText.match(/<Key>([^<]+)<\/Key>/);
    const errorMatch = xmlText.match(/<Error>([^<]+)<\/Error>/);
    
    if (errorMatch) {
      return { success: false, error: errorMatch[1] };
    }
    
    if (keyMatch) {
      return { success: true, sessionKey: keyMatch[1] };
    }
    
    return { success: false, error: 'Failed to get session key' };
    
  } catch (error) {
    console.error('QRZ session error:', error);
    return { success: false, error: 'Network error during QRZ login' };
  }
}

async function lookupQRZCallsign(callsign: string, sessionKey: string): Promise<any> {
  try {
    const response = await fetch(`https://xmldata.qrz.com/xml/current/?s=${sessionKey}&callsign=${encodeURIComponent(callsign)}`);
    
    if (!response.ok) {
      return { success: false, error: 'QRZ server error' };
    }
    
    const xmlText = await response.text();
    
    // Debug: Log the raw XML response
    console.log(`\n=== QRZ XML Response for ${callsign} ===`);
    console.log(xmlText);
    console.log('=== End XML Response ===\n');
    
    // Parse callsign data from XML
    const errorMatch = xmlText.match(/<Error>([^<]+)<\/Error>/);
    if (errorMatch) {
      return { success: false, error: errorMatch[1] };
    }
    
    // Extract key fields
    const getXMLValue = (tag: string) => {
      const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
      const match = xmlText.match(regex);
      return match ? match[1] : null;
    };
    
    const callData = {
      call: getXMLValue('call'),
      fname: getXMLValue('fname'),
      name: getXMLValue('name'),
      addr1: getXMLValue('addr1'),
      addr2: getXMLValue('addr2'),
      state: getXMLValue('state'),
      country: getXMLValue('country'),
      grid: getXMLValue('grid') || getXMLValue('gridsquare') || getXMLValue('gridSquare'), // Try multiple field names
      cqzone: getXMLValue('cqzone'),
      ituzone: getXMLValue('ituzone'),
      email: getXMLValue('email'),
      lat: getXMLValue('lat'),
      lon: getXMLValue('lon')
    };
    
    // Check if we got valid data
    if (callData.call) {
      console.log('QRZ lookup result for', callsign, ':', {
        call: callData.call,
        name: `${callData.fname || ''} ${callData.name || ''}`.trim(),
        grid: callData.grid,
        country: callData.country,
        addr2: callData.addr2
      });
      return { success: true, data: callData };
    } else {
      return { success: false, error: `No data found for ${callsign}` };
    }
    
  } catch (error) {
    console.error('QRZ callsign lookup error:', error);
    return { success: false, error: 'Network error during callsign lookup' };
  }
}

// Solar data fetching (no CSP restrictions in main process)
ipcMain.handle('fetch-solar-data', async () => {
  try {
    const promises = [
      fetch('https://services.swpc.noaa.gov/json/f107_cm_flux.json').then(r => r.json()),
      fetch('https://services.swpc.noaa.gov/json/planetary_k_index_1m.json').then(r => r.json()),
      fetch('https://services.swpc.noaa.gov/json/sunspot-number.json').then(r => r.json())
    ];

    const [f107Data, kIndexData, sunspotData] = await Promise.all(promises);
    
    console.log('NOAA API Response - F10.7:', f107Data?.slice(0, 2));
    console.log('NOAA API Response - K-Index:', kIndexData?.slice(0, 2));
    console.log('NOAA API Response - Sunspot:', sunspotData?.slice(0, 2));
    
    // Extract the latest values - NOAA APIs return arrays with latest data first
    const latestF107 = f107Data && f107Data.length > 0 ? f107Data[0] : null;
    const latestKIndex = kIndexData && kIndexData.length > 0 ? kIndexData[0] : null;
    const latestSunspot = sunspotData && sunspotData.length > 0 ? sunspotData[0] : null;
    
    // Parse F10.7 solar flux
    const sfi = latestF107?.flux || latestF107?.f107_obs || latestF107?.observed_flux || null;
    
    // Parse K-index (planetary K-index)
    const kIndex = latestKIndex?.kp || latestKIndex?.kp_index || latestKIndex?.planetary_k || null;
    
    // Calculate A-index from K-index (approximate conversion: A ≈ K * 7.5)
    const aIndex = kIndex ? Math.round(parseFloat(kIndex) * 7.5) : null;
    
    // Parse sunspot number
    const sunspotNumber = latestSunspot?.ssn || latestSunspot?.sunspot_number || latestSunspot?.smoothed_ssn || null;

    const solarData = {
      sfi: sfi ? Math.round(parseFloat(sfi)) : null,
      kIndex: kIndex ? Math.round(parseFloat(kIndex)) : null,
      aIndex: aIndex,
      sunspotNumber: sunspotNumber ? Math.round(parseFloat(sunspotNumber)) : null,
      source: 'NOAA'
    };
    
    console.log('Parsed NOAA solar data:', solarData);

    return {
      success: true,
      data: solarData
    };
  } catch (noaaError: any) {
    console.log('NOAA failed, trying HamQSL:', noaaError.message);
    
    // Fallback to HamQSL
    try {
      const response = await fetch('https://www.hamqsl.com/solarxml.php');
      const xmlText = await response.text();
      
      console.log('HamQSL XML response:', xmlText.substring(0, 500));
      
      const parseXMLValue = (tag: string): string | null => {
        const regex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
        const match = xmlText.match(regex);
        return match ? match[1] : null;
      };

      const hamQslData = {
        sfi: Math.round(parseFloat(parseXMLValue('solarflux') || '150')),
        kIndex: Math.round(parseFloat(parseXMLValue('kindex') || '2')),
        aIndex: Math.round(parseFloat(parseXMLValue('aindex') || '15')),
        sunspotNumber: Math.round(parseFloat(parseXMLValue('sunspots') || '50')),
        source: 'HamQSL'
      };
      
      console.log('Parsed HamQSL solar data:', hamQslData);

      return {
        success: true,
        data: hamQslData
      };
    } catch (hamQslError: any) {
      console.log('HamQSL also failed:', hamQslError.message);
      
      // Return estimated values based on current solar cycle (Solar Cycle 25)
      const estimatedData = {
        sfi: 150, // Moderate solar activity
        kIndex: 2, // Quiet geomagnetic conditions
        aIndex: 15, // Quiet to unsettled
        sunspotNumber: 75, // Current cycle activity
        source: 'Estimated'
      };
      
      console.log('Using estimated solar data:', estimatedData);
      
      return {
        success: true, // Changed to true so the widget still works
        data: estimatedData
      };
    }
  }
});

function parseADI(content: string): any[] {
  const qsos: any[] = [];
  const records = content.split('<EOR>');
  
  for (const record of records) {
    if (!record.trim() || record.includes('<EOH>')) continue;
    
    const qso: any = { id: generateQSOId() };
    const fieldRegex = /<(\w+):(\d+)>([^<]*)/gi;
    let match;
    
    while ((match = fieldRegex.exec(record)) !== null) {
      const fieldName = match[1].toLowerCase();
      const fieldValue = match[3];
      
      switch (fieldName) {
        case 'call':
          qso.call = fieldValue;
          break;
        case 'qso_date':
          // Convert YYYYMMDD to YYYY-MM-DD
          qso.date = `${fieldValue.slice(0,4)}-${fieldValue.slice(4,6)}-${fieldValue.slice(6,8)}`;
          break;
        case 'time_on':
          // Convert HHMMSS or HHMM to HH:MM
          if (fieldValue.length === 6) {
            qso.time = `${fieldValue.slice(0,2)}:${fieldValue.slice(2,4)}`;
          } else if (fieldValue.length === 4) {
            qso.time = `${fieldValue.slice(0,2)}:${fieldValue.slice(2,4)}`;
          }
          break;
        case 'band':
          qso.band = fieldValue;
          break;
        case 'freq':
          qso.frequency = parseFloat(fieldValue);
          break;
        case 'mode':
          qso.mode = fieldValue;
          break;
        case 'rst_sent':
          qso.rstSent = fieldValue;
          break;
        case 'rst_rcvd':
          qso.rstRcvd = fieldValue;
          break;
        case 'stx':
          qso.serialSent = fieldValue;
          break;
        case 'srx':
          qso.serialRcvd = fieldValue;
          break;
        case 'my_gridsquare':
          qso.myGridSquare = fieldValue;
          break;
        case 'gridsquare':
          qso.gridSquare = fieldValue;
          break;
        case 'comment':
          qso.comment = fieldValue;
          break;
      }
    }
    
    if (qso.call && qso.date && qso.time) {
      qso.multiplier = false;
      qso.points = 1;
      qsos.push(qso);
    }
  }
  
  return qsos;
}

function generateQSOId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
