const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getLogoPath: () => ipcRenderer.invoke('get-logo-path')
});
