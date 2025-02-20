const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  // Add any required API methods here
})
