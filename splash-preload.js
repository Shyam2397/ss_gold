const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getLogoPath: () => ipcRenderer.invoke('get-logo-path'),
  getCompanyDetails: () => ipcRenderer.invoke('get-company-details'),
  notifySplashBrandingReady: () => ipcRenderer.send('splash-branding-ready')
});
