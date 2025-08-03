import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import Store from 'electron-store';
import * as fs from 'fs';

const store = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
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

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
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
    },
    {
      label: 'Contest',
      submenu: [
        {
          label: 'Start Contest',
          click: () => {
            mainWindow?.webContents.send('menu-start-contest');
          }
        },
        {
          label: 'End Contest',
          click: () => {
            mainWindow?.webContents.send('menu-end-contest');
          }
        },
        { type: 'separator' },
        {
          label: 'Contest Settings',
          click: () => {
            mainWindow?.webContents.send('menu-contest-settings');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

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
  return store.get('settings', {
    callsign: '',
    gridSquare: '',
    contestMode: 'CQ WW',
    dxClusterUrl: 'telnet://dxc.nc7j.com:7373',
    rbnUrl: 'telnet://telnet.reversebeacon.net:7000'
  });
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
  let adi = 'ADIF Export from CW Contest Logger\n';
  adi += '<PROGRAMID:17>CW Contest Logger\n';
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
  return store.get('qsos', []);
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
