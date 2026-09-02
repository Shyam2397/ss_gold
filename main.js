const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');
const fs = require('fs');

// Add logging utility
const log = require('electron-log');
log.transports.file.level = 'info';
log.info('App starting...');
log.info(`app.isPackaged: ${app.isPackaged}`);

// Add this with other global variables at the top of the file
let isQuitting = false;

// Default printer settings
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

const DEFAULT_SKINTEST_PRINTER_SETTINGS = {
  printerName: '',
  paperSource: '',
  documentSize: 'A4',
  orientation: 'portrait',
  paperType: '',
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

// Initialize printer settings
const initPrinterSettings = () => {
  const savedSettings = loadSettingsFromFile();
  return {
    tokenPrinter: {
      ...DEFAULT_TOKEN_PRINTER_SETTINGS,
      ...(savedSettings?.tokenPrinter || {})
    },
    skinTestPrinter: {
      ...DEFAULT_SKINTEST_PRINTER_SETTINGS,
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

let backendProcess;
let mainWindow;
let backendServer;
let viteServer;
let splashWindow;
let productionServerPort;

// Update port constants and add max retry
const PORTS = {
  VITE: 3000,
  SERVER: 3001,
  MAX_RETRY: 10
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
  const fetch = require('node-fetch');
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
      // In development, start both Vite and backend servers
      await Promise.all([killPort(PORTS.VITE), killPort(PORTS.SERVER)]);
      log.info('Existing development ports cleaned');

      const [vitePort, serverPort] = await Promise.all([
        findAvailablePort(PORTS.VITE),
        findAvailablePort(PORTS.SERVER),
      ]);
      log.info(`Found available ports - Vite: ${vitePort}, Server: ${serverPort}`);

      await Promise.all([
        new Promise((resolve, reject) => {
          backendServer = spawn('node', ['server/server.js'], {
            stdio: 'pipe',
            cwd: __dirname,
            shell: true,
            windowsHide: true,
            env: { ...process.env, PORT: serverPort },
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

      PORTS.VITE = vitePort;
      PORTS.SERVER = serverPort;
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
      log.info(`Production server port: ${productionServerPort}`);

      const serverPath = path.join(__dirname, '..', 'server', 'server.js');
      const serverDir = path.join(__dirname, '..', 'server');

      log.info(`Starting production server from: ${serverPath}`);
      log.info(`Working directory for server: ${serverDir}`);

      backendServer = spawn('node', [serverPath], {
        cwd: serverDir,
        shell: false, // Important for packaged apps
        windowsHide: true,
        env: {
          ...process.env,
          PORT: productionServerPort,
          NODE_ENV: 'production',
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
  splashWindow.loadFile('splash.html');
}

async function createWindow() {
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
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.destroy();
      }
      mainWindow.show();
    }, 1500);
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
  if (productionServerPort) {
    return `http://localhost:${productionServerPort}`;
  }
  return null;
});

ipcMain.handle('get-logo-path', () => {
  return path.join(
    app.isPackaged ? process.resourcesPath : __dirname,
    app.isPackaged ? 'assets/logo.png' : 'client/src/assets/logo.png'
  );
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
      skinTestPrinter: { ...DEFAULT_SKINTEST_PRINTER_SETTINGS }
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
      skinTestPrinter: {
        ...DEFAULT_SKINTEST_PRINTER_SETTINGS,
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

// ------------------------------------------------------------
// Driver-level print options
//
// Electron's webContents.print() only understands a handful of options
// (deviceName, copies, color, landscape, pageSize, margins...). Quality,
// paper type and paper source are NOT part of that API and are silently
// ignored, so they have to be pushed to the printer driver itself:
//   - Windows: the printer queue's user PrintTicket (System.Printing) is
//     updated via PowerShell before the job is sent, so the driver applies
//     Draft/Normal/High, media type and input bin.
//   - Linux/macOS: the page is rendered to PDF and sent with `lp -o ...`.
// ------------------------------------------------------------

const normalizePrinterQuality = (value = '') => {
  return String(value)
    .trim()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

// App quality value -> canonical level: 'draft' | 'standard' | 'high'
const QUALITY_LEVEL_ALIASES = {
  draft: 'draft',
  'draft vivid': 'draft',
  low: 'draft',
  standard: 'standard',
  'standard vivid': 'standard',
  normal: 'standard',
  medium: 'standard',
  high: 'high',
  best: 'high',
  photo: 'high',
  photographic: 'high',
};

const resolveQualityLevel = (quality = '') => {
  return QUALITY_LEVEL_ALIASES[normalizePrinterQuality(quality)] || 'high';
};

const WINDOWS_OUTPUT_QUALITY = { draft: 'Draft', standard: 'Normal', high: 'High' };
const CUPS_PRINT_QUALITY = { draft: 3, standard: 4, high: 5 };

const WINDOWS_MEDIA_TYPE = {
  plain: 'Plain',
  thin: 'Plain',
  thick: 'CardStock',
  cardstock: 'CardStock',
  glossy: 'PhotographicGlossy',
  transparency: 'Transparency',
  labels: 'Label',
  envelope: 'Envelope',
  thermal: 'Plain',
};

const CUPS_MEDIA_TYPE = {
  plain: 'stationery',
  thin: 'stationery-lightweight',
  thick: 'stationery-heavyweight',
  cardstock: 'cardstock',
  glossy: 'photographic-glossy',
  transparency: 'transparency',
  labels: 'labels',
  envelope: 'envelope',
  thermal: 'stationery',
};

const WINDOWS_INPUT_BIN = {
  upper: 'Cassette',
  lower: 'Cassette',
  manual: 'Manual',
  multi: 'AutoSelect',
};

const CUPS_INPUT_SLOT = {
  upper: 'Upper',
  lower: 'Lower',
  manual: 'Manual',
  multi: 'MultiPurpose',
};

const WINDOWS_MEDIA_SIZE = {
  a4: 'ISOA4',
  a5: 'ISOA5',
  letter: 'NorthAmericaLetter',
  legal: 'NorthAmericaLegal',
};

const CUPS_MEDIA_SIZE = {
  a4: 'A4',
  a5: 'A5',
  letter: 'Letter',
  legal: 'Legal',
};

const runPowerShell = (script, env = {}) => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-'],
      { env: { ...process.env, ...env }, windowsHide: true }
    );

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.trim() || `PowerShell exited with code ${code}`));
      }
    });

    child.stdin.end(script);
  });
};

// Everything the driver needs is passed through environment variables so
// printer names / values are never interpolated into the script itself.
const WINDOWS_APPLY_PREFERENCES_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Printing
Add-Type -AssemblyName ReachFramework
$server = New-Object System.Printing.LocalPrintServer
$queue = $server.GetPrintQueue($env:SSG_PRINTER_NAME)
$ticket = $queue.UserPrintTicket
if (-not $ticket) { $ticket = New-Object System.Printing.PrintTicket }
$caps = $queue.GetPrintCapabilities()

function Set-IfSupported($capList, $enumType, $value, $apply) {
  if (-not $value) { return $false }
  $enumValue = [Enum]::Parse($enumType, $value)
  if ($capList -and ($capList -notcontains $enumValue)) { return $false }
  & $apply $enumValue
  return $true
}

$applied = @{}
$applied.quality = Set-IfSupported $caps.OutputQualityCapability ([System.Printing.OutputQuality]) $env:SSG_QUALITY { param($v) $ticket.OutputQuality = $v }
$applied.mediaType = Set-IfSupported $caps.PageMediaTypeCapability ([System.Printing.PageMediaType]) $env:SSG_MEDIA_TYPE { param($v) $ticket.PageMediaType = $v }
$applied.inputBin = Set-IfSupported $caps.InputBinCapability ([System.Printing.InputBin]) $env:SSG_INPUT_BIN { param($v) $ticket.InputBin = $v }
$applied.color = Set-IfSupported $caps.OutputColorCapability ([System.Printing.OutputColor]) $env:SSG_COLOR { param($v) $ticket.OutputColor = $v }
$applied.orientation = Set-IfSupported $caps.PageOrientationCapability ([System.Printing.PageOrientation]) $env:SSG_ORIENTATION { param($v) $ticket.PageOrientation = $v }

if ($env:SSG_MEDIA_SIZE) {
  $sizeName = [Enum]::Parse([System.Printing.PageMediaSizeName], $env:SSG_MEDIA_SIZE)
  $match = $caps.PageMediaSizeCapability | Where-Object { $_.PageMediaSizeName -eq $sizeName } | Select-Object -First 1
  if ($match) { $ticket.PageMediaSize = $match; $applied.mediaSize = $true } else { $applied.mediaSize = $false }
}

$queue.UserPrintTicket = $ticket
$queue.Commit()
$applied | ConvertTo-Json -Compress
`;

const WINDOWS_CAPABILITIES_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Printing
Add-Type -AssemblyName ReachFramework
$server = New-Object System.Printing.LocalPrintServer
$queue = $server.GetPrintQueue($env:SSG_PRINTER_NAME)
$caps = $queue.GetPrintCapabilities()
$result = @{
  qualities = @($caps.OutputQualityCapability | ForEach-Object { $_.ToString() })
  mediaTypes = @($caps.PageMediaTypeCapability | ForEach-Object { $_.ToString() })
  inputBins = @($caps.InputBinCapability | ForEach-Object { $_.ToString() })
  colors = @($caps.OutputColorCapability | ForEach-Object { $_.ToString() })
}
$result | ConvertTo-Json -Compress
`;

const buildWindowsDriverEnv = (settings) => {
  const level = resolveQualityLevel(settings.quality);
  const size = String(settings.documentSize || '').toLowerCase();
  return {
    SSG_PRINTER_NAME: settings.printerName,
    SSG_QUALITY: WINDOWS_OUTPUT_QUALITY[level],
    SSG_MEDIA_TYPE: WINDOWS_MEDIA_TYPE[String(settings.paperType || '').toLowerCase()] || '',
    SSG_INPUT_BIN: WINDOWS_INPUT_BIN[String(settings.paperSource || '').toLowerCase()] || '',
    SSG_COLOR: settings.color ? (settings.color === 'color' ? 'Color' : 'Monochrome') : '',
    SSG_ORIENTATION: settings.orientation ? (settings.orientation === 'landscape' ? 'Landscape' : 'Portrait') : '',
    SSG_MEDIA_SIZE: WINDOWS_MEDIA_SIZE[size] || '',
  };
};

// Pushes quality / media / tray to the Windows printer queue's user
// preferences. Chromium reads those defaults when it builds the print job
// for `deviceName`, so the subsequent webContents.print() honours them.
const applyWindowsDriverPreferences = async (settings) => {
  if (process.platform !== 'win32' || !settings.printerName) {
    return null;
  }
  const env = buildWindowsDriverEnv(settings);
  log.info(`Applying driver preferences to "${settings.printerName}": quality=${env.SSG_QUALITY} media=${env.SSG_MEDIA_TYPE || '-'} bin=${env.SSG_INPUT_BIN || '-'}`);
  const output = await runPowerShell(WINDOWS_APPLY_PREFERENCES_SCRIPT, env);
  const applied = output ? JSON.parse(output) : {};
  log.info(`Driver preferences applied: ${JSON.stringify(applied)}`);
  return applied;
};

const CANONICAL_QUALITY_LABELS = { draft: 'Draft', standard: 'Standard', high: 'High' };

// Returns which of our quality levels the printer actually supports.
const getPrinterCapabilities = async (printerName = '') => {
  const allLevels = ['draft', 'standard', 'high'];
  const fallback = { qualities: allLevels, mediaTypes: [], inputBins: [], colors: [], source: 'fallback' };

  if (!printerName) {
    return fallback;
  }

  if (process.platform === 'win32') {
    try {
      const output = await runPowerShell(WINDOWS_CAPABILITIES_SCRIPT, { SSG_PRINTER_NAME: printerName });
      const caps = JSON.parse(output || '{}');
      const driverQualities = (caps.qualities || []).map((q) => String(q).toLowerCase());
      const qualities = allLevels.filter((level) =>
        driverQualities.includes(WINDOWS_OUTPUT_QUALITY[level].toLowerCase())
      );
      return {
        qualities: qualities.length > 0 ? qualities : allLevels,
        mediaTypes: caps.mediaTypes || [],
        inputBins: caps.inputBins || [],
        colors: caps.colors || [],
        source: 'driver',
      };
    } catch (error) {
      log.warn(`Unable to read driver capabilities for "${printerName}": ${error.message}`);
      return fallback;
    }
  }

  // CUPS: print-quality 3/4/5 is a standard IPP attribute supported by
  // essentially every queue, so all three levels are offered.
  return { ...fallback, source: 'cups' };
};

const buildCupsArgs = (settings, printerType) => {
  const level = resolveQualityLevel(settings.quality);
  const args = ['-d', settings.printerName, '-n', String(parseInt(settings.copies) || 1)];
  const option = (value) => { args.push('-o', value); };

  option(`print-quality=${CUPS_PRINT_QUALITY[level]}`);

  const size = String(settings.documentSize || '').toLowerCase();
  if (printerType === 'token') {
    option(size.includes('58mm') ? 'media=Custom.58x150mm' : 'media=Custom.80x150mm');
  } else if (CUPS_MEDIA_SIZE[size]) {
    option(`media=${CUPS_MEDIA_SIZE[size]}`);
  }

  const mediaType = CUPS_MEDIA_TYPE[String(settings.paperType || '').toLowerCase()];
  if (mediaType) option(`media-type=${mediaType}`);

  const slot = CUPS_INPUT_SLOT[String(settings.paperSource || '').toLowerCase()];
  if (slot) option(`InputSlot=${slot}`);

  if (settings.orientation === 'landscape') option('landscape');
  if (settings.color) option(settings.color === 'color' ? 'print-color-mode=color' : 'print-color-mode=monochrome');

  return args;
};

const printPdfWithCups = (pdfPath, settings, printerType) => {
  return new Promise((resolve, reject) => {
    const args = [...buildCupsArgs(settings, printerType), pdfPath];
    log.info(`lp ${args.join(' ')}`);
    const child = spawn('lp', args);
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(stderr.trim() || `lp exited with code ${code}`));
    });
  });
};

// Helper: Map our settings to Electron print options
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

  return printOptions;
};

