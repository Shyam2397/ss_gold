const { contextBridge, ipcRenderer } = require('electron');

// Memory monitoring
async function getMemoryInfo() {
  const processMemory = process.memoryUsage();
  const systemMemory = await ipcRenderer.invoke('get-system-memory');
  return {
    process: {
      heapUsed: processMemory.heapUsed,
      heapTotal: processMemory.heapTotal,
      external: processMemory.external,
      rss: processMemory.rss
    },
    system: systemMemory
  };
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    // IPC communication channels
    send: (channel, data) => {
      const validChannels = ['toMain', 'requestMemoryInfo', 'windowState'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      const validChannels = ['fromMain', 'memoryInfo', 'windowState'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    // Memory monitoring
    getMemoryInfo: () => getMemoryInfo(),
    // Window management
    getWindowState: () => ipcRenderer.invoke('getWindowState'),
    setWindowState: (bounds) => ipcRenderer.send('setWindowState', bounds),
    // API configuration
    getApiUrl: () => ipcRenderer.invoke('get-api-url')
  }
);

// Set up periodic memory monitoring
setInterval(async () => {
  const memInfo = await getMemoryInfo();
  // Check memory thresholds
  if (memInfo.process.heapUsed > 0.8 * memInfo.process.heapTotal) {
    global.gc && global.gc(); // Trigger garbage collection if available
  }
  ipcRenderer.send('memoryInfo', memInfo);
}, 30000); // Check every 30 seconds