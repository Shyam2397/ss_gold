const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const fetch = require('node-fetch');
// pdf-to-printer: sends a PDF file directly to a Windows printer with no dialog
const pdfToPrinter = require('pdf-to-printer');
// devmode-helper: Windows DEVMODE manipulation for real paper type selection
const devmodeHelper = require('./devmode-helper');

// Add logging utility
const log = require('electron-log');
log.transports.file.level = 'info';
log.info('App starting...');
log.info(`app.isPackaged: ${app.isPackaged}`);

// Add this with other global variables at the top of the file
let isQuitting = false;

// Default printer settings – thermal token/receipt printer
const DEFAULT_TOKEN_PRINTER_SETTINGS = {
  printerName: '',
  paperSource: '',
  documentSize: '80mm',
  orientation: 'portrait',
  paperType: '',
  quality: 'high',
  color: 'monochrome',
  copies: 1,
  silentMode: true
};

// Default printer settings – skin-test certificate (A4 colour printer)
// Explicit defaults below drive two layers of the colour pipeline:
//   1. Chromium's printToPDF() (vector / colour-space accurate)
//   2. pdf-to-printer → SumatraPDF driver hints (color=yes, quality=high, paper-type)
const DEFAULT_SKIN_TEST_PRINTER_SETTINGS = {
  printerName: '',
  paperSource: '',
  documentSize: 'A4',
  orientation: 'portrait',
  paperType: 'plain',
  quality: 'high',
  color: 'color',
  copies: 1,
  silentMode: true
};

// Persistent settings file path
const getSettingsFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'printer-settings.json');
};

// Load settings from file
const loadSettingsFromFile = () => {
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    log.error('Error loading printer settings from file:', error);
  }
  return null;
};

// Save settings to file
const saveSettingsToFile = (settings) => {
  try {
    const filePath = getSettingsFilePath();
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    log.error('Error saving printer settings to file:', error);
    return false;
  }
};

// Initialize printer settings – merges persisted file values over defaults for each printer key
const initPrinterSettings = () => {
  const savedSettings = loadSettingsFromFile();
  return {
    tokenPrinter: {
      ...DEFAULT_TOKEN_PRINTER_SETTINGS,
      ...(savedSettings?.tokenPrinter || {})
    },
    // Skin-test A4 printer settings, persisted independently from the token printer
    skinTestPrinter: {
      ...DEFAULT_SKIN_TEST_PRINTER_SETTINGS,
      ...(savedSettings?.skinTestPrinter || {})
    }
  };
};

let printerSettings = initPrinterSettings();
log.info('Printer settings initialized:', JSON.stringify(printerSettings, null, 2));

// Simple in-memory store implementation
const memoryStore = {
  data: {
    windowState: {
      width: 1200,
      height: 800,
      x: null,
      y: null
    }
  },
  get: function(key, defaultValue) {
    const keys = key.split('.');
    let value = this.data;
    
    for (const k of keys) {
      if (value === null || typeof value !== 'object') {
        return defaultValue;
      }
      value = value[k];
      if (value === undefined) {
        return defaultValue;
      }
    }
    return value !== undefined ? value : defaultValue;
  },
  set: function(key, value) {
    const keys = key.split('.');
    let current = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k] || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]] = value;
  },
  delete: function(key) {
    const keys = key.split('.');
    let current = this.data;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
      if (!current || typeof current !== 'object') {
        return;
      }
    }
    
    delete current[keys[keys.length - 1]];
  }
};

// Set store to use our in-memory implementation
const store = memoryStore;
log.info('Using in-memory store');

// Enable garbage collection exposure
app.commandLine.appendSwitch('js-flags', '--expose-gc');

let mainWindow;
let backendServer;
let viteServer;
let splashWindow;
let productionServerPort;
let backendPort;
let backendReadyPromise;
let mainWindowReady = false;
let splashBrandingReady = false;
let splashRevealed = false;
let splashRevealTimer;

// Update port constants and add max retry
const PORTS = {
  VITE: 3000,
  SERVER: 3001,
  MAX_RETRY: 10
};

const getBackendBaseUrl = () => {
  if (!backendPort) return null;
  return `http://127.0.0.1:${backendPort}`;
};

const normalizeSplashBranding = (details) => {
  const name = typeof details?.name === 'string' ? details.name.trim() : '';
  const logo = typeof details?.logo === 'string' ? details.logo.trim() : '';
  const tagline = typeof details?.tagline === 'string' ? details.tagline.trim() : '';
  if (!name && !logo) return null;
  return { name, logo, tagline };
};

const getSplashBrandingCachePath = () => path.join(app.getPath('userData'), 'splash-branding.json');

const readSplashBrandingCache = () => {
  try {
    const cachePath = getSplashBrandingCachePath();
    if (!fs.existsSync(cachePath)) return null;
    return normalizeSplashBranding(JSON.parse(fs.readFileSync(cachePath, 'utf8')));
  } catch (error) {
    log.warn('Failed to read splash branding cache:', error);
    return null;
  }
};

const writeSplashBrandingCache = (details) => {
  const normalized = normalizeSplashBranding(details);
  const cachePath = getSplashBrandingCachePath();
  try {
    if (!normalized) {
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);
      return;
    }
    fs.writeFileSync(cachePath, JSON.stringify(normalized), 'utf8');
  } catch (error) {
    log.warn('Failed to write splash branding cache:', error);
  }
};

// Window state management
function getWindowState() {
  const defaultState = {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined
  };
  return store.get('windowState', defaultState);
}

function saveWindowState() {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.isMaximized()) {
      store.set('windowState', mainWindow.getBounds());
    }
    store.set('isMaximized', mainWindow.isMaximized());
  } catch (error) {
    log.error('Error saving window state:', error);
  }
}

