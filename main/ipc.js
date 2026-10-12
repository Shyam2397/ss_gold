const { ipcMain, shell } = require('electron');
const os = require('os');
const log = require('electron-log');

const { state, getBackendBaseUrl } = require('./state');
const {
  getLogoPath,
  writeSplashBrandingCache,
  getCompanyDetailsFromBackend
} = require('./infrastructure');
const { revealApplication } = require('./windows');
const printing = require('./printing');

function registerIpcHandlers() {
  ipcMain.on('toMain', (event, data) => {
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      state.mainWindow.webContents.send('fromMain', data);
    }
  });

  ipcMain.on('memoryInfo', (event, memoryInfo) => {
    if (memoryInfo.process.heapUsed > 0.9 * memoryInfo.process.heapTotal) {
      log.warn('High memory usage detected');
      if (global.gc) global.gc();
    }
  });

  ipcMain.handle('getWindowState', () => {
    return state.mainWindow.getBounds();
  });

  ipcMain.on('setWindowState', (event, bounds) => {
    state.mainWindow.setBounds(bounds);
  });

  ipcMain.handle('get-api-url', () => {
    return getBackendBaseUrl();
  });

  ipcMain.handle('get-logo-path', () => {
    return getLogoPath();
  });

  ipcMain.handle('get-company-details', () => {
    return getCompanyDetailsFromBackend();
  });

  ipcMain.handle('cache-splash-branding', (_event, details) => {
    writeSplashBrandingCache(details);
    return true;
  });

  ipcMain.on('splash-branding-ready', () => {
    state.splashBrandingReady = true;
    revealApplication();
  });

  ipcMain.on('renderer-content-ready', () => {
    state.contentReady = true;
    revealApplication();
  });

  ipcMain.handle('get-system-memory', () => {
    return {
      total: os.totalmem(),
      free: os.freemem(),
    };
  });

  // ============================================================
  // WHATSAPP SHARING IPC HANDLER
  // ============================================================
  //
  // Hands the pre-filled WhatsApp link to the OS so nothing opens as a new
  // Electron window. The `whatsapp://` scheme is registered by the WhatsApp
  // desktop app, so on those machines the chat is focused directly and silently.
  // If that protocol is not registered, fall back to the wa.me web link, which
  // the default browser handles.
  ipcMain.handle('send-whatsapp', async (_event, payload) => {
    const phoneNumber = String(payload?.phoneNumber || '').replace(/\D/g, '');
    const text = String(payload?.message || '');

    if (!phoneNumber || !text) {
      return { success: false, error: 'Missing phone number or message.' };
    }

    const encodedText = encodeURIComponent(text);
    const candidates = [
      `whatsapp://send?phone=${phoneNumber}&text=${encodedText}`,
      `https://wa.me/${phoneNumber}?text=${encodedText}`
    ];

    for (const url of candidates) {
      try {
        await shell.openExternal(url);
        return { success: true, used: url };
      } catch (error) {
        log.warn(`openExternal failed for ${url.split('?')[0]}:`, error.message);
      }
    }

    return { success: false, error: 'Could not open WhatsApp on this system.' };
  });

  // ============================================================
  // PRINTER MANAGEMENT IPC HANDLERS
  // ============================================================

  ipcMain.handle('get-available-printers', async () => {
    try {
      if (!state.mainWindow) {
        return [];
      }
      const printers = await state.mainWindow.webContents.getPrintersAsync();
      log.info(`Found ${printers.length} available printers`);
      return printers.map(p => ({
        name: p.name,
        displayName: p.displayName || p.name,
        description: p.description || '',
        isDefault: p.isDefault || false,
        status: p.status || 0,
        options: p.options || {}
      }));
    } catch (error) {
      log.error('Error getting printers:', error);
      return [];
    }
  });

  ipcMain.handle('get-printer-settings', () => printing.getPrinterSettings());
  ipcMain.handle('save-printer-settings', printing.updatePrinterSettings);

  ipcMain.handle('silent-print-token', printing.silentPrintToken);
  ipcMain.handle('silent-print-pure-exchange', printing.silentPrintPureExchange);
  ipcMain.handle('silent-print-customer-statement', printing.silentPrintCustomerStatement);
  ipcMain.handle('silent-print-skin-test', printing.silentPrintSkinTest);
  ipcMain.handle('test-print', printing.testPrint);

  // ============================================================
  // END PRINTER MANAGEMENT IPC HANDLERS
  // ============================================================
}

module.exports = { registerIpcHandlers };
