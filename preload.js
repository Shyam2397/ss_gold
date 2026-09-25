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

// Printer management
async function getAvailablePrinters() {
  return ipcRenderer.invoke('get-available-printers');
}

async function getPrinterSettings() {
  return ipcRenderer.invoke('get-printer-settings');
}

async function savePrinterSettings(settings) {
  return ipcRenderer.invoke('save-printer-settings', settings);
}

async function silentPrintToken(htmlContent) {
  return ipcRenderer.invoke('silent-print-token', htmlContent);
}


async function silentPrintPureExchange(htmlContent) {
  return ipcRenderer.invoke('silent-print-pure-exchange', htmlContent);
}

/**
 * silentPrintSkinTest()
 * Sends the skin-test certificate HTML to the main process, which:
 *   1. Renders it to a high-quality A4 PDF via webContents.printToPDF()
 *   2. Forwards the PDF to the selected printer silently via pdf-to-printer
 *
 * @param {string}  htmlContent  - Full HTML string of the certificate
 * @param {string}  [printerName] - Printer name override (optional; falls back
 *                                  to saved settings or system default)
 * @param {number}  [copies]      - Number of copies (optional; default 1)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
async function silentPrintSkinTest(htmlContent, printerName, copies) {
  return ipcRenderer.invoke('silent-print-skin-test', {
    htmlContent,
    printerName,
    copies,
  });
}

async function testPrint(printerType, htmlContent) {
  return ipcRenderer.invoke('test-print', { printerType, htmlContent });
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
    getApiUrl: () => ipcRenderer.invoke('get-api-url'),
    cacheSplashBranding: (details) => ipcRenderer.invoke('cache-splash-branding', details),
    // Printer management
    getAvailablePrinters: () => getAvailablePrinters(),
    getPrinterSettings: () => getPrinterSettings(),
    savePrinterSettings: (settings) => savePrinterSettings(settings),
    silentPrintToken: (htmlContent) => silentPrintToken(htmlContent),
    silentPrintPureExchange: (htmlContent) => silentPrintPureExchange(htmlContent),
    // Skin-test silent print: PDF workflow via pdf-to-printer (A4, high-quality, no dialog)
    silentPrintSkinTest: (htmlContent, printerName, copies) =>
      silentPrintSkinTest(htmlContent, printerName, copies),
    testPrint: (printerType, htmlContent) => testPrint(printerType, htmlContent),
    // Check if we're running in Electron
    isElectron: true
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