// Add port checking function
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Add function to find available port
async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + PORTS.MAX_RETRY; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found between ${startPort} and ${startPort + PORTS.MAX_RETRY}`);
}

// Add performance monitoring
const metrics = {
  startupTime: 0,
  lastGC: Date.now(),
  performanceHistory: [],
  startMeasure: (label) => {
    performance.mark(`${label}-start`);
  },
  endMeasure: (label) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const duration = performance.getEntriesByName(label)[0].duration;
    metrics.performanceHistory.push({ label, duration, timestamp: Date.now() });
    return duration;
  }
};

// Enhanced memory management
function monitorMemory() {
  const memoryUsage = process.memoryUsage();
  const usage = {
    heap: memoryUsage.heapUsed / memoryUsage.heapTotal,
    rss: memoryUsage.rss / (1024 * 1024 * 1024), // GB
    time: Date.now()
  };

  // Aggressive GC if memory usage is high
  if (usage.heap > 0.85 || usage.rss > 1.5) {
    if (Date.now() - metrics.lastGC > 30000) { // Prevent too frequent GC
      log.warn(`High memory usage - Heap: ${Math.round(usage.heap * 100)}%, RSS: ${usage.rss.toFixed(2)}GB`);
      if (global.gc) {
        metrics.startMeasure('gc');
        global.gc();
        const gcTime = metrics.endMeasure('gc');
        log.info(`Garbage collection completed in ${gcTime}ms`);
        metrics.lastGC = Date.now();
      }
    }
  }

  // Store metrics
  metrics.performanceHistory = metrics.performanceHistory.slice(-100); // Keep last 100 entries
  return usage;
}

// Startup optimization
async function waitForServer(url, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetch(url);
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  return false;
}

// Correct server startup function
async function startServers() {
  metrics.startMeasure('servers-startup');
  try {
    log.info('Starting servers...');

    if (!app.isPackaged) {
      const externalViteUrl = process.env.ELECTRON_START_URL;
      if (externalViteUrl) {
        const externalBackendUrl = process.env.ELECTRON_BACKEND_URL || 'http://localhost:5009';
        const viteEndpoint = new URL(externalViteUrl);
        const backendEndpoint = new URL(externalBackendUrl);
        PORTS.VITE = Number(viteEndpoint.port) || (viteEndpoint.protocol === 'https:' ? 443 : 80);
        PORTS.SERVER = Number(backendEndpoint.port) || (backendEndpoint.protocol === 'https:' ? 443 : 80);
        backendPort = PORTS.SERVER;
        log.info(`Using externally managed development servers - Vite: ${viteEndpoint.origin}, Server: ${backendEndpoint.origin}`);
        const [viteReady, serverReady] = await Promise.all([
          waitForServer(viteEndpoint.toString()),
          waitForServer(backendEndpoint.toString()),
        ]);
        if (!viteReady || !serverReady) {
          throw new Error('External development servers failed to start in time');
        }
        const startupTime = metrics.endMeasure('servers-startup');
        log.info(`Servers started in ${startupTime}ms`);
        return;
      }

      // In development, start both Vite and backend servers
      await Promise.all([killPort(PORTS.VITE), killPort(PORTS.SERVER)]);
      log.info('Existing development ports cleaned');

      const [vitePort, serverPort] = await Promise.all([
        findAvailablePort(PORTS.VITE),
        findAvailablePort(PORTS.SERVER),
      ]);
      log.info(`Found available ports - Vite: ${vitePort}, Server: ${serverPort}`);

      PORTS.VITE = vitePort;
      PORTS.SERVER = serverPort;
      backendPort = serverPort;

      await Promise.all([
        new Promise((resolve, reject) => {
          backendServer = spawn('node', [path.join(__dirname, 'server', 'server.js')], {
            stdio: 'pipe',
            cwd: path.join(__dirname, 'server'),
            shell: true,
            windowsHide: true,
            env: { ...process.env, PORT: backendPort },
          });
          backendServer.stdout.on('data', (data) => log.info(`[Backend]: ${data}`));
          backendServer.stderr.on('data', (data) => log.error(`[Backend Error]: ${data}`));
          backendServer.on('error', reject);
          backendServer.on('spawn', () => {
            log.info('Backend server spawned');
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          const viteCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
          viteServer = spawn(viteCommand, ['run', 'dev', '--', '--port', vitePort], {
            stdio: 'pipe',
            cwd: path.join(__dirname, 'client'),
            shell: true,
            windowsHide: true,
          });
          viteServer.stdout.on('data', (data) => log.info(`[Vite]: ${data}`));
          viteServer.stderr.on('data', (data) => log.error(`[Vite Error]: ${data}`));
          viteServer.on('error', reject);
          viteServer.on('spawn', () => {
            log.info('Vite server spawned');
            resolve();
          });
        }),
      ]);

      log.info('All development servers started');

      const [viteReady, serverReady] = await Promise.all([
        waitForServer(`http://localhost:${PORTS.VITE}`),
        waitForServer(`http://localhost:${PORTS.SERVER}`),
      ]);

      if (!viteReady || !serverReady) {
        throw new Error('Development servers failed to start in time');
      }
    } else {
      // In production, only start the backend server
      productionServerPort = await findAvailablePort(PORTS.SERVER);
      backendPort = productionServerPort;
      log.info(`Production server port: ${productionServerPort}`);

      const serverPath = app.isPackaged
        ? path.join(process.resourcesPath, 'server', 'server.js')
        : path.join(__dirname, 'server', 'server.js');
      const serverDir = path.dirname(serverPath);
      const serverCommand = app.isPackaged ? process.execPath : 'node';

      log.info(`Starting production server from: ${serverPath}`);
      log.info(`Working directory for server: ${serverDir}`);

      backendServer = spawn(serverCommand, [serverPath], {
        cwd: serverDir,
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          PORT: backendPort,
          NODE_ENV: 'production',
          ...(app.isPackaged ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
        },
      });

      backendServer.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) log.info(`[Backend]: ${output}`);
      });

      backendServer.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) log.error(`[Backend Error]: ${error}`);
      });

      backendServer.on('error', (err) => {
        log.error('Failed to start backend server:', err);
      });

      backendServer.on('close', (code) => {
        log.info(`Backend server process exited with code ${code}`);
      });

      backendServer.on('spawn', () => {
        log.info('Backend server spawned for production');
      });

      if (!(await waitForServer(`http://localhost:${productionServerPort}`))) {
        throw new Error('Production server failed to start in time');
      }
      log.info('Production server is ready.');
    }

    const startupTime = metrics.endMeasure('servers-startup');
    log.info(`Servers started in ${startupTime}ms`);
  } catch (error) {
    log.error('Server startup failed:', error);
    throw error;
  }
}

// Crash recovery and state persistence
const stateManager = {
  save: () => {
    try {
      store.set('lastState', {
        metrics: metrics.performanceHistory,
        timestamp: Date.now(),
        windowState: mainWindow ? mainWindow.getBounds() : null
      });
    } catch (error) {
      log.error('Failed to save application state:', error);
    }
  },
  recover: () => {
    try {
      return store.get('lastState');
    } catch (error) {
      log.error('Failed to recover application state:', error);
      return null;
    }
  }
};