const mapSettingsToPdfOptions = (settings, printerType) => {
  const printOptions = mapSettingsToPrintOptions(settings, printerType);
  const pdfOptions = {
    printBackground: true,
    landscape: printOptions.landscape === true,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
  };
  if (printOptions.pageSize) {
    pdfOptions.pageSize = {
      width: printOptions.pageSize.width / 25400,
      height: printOptions.pageSize.height / 25400,
    };
  }
  return pdfOptions;
};

const waitForRender = (webContents) => {
  const ready = webContents.executeJavaScript(`
    new Promise((resolve) => {
      const done = () => setTimeout(resolve, 500);
      if (document.readyState === 'complete') done();
      else window.addEventListener('load', done);
    });
  `);
  const timeout = new Promise((resolve) => setTimeout(() => {
    log.warn('Style loading timeout, proceeding with print anyway');
    resolve();
  }, 3000));
  return Promise.race([ready, timeout]);
};

const electronPrint = (webContents, printOptions) => {
  return new Promise((resolve, reject) => {
    webContents.print(printOptions, (success, failureReason) => {
      if (success) resolve(true);
      else reject(new Error(failureReason || 'Print failed'));
    });
  });
};

// Renders HTML in a hidden window and prints it with the driver-level
// options (quality, paper type, tray) applied. Returns the options used.
const printHtmlWithDriverOptions = async (htmlContent, settings, printerType, windowOptions = {}) => {
  const printOptions = mapSettingsToPrintOptions(settings, printerType);
  log.info(`Mapped print options for ${printerType}: ${JSON.stringify(printOptions)}`);

  const printWindow = new BrowserWindow({
    useContentSize: true,
    show: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    ...windowOptions,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      offscreen: false,
    },
  });

  try {
    printWindow.webContents.setZoomLevel(0);

    const loadFailed = new Promise((_, reject) => {
      printWindow.webContents.once('did-fail-load', (e, ec, em) => {
        reject(new Error(`Page load failed: ${em} (${ec})`));
      });
    });
    await Promise.race([
      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`),
      loadFailed,
    ]);
    await waitForRender(printWindow.webContents);

    const useCups = process.platform !== 'win32' && !!settings.printerName;

    if (useCups) {
      const pdf = await printWindow.webContents.printToPDF(mapSettingsToPdfOptions(settings, printerType));
      const pdfPath = path.join(os.tmpdir(), `ssgold-${printerType}-${Date.now()}.pdf`);
      fs.writeFileSync(pdfPath, pdf);
      try {
        await printPdfWithCups(pdfPath, settings, printerType);
      } finally {
        fs.unlink(pdfPath, () => {});
      }
      return { ...printOptions, transport: 'cups', quality: resolveQualityLevel(settings.quality) };
    }

    let driver = null;
    if (process.platform === 'win32' && settings.printerName) {
      try {
        driver = await applyWindowsDriverPreferences(settings);
      } catch (error) {
        log.warn(`Could not apply driver preferences, printing with driver defaults: ${error.message}`);
      }
    }

    await electronPrint(printWindow.webContents, printOptions);
    return { ...printOptions, transport: 'electron', quality: resolveQualityLevel(settings.quality), driver };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.destroy();
    }
  }
};

ipcMain.handle('get-printer-capabilities', async (event, printerName) => {
  try {
    const caps = await getPrinterCapabilities(printerName);
    return {
      ...caps,
      qualityOptions: caps.qualities.map((level) => ({ value: level, label: CANONICAL_QUALITY_LABELS[level] })),
    };
  } catch (error) {
    log.error('Error getting printer capabilities:', error);
    return { qualities: ['draft', 'standard', 'high'], qualityOptions: [], source: 'error', error: error.message };
  }
});

ipcMain.handle('silent-print-token', async (event, htmlContent) => {
  try {
    const settings = printerSettings.tokenPrinter;
    log.info(`Starting token print to printer: ${settings.printerName || 'default'}`);
    log.info(`Token print settings: copies=${settings.copies}, silent=${settings.silentMode}, quality=${settings.quality}`);

    const paperSize = (settings.documentSize || '80mm').toLowerCase();
    const contentWidth = paperSize.includes('58mm') ? 220 : 305;

    await printHtmlWithDriverOptions(htmlContent, settings, 'token', { width: contentWidth, height: 600 });
    log.info('Token print completed successfully');
    return { success: true };
  } catch (error) {
    log.error('Error during token silent print:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('silent-print-skintest', async (event, htmlContent) => {
  try {
    const settings = printerSettings.skinTestPrinter;
    log.info(`Starting skin test print to printer: ${settings.printerName || 'default'}`);
    log.info(`Skin test print settings: copies=${settings.copies}, silent=${settings.silentMode}, quality=${settings.quality}, paperType=${settings.paperType}`);

    await printHtmlWithDriverOptions(htmlContent, settings, 'skinTest', { width: 850, height: 1200 });
    log.info('Skin test print completed successfully');
    return { success: true };
  } catch (error) {
    log.error('Error during skin test silent print:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('silent-print-pure-exchange', async (event, htmlContent) => {
  try {
    const settings = printerSettings.tokenPrinter; // Use same thermal printer settings as token
    log.info(`Starting pure exchange print to printer: ${settings.printerName || 'default'}`);

    const paperSize = (settings.documentSize || '80mm').toLowerCase();
    const contentWidth = paperSize.includes('58mm') ? 220 : 305;

    await printHtmlWithDriverOptions(htmlContent, settings, 'token', { width: contentWidth, height: 600 });
    log.info('Pure exchange print completed successfully');
    return { success: true };
  } catch (error) {
    log.error('Error during pure exchange silent print:', error);
    return { success: false, error: error.message };
  }
});

// Test print goes through exactly the same pipeline as a real print so the
// output reflects the saved quality / paper settings.
ipcMain.handle('test-print', async (event, { printerType, htmlContent }) => {
  try {
    const settings = printerType === 'token'
      ? printerSettings.tokenPrinter
      : printerSettings.skinTestPrinter;

    log.info(`Test print for ${printerType} to: ${settings.printerName || 'default'} (quality=${settings.quality})`);

    const paperSize = (settings.documentSize || (printerType === 'token' ? '80mm' : 'A4')).toLowerCase();
    const windowOptions = printerType === 'token'
      ? { width: paperSize.includes('58mm') ? 220 : 305, height: 600 }
      : { width: 850, height: 1200 };

    const used = await printHtmlWithDriverOptions(htmlContent, settings, printerType, windowOptions);
    log.info(`Test print completed for ${printerType}: ${JSON.stringify(used)}`);
    return {
      success: true,
      message: `Test print sent (${CANONICAL_QUALITY_LABELS[used.quality]} quality via ${used.transport})`,
      applied: used,
    };
  } catch (error) {
    log.error('Error during test print:', error);
    return { success: false, error: error.message };
  }
});

// ============================================================
// END PRINTER MANAGEMENT IPC HANDLERS
// ============================================================

function killPort(port) {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    const cmd = platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        log.info(`No process found on port ${port}`);
        resolve();
        return;
      }
      const pid = platform === 'win32'
        ? stdout.split('\n')[0].split(' ').filter(Boolean).pop()
        : stdout.trim();
      if (pid) {
        const killCmd = platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
        exec(killCmd, (error) => {
          if (error) {
            log.error(`Failed to kill process on port ${port}:`, error);
            reject(error);
          } else {
            log.info(`Successfully killed process on port ${port}`);
            resolve();
          }
        });
      } else {
        resolve();
      }
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
    cleanupTasks.push(safeCleanup('closing main window', () => {
      mainWindow.removeAllListeners();
      mainWindow.destroy();
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
  if (backendProcess) {
    cleanupTasks.push(safeCleanup('killing backend process', () => 
      safeKillPid(backendProcess.pid, 'backend server')
    ));
    backendProcess = null;
  }

  // 3. Kill Vite dev server if in development
  if (viteServer && !app.isPackaged) {
    cleanupTasks.push(safeCleanup('killing Vite server', () => 
      safeKillPid(viteServer.pid, 'Vite server')
    ));
    viteServer = null;
  }

  // 4. Kill any processes on our ports
  if (backendServer && backendServer.port) {
    cleanupTasks.push(safeCleanup(`killing process on port ${backendServer.port}`, () => 
      killPort(backendServer.port)
    ));
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
    createSplashWindow();
    
    // Start servers and window creation in parallel
    const serverPromise = startServers().catch(error => {
      log.error('Failed to start servers:', error);
      throw error;
    });

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
