import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  exportADI: (qsos: any[]) => ipcRenderer.invoke('export-adi', qsos),
  importADI: () => ipcRenderer.invoke('import-adi'),
  openLogLocation: () => ipcRenderer.invoke('open-log-location'),
  saveQSOs: (qsos: any[]) => ipcRenderer.invoke('save-qsos', qsos),
  getQSOs: () => ipcRenderer.invoke('get-qsos'),
  
  onMenuAction: (callback: (action: string) => void) => {
    const channels = [
      'menu-new-log',
      'menu-open-log',
      'menu-import-adi',
      'menu-export-adi',
      'menu-toggle-dx-cluster',
      'menu-toggle-map',
      'menu-start-contest',
      'menu-end-contest',
      'menu-contest-settings'
    ];
    
    channels.forEach(channel => {
      ipcRenderer.on(channel, () => callback(channel));
    });
  }
});