function revealApplication() {
  if (splashRevealed || !mainWindowReady || !splashBrandingReady) return;
  if (!mainWindow || mainWindow.isDestroyed()) return;

  splashRevealed = true;
  if (splashRevealTimer) {
    clearTimeout(splashRevealTimer);
    splashRevealTimer = null;
  }
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.destroy();
    splashWindow = null;
  }
  mainWindow.show();
}

function scheduleSplashRevealTimeout() {
  if (splashRevealTimer) return;
  splashRevealTimer = setTimeout(() => {
    splashRevealTimer = null;
    splashBrandingReady = true;
    revealApplication();
  }, 5000);
}

function createSplashWindow() {
  const iconPath = path.join(
    app.isPackaged ? process.resourcesPath : __dirname,
    app.isPackaged ? 'assets/logo.ico' : 'client/src/assets/logo.ico'
  );
  
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'splash-preload.js'),
      contextIsolation: true
    }
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html')).catch((error) => {
    log.error('Failed to load splash screen:', error);
    splashBrandingReady = true;
    revealApplication();
  });
}

async function createWindow() {
  mainWindowReady = false;
  splashRevealed = false;
  if (splashRevealTimer) {
    clearTimeout(splashRevealTimer);
    splashRevealTimer = null;
  }

  const iconPath = path.join(
    app.isPackaged ? process.resourcesPath : __dirname,
    app.isPackaged ? 'assets/logo.ico' : 'client/src/assets/logo.ico'
  );
  
  const windowState = getWindowState();
  mainWindow = new BrowserWindow({
    ...windowState,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // Remove default menu in production
  if (app.isPackaged) {
    mainWindow.setMenuBarVisibility(false);
    mainWindow.setAutoHideMenuBar(true);
  }

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindowReady = true;
    scheduleSplashRevealTimeout();
    revealApplication();
  });

  mainWindow.webContents.on('did-fail-load', () => {
    log.error('Failed to load app');
    if (splashWindow) {
      splashWindow.destroy();
    }
    app.quit();
  });

    const loadURL = !app.isPackaged
    ? `http://localhost:${PORTS.VITE}`
    : `file://${path.join(__dirname, 'client/dist/index.html')}`;

  log.info(`Loading URL: ${loadURL}`);

  try {
    await mainWindow.loadURL(loadURL);

    log.info('URL loaded successfully.');
  } catch (error) {
    log.error('Failed to load URL:', error);
    app.quit();
  }
}

// IPC handlers
ipcMain.on('toMain', (event, data) => {
  mainWindow.webContents.send('fromMain', data);
});

ipcMain.on('memoryInfo', (event, memoryInfo) => {
  if (memoryInfo.process.heapUsed > 0.9 * memoryInfo.process.heapTotal) {
    log.warn('High memory usage detected');
    if (global.gc) global.gc();
  }
});

ipcMain.handle('getWindowState', () => {
  return mainWindow.getBounds();
});

ipcMain.on('setWindowState', (event, bounds) => {
  mainWindow.setBounds(bounds);
});

ipcMain.handle('get-api-url', () => {
  return getBackendBaseUrl();
});

ipcMain.handle('get-logo-path', () => {
  return path.join(
    app.isPackaged ? process.resourcesPath : __dirname,
    app.isPackaged ? 'assets/logo.png' : 'client/src/assets/logo.png'
  );
});

