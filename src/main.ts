import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
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

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

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
