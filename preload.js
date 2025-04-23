const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

// Memory monitoring
function getMemoryInfo() {
  const processMemory = process.memoryUsage();
  return {
    process: {
      heapUsed: processMemory.heapUsed,
      heapTotal: processMemory.heapTotal,
      external: processMemory.external,
      rss: processMemory.rss
    },
    system: {
      total: os.totalmem(),
      free: os.freemem()
    }
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
    setWindowState: (bounds) => ipcRenderer.send('setWindowState', bounds)
  }
);

// Set up periodic memory monitoring
setInterval(() => {
  const memInfo = getMemoryInfo();
  // Check memory thresholds
  if (memInfo.process.heapUsed > 0.8 * memInfo.process.heapTotal) {
    global.gc && global.gc(); // Trigger garbage collection if available
  }
  ipcRenderer.send('memoryInfo', memInfo);
}, 30000); // Check every 30 seconds