const getCompanyDetailsFromBackend = async () => {
  const cachedBranding = readSplashBrandingCache();
  if (cachedBranding) return cachedBranding;

  for (let attempt = 0; attempt < 40 && !backendPort; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const baseUrl = getBackendBaseUrl();
  if (!baseUrl) return null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    try {
      const res = await fetch(`${baseUrl}/api/company-details`, { signal: controller.signal });
      if (!res.ok) throw new Error(`Company details request failed: ${res.status}`);
      const data = await res.json();
      const branding = normalizeSplashBranding(data);
      if (!branding) return null;
      writeSplashBrandingCache(branding);
      return branding;
    } catch (error) {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  return null;
};

ipcMain.handle('get-company-details', () => {
  return getCompanyDetailsFromBackend();
});

ipcMain.handle('cache-splash-branding', (_event, details) => {
  writeSplashBrandingCache(details);
  return true;
});

ipcMain.on('splash-branding-ready', () => {
  splashBrandingReady = true;
  revealApplication();
});

ipcMain.handle('get-system-memory', () => {
  return {
    total: os.totalmem(),
    free: os.freemem(),
  };
});

// ============================================================
// PRINTER MANAGEMENT IPC HANDLERS
// ============================================================

ipcMain.handle('get-available-printers', async () => {
  try {
    if (!mainWindow) {
      return [];
    }
    const printers = await mainWindow.webContents.getPrintersAsync();
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

ipcMain.handle('get-printer-settings', () => {
  try {
    return { ...printerSettings };
  } catch (error) {
    log.error('Error getting printer settings:', error);
    return {
      tokenPrinter: { ...DEFAULT_TOKEN_PRINTER_SETTINGS },
      skinTestPrinter: { ...DEFAULT_SKIN_TEST_PRINTER_SETTINGS }
    };
  }
});

ipcMain.handle('save-printer-settings', async (event, settings) => {
  try {
    printerSettings = {
      tokenPrinter: {
        ...DEFAULT_TOKEN_PRINTER_SETTINGS,
        ...(settings?.tokenPrinter || {})
      },
      // Persist skin-test printer settings alongside token printer settings
      skinTestPrinter: {
        ...DEFAULT_SKIN_TEST_PRINTER_SETTINGS,
        ...(settings?.skinTestPrinter || {})
      }
    };
    
    const saved = saveSettingsToFile(printerSettings);
    log.info('Printer settings saved:', JSON.stringify(printerSettings, null, 2));
    return { success: saved, settings: { ...printerSettings } };
  } catch (error) {
    log.error('Error saving printer settings:', error);
    return { success: false, error: error.message };
  }
});

// Helper: Map our settings to Electron print options
//
// Quality handling (per project convention):
//   • quality === 'high' / 'best' / undefined → do NOT set printOptions.quality.
//     This lets the printer driver use its native high-DPI / best defaults.
//     Experience shows Electron's hard-coded `quality: 3` can sometimes
//     result in softer output than the driver's native best mode.
//   • quality === 'medium' / 'normal' → printOptions.quality = 2
//   • quality === 'low' / 'draft'     → printOptions.quality = 1
const mapSettingsToPrintOptions = (settings, printerType) => {
  const printOptions = {
    silent: settings.silentMode !== false,
    printBackground: true,
    copies: parseInt(settings.copies) || 1,
  };

  if (settings.printerName) {
    printOptions.deviceName = settings.printerName;
  }

  if (settings.orientation) {
    printOptions.landscape = settings.orientation === 'landscape';
  }

  if (settings.color) {
    printOptions.color = settings.color === 'color';
  }

  const isThermal = printerType === 'token';

  if (isThermal) {
    printOptions.marginsType = 1;
    printOptions.margins = { top: 0, bottom: 0, left: 0, right: 0 };
  }

  if (settings.documentSize) {
    const size = settings.documentSize.toLowerCase();
    if (size === 'a4') {
      printOptions.pageSize = { width: 210000, height: 297000 };
    } else if (size === 'a5') {
      printOptions.pageSize = { width: 148000, height: 210000 };
    } else if (size.includes('80mm') || size.includes('thermal') || size === '80mm') {
      printOptions.pageSize = { width: 80000, height: 150000 };
    } else if (size.includes('58mm')) {
      printOptions.pageSize = { width: 58000, height: 150000 };
    } else if (size === 'letter') {
      printOptions.pageSize = { width: 215900, height: 279400 };
    } else if (size === 'legal') {
      printOptions.pageSize = { width: 215900, height: 355600 };
    }
  }

  const q = (settings.quality || 'high').toLowerCase();
  if (q === 'medium' || q === 'normal' || q === 'standard') {
    printOptions.quality = 2;
  } else if (q === 'low' || q === 'draft' || q === 'economy') {
    printOptions.quality = 1;
  }
  // NOTE: 'high' / 'best' intentionally falls through without setting
  // printOptions.quality — see docstring above.

  return printOptions;
};

const applyPrinterDevmode = async (settings, printLabel) => {
  let printerName = settings?.printerName?.trim();
  if (!printerName && mainWindow) {
    try {
      const printers = await mainWindow.webContents.getPrintersAsync();
      printerName = printers.find((printer) => printer.isDefault)?.name || '';
    } catch (error) {
      log.warn(`[${printLabel}] Could not resolve the system default printer:`, error);
    }
  }

  if (!printerName) {
    log.info(`[${printLabel}] No explicit printer selected; skipping DEVMODE mutation.`);
    return { applied: false, changed: {}, message: 'System default printer selected.' };
  }

  const overrides = {};
  if (settings.paperType && settings.paperType.trim()) overrides.paperType = settings.paperType;
  if (settings.color) overrides.color = settings.color;
  if (settings.orientation) overrides.orientation = settings.orientation;
  if (settings.quality) overrides.quality = settings.quality;
  if (settings.copies != null) overrides.copies = settings.copies;

  if (Object.keys(overrides).length === 0) {
    return { applied: false, changed: {}, message: 'No DEVMODE overrides selected.' };
  }

  log.info(`[${printLabel}] Applying DEVMODE overrides: ${JSON.stringify(overrides)}`);
  const result = await devmodeHelper.applyPrinterDefaults(printerName, overrides);
  if (!result.applied) {
    log.warn(`[${printLabel}] DEVMODE was not applied: ${result.message}`);
  } else {
    log.info(`[${printLabel}] DEVMODE applied: ${result.message}`);
  }
  return result;
};

ipcMain.handle('silent-print-token', async (event, htmlContent) => {
  let printWindow = null;
  try {
    const settings = printerSettings.tokenPrinter;
    log.info(`Starting token print to printer: ${settings.printerName || 'default'}`);
    log.info(`Token print settings: copies=${settings.copies}, silent=${settings.silentMode}`);

    const paperSize = (settings.documentSize || '80mm').toLowerCase();
    const is58mm = paperSize.includes('58mm');
    const contentWidth = is58mm ? 220 : 305;

    printWindow = new BrowserWindow({
      width: contentWidth,
      height: 600,
      useContentSize: true,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
      }
    });

    printWindow.webContents.setZoomLevel(0);

    const printOptions = mapSettingsToPrintOptions(settings, 'token');
    log.info('Mapped print options for token:', JSON.stringify(printOptions));
    await applyPrinterDevmode(settings, 'Token-Print');

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    await new Promise((resolve, reject) => {
      let stylesLoaded = false;
      let loadTimeout;

      // Wait for styles to be fully loaded
      printWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          if (document.readyState === 'complete') {
            // Wait a bit more for fonts to render
            setTimeout(resolve, 500);
          } else {
            window.addEventListener('load', () => {
              setTimeout(resolve, 500);
            });
          }
        });
      `).then(() => {
        stylesLoaded = true;
        clearTimeout(loadTimeout);
        
        printWindow.webContents.print(printOptions, (success, failureReason) => {
          if (success) {
            log.info('Token print completed successfully');
            resolve(true);
          } else {
            log.error(`Token print failed: ${failureReason}`);
            reject(new Error(failureReason || 'Print failed'));
          }
        });
      }).catch((err) => {
        if (!stylesLoaded) {
          reject(new Error(`Failed to wait for styles: ${err.message}`));
        }
      });

      // Timeout fallback
      loadTimeout = setTimeout(() => {
        if (!stylesLoaded) {
          log.warn('Style loading timeout, proceeding with print anyway');
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            if (success) {
              log.info('Token print completed successfully (after timeout)');
              resolve(true);
            } else {
              log.error(`Token print failed: ${failureReason}`);
              reject(new Error(failureReason || 'Print failed'));
            }
          });
        }
      }, 3000);

      printWindow.webContents.once('did-fail-load', (e, ec, em) => {
        clearTimeout(loadTimeout);
        reject(new Error(`Page load failed: ${em} (${ec})`));
      });
    });

    printWindow.destroy();
    printWindow = null;
    return { success: true };
  } catch (error) {
    log.error('Error during token silent print:', error);
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
    }
    return { success: false, error: error.message };
  }
});


ipcMain.handle('silent-print-pure-exchange', async (event, htmlContent) => {
  let printWindow = null;
  try {
    const settings = printerSettings.tokenPrinter; // Use same thermal printer settings as token
    log.info(`Starting pure exchange print to printer: ${settings.printerName || 'default'}`);
    log.info(`Pure exchange print settings: copies=${settings.copies}, silent=${settings.silentMode}`);

    const paperSize = (settings.documentSize || '80mm').toLowerCase();
    const is58mm = paperSize.includes('58mm');
    const contentWidth = is58mm ? 220 : 305;

    printWindow = new BrowserWindow({
      width: contentWidth,
      height: 600,
      useContentSize: true,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
      }
    });

    printWindow.webContents.setZoomLevel(0);

    const printOptions = mapSettingsToPrintOptions(settings, 'token');
    log.info('Mapped print options for pure exchange:', JSON.stringify(printOptions));
    await applyPrinterDevmode(settings, 'PureExchange-Print');

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    await new Promise((resolve, reject) => {
      let stylesLoaded = false;
      let loadTimeout;

      // Wait for styles to be fully loaded
      printWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          if (document.readyState === 'complete') {
            // Wait a bit more for fonts to render
            setTimeout(resolve, 500);
          } else {
            window.addEventListener('load', () => {
              setTimeout(resolve, 500);
            });
          }
        });
      `).then(() => {
        stylesLoaded = true;
        clearTimeout(loadTimeout);
        
        printWindow.webContents.print(printOptions, (success, failureReason) => {
          if (success) {
            log.info('Pure exchange print completed successfully');
            resolve(true);
          } else {
            log.error(`Pure exchange print failed: ${failureReason}`);
            reject(new Error(failureReason || 'Print failed'));
          }
        });
      }).catch((err) => {
        if (!stylesLoaded) {
          reject(new Error(`Failed to wait for styles: ${err.message}`));
        }
      });

      // Timeout fallback
      loadTimeout = setTimeout(() => {
        if (!stylesLoaded) {
          log.warn('Style loading timeout, proceeding with print anyway');
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            if (success) {
              log.info('Pure exchange print completed successfully (after timeout)');
              resolve(true);
            } else {
              log.error(`Pure exchange print failed: ${failureReason}`);
              reject(new Error(failureReason || 'Print failed'));
            }
          });
        }
      }, 3000);

      printWindow.webContents.once('did-fail-load', (e, ec, em) => {
        clearTimeout(loadTimeout);
        reject(new Error(`Page load failed: ${em} (${ec})`));
      });
    });

    printWindow.destroy();
    printWindow = null;
    return { success: true };
  } catch (error) {
    log.error('Error during pure exchange silent print:', error);
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
    }
    return { success: false, error: error.message };
  }
});

// ============================================================
// SKIN TEST SILENT PRINT  –  PDF-based, high-quality workflow
// ============================================================

/**
 * generatePDF()
 * Renders the supplied HTML in a hidden BrowserWindow and exports it as a
 * high-resolution PDF using Electron's webContents.printToPDF().
 *
 * @param {string} htmlContent - Full HTML string to render
 * @param {string} printerName - Target printer name (used for settings lookup)
 * @returns {string} Absolute path to the saved temporary PDF file
 */
async function generatePDF(htmlContent, printerName) {
  let offscreenWindow = null;
  try {
    log.info('[SkinTest-Print] generatePDF() – creating offscreen render window');

    // Create a hidden window sized precisely to A4.
    //   • useContentSize: true  – width/height refer to the render surface, not
    //                              including any window chrome (frame:false makes
    //                              this redundant but we keep it for clarity)
    //   • backgroundColor       – explicitly opaque white so the compositor has
    //                              a known solid backdrop for every pixel; this
    //                              avoids any premultiplied-alpha colour shifts
    //                              when the PDF rasteriser blends transparent pixels
    //   • show / frame          – hidden, frameless
    offscreenWindow = new BrowserWindow({
      width: 794,
      height: 1123,
      useContentSize: true,
      show: false,
      frame: false,
      backgroundColor: '#FFFFFF',
      hasShadow: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
        sandbox: false,
        spellcheck: false,
      },
    });

    // Prevent any accidental visual glitches from animations.
    offscreenWindow.webContents.on('before-input-event', (e) => e.preventDefault());

    // Load the HTML content; data: URI keeps everything self-contained.
    await offscreenWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
      {
        extraHeaders: 'pragma: no-cache\n',
      }
    );

    // Wait for the page (fonts, images, layout) to fully settle.
    // Uses both document.fonts.ready and a fixed delay to cover:
    //   • web-font swap completion  (Poppins / Allura)
    //   • image decoding
    //   • Chromium's composite pass after load
    await offscreenWindow.webContents.executeJavaScript(`
      new Promise(async (resolve) => {
        const settle = () => setTimeout(resolve, 800);
        if (document.readyState === 'complete') {
          try {
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
          } catch (_) { /* ignore – older engines don't expose fonts.ready */ }
          settle();
        } else {
          window.addEventListener('load', async () => {
            try {
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }
            } catch (_) { /* ignore */ }
            settle();
          });
        }
      });
    `);

    log.info('[SkinTest-Print] generatePDF() – page settled, calling printToPDF()');

    // printToPDF options for maximum colour fidelity:
    //   • printBackground   : true  – renders every background colour, image,
    //                                 gradient, and box-shadow
    //   • preferCSSPageSize : true  – honours @page { size: A4 } declared in
    //                                 the HTML, preventing Chromium from
    //                                 overriding the paper size
    //   • pageSize          : 'A4' – explicit fallback if preferCSSPageSize
    //                                 is ignored by the underlying Skia/PDFium
    //   • landscape         : false
    //   • scaleFactor       : 100   – 1:1 scale, no zoom applied (100 = 100%)
    //   • margins.marginType: 1     – Electron enum: 0=default, 1=none,
    //                                 2=minimum. 1 forces zero margins; layout
    //                                 is handled entirely by the HTML/CSS.
    //
    // Chromium internally renders to the PDF using the sRGB colour space; the
    // PDF stream itself is vector/resolution-independent.  Actual raster DPI
    // is determined later by the printer driver when pdf-to-printer submits
    // the job – we just make sure colours are not shifted along the way.
    const pdfData = await offscreenWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4',
      landscape: false,
      scaleFactor: 100,
      margins: {
        marginType: 1,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      displayHeaderFooter: false,
    });

    const tmpDir = app.getPath('userData');
    const tmpPath = path.join(tmpDir, `skin-test-print-${Date.now()}.pdf`);
    fs.writeFileSync(tmpPath, pdfData);

    log.info(`[SkinTest-Print] generatePDF() – PDF saved to: ${tmpPath} (${(pdfData.length / 1024).toFixed(1)} KB)`);

    offscreenWindow.destroy();
    offscreenWindow = null;

    return tmpPath;
  } catch (err) {
    if (offscreenWindow && !offscreenWindow.isDestroyed()) {
      offscreenWindow.destroy();
    }
    log.error('[SkinTest-Print] generatePDF() error:', err);
    throw err;
  }
}

/**
 * printSilent()
 * Sends a PDF file directly to the target printer using pdf-to-printer.
 * No system print dialog is shown (fully silent).
 *
 * pdf-to-printer wraps SumatraPDF.  Beyond the named properties below,
 * arbitrary flags can be injected via the `options` array which are
 * appended directly to the SumatraPDF command line.
 *
 * @param {string} pdfPath       - Path to the temporary PDF file
 * @param {object} printCfg      - Print configuration
 * @param {string} printCfg.printerName  - Printer name ('' = system default)
 * @param {number} printCfg.copies       - Number of copies
 * @param {string} printCfg.quality      - 'high' | 'medium' | 'low'  (saved setting)
 * @param {string} printCfg.color        - 'color' | 'monochrome'      (saved setting)
 * @param {string} printCfg.paperType    - 'plain' | 'photo' | ...    (saved setting, optional)
 * @param {string} printCfg.paperSource  - tray/bin name              (saved setting, optional)
 *
 * IMPORTANT – driver capabilities & reality (2026-09):
 *   • paperType (DEVMODE dmMediaType) CAN now be set via devmode-helper.js
 *     using Win32 DocumentPropertiesW + SetPrinterW APIs. This applies the
 *     paper type to the printer's default DEVMODE before printing.
 *   • Only tokens explicitly listed in SumatraPDF "Printing.md" are used.
 *     Unknown tokens (e.g. "quality=high", "color=yes", "fit=no", "asr=no")
 *     can cause SumatraPDF to ignore the *whole* -print-settings string.
 *     See https://www.sumatrapdfreader.org/docs/Printing.md .
 */
async function printSilent(pdfPath, printCfg) {
  const { printerName, copies, quality, color, paperType, paperSource } = printCfg || {};
  try {
    log.info(
      `[SkinTest-Print] printSilent() – pdf: "${pdfPath}", printer: "${printerName || 'default'}", copies: ${copies}, quality: ${quality}, color: ${color}, paperType: ${paperType || 'n/a'}, paperSource: ${paperSource || 'n/a'}`
    );

    await applyPrinterDevmode({
      printerName,
      paperType,
      color,
      quality,
      copies,
    }, 'SkinTest-Print');

    // Build the standard pdf-to-printer options.  `monochrome: false` is
    // critical: without it many GDI drivers silently fall back to draft /
    // economy greyscale even when the PDF contains vector colour content.
    const options = {
      scale: 'noscale',
      paperSize: 'A4',
      monochrome: color === 'monochrome',
      copies: copies || 1,
      silent: true,
    };

    if (printerName && printerName.trim()) {
      options.printer = printerName.trim();
    }

    if (paperSource && paperSource.trim()) {
      options.bin = paperSource.trim();
    }

    // =========================================================================
    // SumatraPDF -print-settings  (ONLY tokens listed in official docs are used)
    // Docs: https://www.sumatrapdfreader.org/docs/Printing.md#-print-settings-options
    //
    // Tokens we emit — all documented and supported:
    //   • paper=A4                  – reconfirm paper SIZE at driver level
    //                                 (matches our pdf-to-printer paperSize:A4)
    //   • noscale                   – print at 100% (matches scale:'noscale')
    //   • color  |  monochrome      – force colour / grayscale rendering
    //   • disable-auto-rotation     – don't auto-rotate wide pages 90°;
    //                                 prevents an extra resample that can
    //                                 slightly shift colours
    //   • ignore-pdf-print-settings – ignore any embedded ViewerPreferences
    //                                 that would override our settings
    //
    // Tokens NOT emitted here (they are unsupported / non-documented and
    // risk having the whole -print-settings string silently ignored):
    //   • quality=<high|…>  – SumatraPDF exposes NO driver-quality token
    //     (quality is handled by omitting Electron's `quality` enum so the
    //      driver uses its native best DPI default — see mapSettingsToPrintOptions)
    //   • color=yes / color=no      – wrong syntax; use bare "color" / "monochrome"
    //   • fit=no / asr=no           – wrong syntax; use "noscale" /
    //                                  "disable-auto-rotation"
    //   • paper=photo/glossy/plain  – SumatraPDF `paper=` means PAPER SIZE,
    //                                  not MediaType. Paper type (MediaType) is
    //                                  now handled via DEVMODE before this call.
    // =========================================================================
    const driverFlags = [];

    // Colour mode: use the bare documented tokens.
    driverFlags.push(color === 'monochrome' ? 'monochrome' : 'color');

    // Exact sizing + no auto-rotate resample
    driverFlags.push('paper=A4');
    driverFlags.push('noscale');
    driverFlags.push('disable-auto-rotation');

    // Ignore any embedded PDF ViewerPreferences (PrintScaling / PickTrayByPDFSize / etc.)
    // so our explicit settings always win, regardless of how a future PDF was generated.
    driverFlags.push('ignore-pdf-print-settings');

    const settingsStr = driverFlags.join(',');
    log.info(`[SkinTest-Print] printSilent() – SumatraPDF -print-settings: "${settingsStr}" (all tokens are officially documented)`);

    // pdf-to-printer's `options` array receives raw CLI flags.
    options.options = ['-print-settings', settingsStr];

    await pdfToPrinter.print(pdfPath, options);

    log.info('[SkinTest-Print] printSilent() – job submitted successfully');
  } catch (err) {
    log.error('[SkinTest-Print] printSilent() error:', err);
    throw err;
  } finally {
    try {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        log.info(`[SkinTest-Print] printSilent() – temp PDF removed: ${pdfPath}`);
      }
    } catch (cleanupErr) {
      log.warn('[SkinTest-Print] printSilent() – failed to remove temp PDF:', cleanupErr);
    }
  }
}

/**
 * printPage()
 * Orchestrates the full print workflow:
 *   1. generatePDF() – render HTML → PDF (high quality, A4, colour)
 *   2. printSilent() – send PDF to printer silently via pdf-to-printer
 *
 * @param {string} htmlContent - Full HTML of the skin-test certificate
 * @param {object} printCfg    - Print configuration (printerName, copies, quality, color, ...)
 * @returns {{ success: boolean, error?: string }}
 */
async function printPage(htmlContent, printCfg) {
  let pdfPath = null;
  try {
    log.info('[SkinTest-Print] printPage() – starting skin-test silent print workflow');

    pdfPath = await generatePDF(htmlContent, printCfg?.printerName || '');
    await printSilent(pdfPath, printCfg);

    log.info('[SkinTest-Print] printPage() – workflow completed successfully');
    return { success: true };
  } catch (err) {
    log.error('[SkinTest-Print] printPage() – workflow failed:', err);

    if (pdfPath) {
      try {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      } catch (_) { /* ignore secondary cleanup error */ }
    }

    return { success: false, error: err.message };
  }
}

/**
 * IPC handler: 'silent-print-skin-test'
 * Invoked by the renderer (SkinTesting page) with the HTML certificate content.
 * Reads the saved printer settings so the caller doesn't need to pass them.
 *
 * Payload: { htmlContent: string, printerName?: string, copies?: number }
 * Returns: { success: boolean, error?: string }
 */
ipcMain.handle('silent-print-skin-test', async (event, { htmlContent, printerName, copies }) => {
  try {
    const savedSkinTest = printerSettings?.skinTestPrinter || {};
    const savedToken = printerSettings?.tokenPrinter || {};

    const resolvedPrinter =
      printerName ||
      savedSkinTest.printerName ||
      savedToken.printerName ||
      '';

    const resolvedCopies =
      copies ||
      savedSkinTest.copies ||
      1;

    const resolvedQuality = savedSkinTest.quality || 'high';
    const resolvedColor = savedSkinTest.color || 'color';
    const resolvedPaperType = savedSkinTest.paperType || '';
    const resolvedPaperSource = savedSkinTest.paperSource || '';

    log.info(
      `[SkinTest-Print] IPC handler – printer: "${resolvedPrinter}", copies: ${resolvedCopies}, quality: ${resolvedQuality}, color: ${resolvedColor}`
    );

    const printCfg = {
      printerName: resolvedPrinter,
      copies: resolvedCopies,
      quality: resolvedQuality,
      color: resolvedColor,
      paperType: resolvedPaperType,
      paperSource: resolvedPaperSource,
    };

    const result = await printPage(htmlContent, printCfg);
    return result;
  } catch (err) {
    log.error('[SkinTest-Print] IPC handler – unexpected error:', err);
    return { success: false, error: err.message };
  }
});

// ============================================================
// END SKIN TEST SILENT PRINT
// ============================================================

ipcMain.handle('test-print', async (event, { printerType, htmlContent }) => {
  let printWindow = null;
  try {
    const settings = printerType === 'skinTest'
      ? printerSettings.skinTestPrinter
      : printerSettings.tokenPrinter;

    log.info(`Test print for ${printerType} to: ${settings.printerName || 'default'}`);
    log.info(`Test print settings: quality=${settings.quality}, color=${settings.color}, copies=${settings.copies}`);

    const paperSize = (settings.documentSize || (printerType === 'token' ? '80mm' : 'A4')).toLowerCase();
    const is58mm = paperSize.includes('58mm');

    printWindow = new BrowserWindow({
      width: printerType === 'token' ? (is58mm ? 220 : 305) : 900,
      height: printerType === 'token' ? 600 : 1100,
      useContentSize: true,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: printerType !== 'token',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
      }
    });

    printWindow.webContents.setZoomLevel(0);

    // Build print options from the saved settings so quality/color are applied
    const printOptions = mapSettingsToPrintOptions(settings, printerType);
    // For test prints always use silent=false so the system dialog confirms the job
    printOptions.silent = false;
    log.info('Test print options:', JSON.stringify(printOptions));
    await applyPrinterDevmode(settings, `Test-${printerType}`);

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    await new Promise((resolve, reject) => {
      let printed = false;
      let loadTimeout;

      printWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          if (document.readyState === 'complete') {
            setTimeout(resolve, 500);
          } else {
            window.addEventListener('load', () => setTimeout(resolve, 500));
          }
        });
      `).then(() => {
        printed = true;
        clearTimeout(loadTimeout);

        printWindow.webContents.print(printOptions, (success, failureReason) => {
          if (success) {
            log.info('Test print sent successfully');
            resolve(true);
          } else {
            // User cancelled the dialog – treat as non-fatal
            if (failureReason === 'cancelled') {
              log.info('Test print cancelled by user');
              resolve(false);
            } else {
              log.error(`Test print failed: ${failureReason}`);
              reject(new Error(failureReason || 'Print failed'));
            }
          }
        });
      }).catch((err) => {
        if (!printed) reject(new Error(`Failed to prepare test page: ${err.message}`));
      });

      loadTimeout = setTimeout(() => {
        if (!printed) {
          log.warn('Test print load timeout, proceeding anyway');
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            if (success || failureReason === 'cancelled') resolve(success);
            else reject(new Error(failureReason || 'Print failed'));
          });
        }
      }, 3000);

      printWindow.webContents.once('did-fail-load', (e, ec, em) => {
        clearTimeout(loadTimeout);
        reject(new Error(`Page load failed: ${em} (${ec})`));
      });
    });

    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
      printWindow = null;
    }
    return { success: true, message: 'Test print sent to printer' };
  } catch (error) {
    log.error('Error during test print:', error);
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
    }
    return { success: false, error: error.message };
  }
});

// ============================================================
// END PRINTER MANAGEMENT IPC HANDLERS
// ============================================================

function killPort(port) {
  return new Promise((resolve) => {
    const platform = process.platform;
    const cmd = platform === 'win32'
      ? 'netstat -ano -p tcp'
      : `lsof -i :${port} -t`;

    exec(cmd, (error, stdout) => {
      if (error) {
        log.info(`No process found on port ${port}`);
        resolve();
        return;
      }

      const pids = platform === 'win32'
        ? stdout
          .split(/\r?\n/)
          .map((line) => {
            const columns = line.trim().split(/\s+/);
            if (columns.length < 5 || columns[0].toUpperCase() !== 'TCP') return null;
            if (!columns[1].endsWith(`:${port}`) || columns[3].toUpperCase() !== 'LISTENING') return null;
            return Number.parseInt(columns[4], 10);
          })
          .filter((pid) => Number.isInteger(pid) && pid > 0)
        : stdout
          .split(/\r?\n/)
          .map((pid) => Number.parseInt(pid.trim(), 10))
          .filter((pid) => Number.isInteger(pid) && pid > 0);

      const uniquePids = [...new Set(pids)];
      if (uniquePids.length === 0) {
        log.info(`No process found on port ${port}`);
        resolve();
        return;
      }

      Promise.all(uniquePids.map((pid) => new Promise((processResolve) => {
        const killCmd = platform === 'win32' ? `taskkill /F /T /PID ${pid}` : `kill -9 ${pid}`;
        exec(killCmd, (killError) => {
          if (killError) {
            log.warn(`Failed to kill process on port ${port} (PID ${pid}):`, killError.message);
          } else {
            log.info(`Successfully killed process on port ${port} (PID ${pid})`);
          }
          processResolve();
        });
      }))).then(resolve);
    });
  });
}

// Helper function to safely kill a process by PID
const safeKillPid = (pid, name) => {
  return new Promise((resolve) => {
    if (!pid || pid <= 0) {
      log.info(`Invalid PID for ${name}, skipping kill`);
      return resolve();
    }

    log.info(`Terminating ${name} (PID: ${pid})...`);
    
    try {
      const killCmd = process.platform === 'win32' 
        ? `taskkill /F /PID ${pid} /T`
        : `kill -9 ${pid}`;
      
      exec(killCmd, (error) => {
        if (error) {
          // Ignore errors for processes that don't exist or are already dead
          if (error.message.includes('not found') || 
              error.message.includes('No such process') ||
              error.message.includes('No running instance')) {
            log.info(`${name} process already terminated`);
          } else {
            log.warn(`Failed to kill ${name} (PID: ${pid}):`, error.message);
          }
        } else {
          log.info(`Successfully terminated ${name} (PID: ${pid})`);
        }
        resolve();
      });
    } catch (err) {
      log.error(`Error killing ${name} (PID: ${pid}):`, err.message);
      resolve();
    }
  });
};

// Update cleanup function with better handling
async function cleanupProcesses() {
  log.info('Starting cleanup process...');
  
  // Array to store all cleanup promises
  const cleanupTasks = [];

  // Helper function to safely execute cleanup tasks
  const safeCleanup = async (taskName, taskFn) => {
    try {
      log.info(`Starting cleanup: ${taskName}`);
      await taskFn();
      log.info(`Completed cleanup: ${taskName}`);
    } catch (error) {
      log.error(`Error during ${taskName}:`, error.message);
    }
  };

  // 1. Close all windows
  if (mainWindow && !mainWindow.isDestroyed()) {
    const windowToClose = mainWindow;
    cleanupTasks.push(safeCleanup('closing main window', () => {
      windowToClose.removeAllListeners();
      windowToClose.destroy();
      mainWindow = null;
    }));
  }

  if (splashWindow && !splashWindow.isDestroyed()) {
    cleanupTasks.push(safeCleanup('closing splash window', () => {
      splashWindow.destroy();
      splashWindow = null;
    }));
  }

  // 2. Kill backend processes
  if (backendServer) {
    const backendPid = backendServer.pid;
    cleanupTasks.push(safeCleanup('killing backend server', () =>
      safeKillPid(backendPid, 'backend server')
    ));
    backendServer = null;
  }

  // 3. Kill Vite dev server if in development
  if (viteServer && !app.isPackaged) {
    const vitePid = viteServer.pid;
    cleanupTasks.push(safeCleanup('killing Vite server', () =>
      safeKillPid(vitePid, 'Vite server')
    ));
    viteServer = null;
  }

  // Wait for all cleanup tasks to complete with a timeout
  try {
    await Promise.race([
      Promise.all(cleanupTasks),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cleanup timeout')), 5000)
      )
    ]);
  } catch (error) {
    log.warn('Some cleanup tasks timed out or failed:', error.message);
  }

  log.info('Cleanup process completed');
}

// Save window state before quitting
function safeSaveWindowState() {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState();
    }
  } catch (error) {
    log.warn('Failed to save window state:', error.message);
  }
}

// Save application state
let isAppStateValid = true;
let isAppQuitting = false;

function safeSaveAppState() {
  if (!isAppStateValid || isAppQuitting) return;
  
  try {
    if (stateManager && typeof stateManager.save === 'function') {
      stateManager.save();
    } else {
      isAppStateValid = false;
      log.warn('State manager is not available for saving');
    }
  } catch (error) {
    isAppStateValid = false;
    log.warn('Failed to save application state:', error.message);
  }
}

// Handle app quitting
app.on('before-quit', async (event) => {
  // Prevent multiple quit events
  if (isQuitting) {
    event.preventDefault();
    return;
  }
  
  isQuitting = true;
  isAppQuitting = true; // Mark that we're in the process of quitting
  event.preventDefault();
  
  log.info('Application is quitting...');
  
  try {
    // Save window state first (before any windows are destroyed)
    safeSaveWindowState();
    
    // Save app state (if still valid)
    if (isAppStateValid) {
      safeSaveAppState();
    }
    
    // Perform cleanup
    await cleanupProcesses();
    
    // Now quit the app
    log.info('All cleanup complete, quitting application');
    app.exit(0);
  } catch (error) {
    log.error('Error during application quit:', error);
    app.exit(1);
  }
});

// Handle window closing
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Optimize garbage collection for faster startup
if (global.gc) {
  global.gc();
  log.info('Garbage collection forced');
}

app.whenReady().then(async () => {
  metrics.startMeasure('app-startup');
  try {
    // Create splash window immediately for better perceived performance
    backendReadyPromise = startServers().catch(error => {
      log.error('Failed to start servers:', error);
      throw error;
    });
    createSplashWindow();

    // Start servers and window creation in parallel
    const serverPromise = backendReadyPromise;

    // Recover state in parallel with server startup
    const statePromise = Promise.resolve().then(() => {
      try {
        const lastState = stateManager.recover();
        if (lastState && Date.now() - lastState.timestamp < 30000) {
          log.info('Recovering from previous session');
          return lastState;
        }
      } catch (error) {
        log.warn('Failed to recover state:', error.message);
      }
      return null;
    });

    // Wait for both server and state to be ready
    const [_, recoveredState] = await Promise.all([serverPromise, statePromise]);
    
    // Create main window with recovered state
    try {
      await createWindow(recoveredState);
    } catch (error) {
      log.error('Failed to create window:', error);
      app.quit();
      return;
    }

    const startupTime = metrics.endMeasure('app-startup');
    log.info(`Application started in ${startupTime}ms`);

    // Save state periodically with error handling
    setInterval(() => {
      try {
        stateManager.save();
      } catch (error) {
        log.warn('Periodic state save failed:', error.message);
      }
    }, 30000);

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  } catch (error) {
    log.error('Failed to start application:', error);
    if (splashWindow) splashWindow.destroy();
    app.quit();
  }
});
