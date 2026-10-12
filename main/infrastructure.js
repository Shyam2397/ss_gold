const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const { exec } = require('child_process');
const fetch = require('node-fetch');
const log = require('electron-log');

const { PORTS } = require('./constants');
const { state, getBackendBaseUrl } = require('./state');

// Root of the application. Modules live in main/, so this points one level up
// to keep icon/preload/splash/server/client paths identical to the old monolith.
const ROOT_DIR = path.join(__dirname, '..');

// Persistent settings file path
const getSettingsFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'printer-settings.json');
};

const getSplashBrandingCachePath = () => path.join(app.getPath('userData'), 'splash-branding.json');

const getIconPath = () => path.join(
  app.isPackaged ? process.resourcesPath : ROOT_DIR,
  app.isPackaged ? 'assets/logo.ico' : 'client/src/assets/logo.ico'
);

const getLogoPath = () => path.join(
  app.isPackaged ? process.resourcesPath : ROOT_DIR,
  app.isPackaged ? 'assets/logo.png' : 'client/src/assets/logo.png'
);

const getPreloadPath = () => path.join(ROOT_DIR, 'preload.js');
const getSplashPreloadPath = () => path.join(ROOT_DIR, 'splash-preload.js');
const getSplashHtmlPath = () => path.join(ROOT_DIR, 'splash.html');

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

const normalizeSplashBranding = (details) => {
  const name = typeof details?.name === 'string' ? details.name.trim() : '';
  const logo = typeof details?.logo === 'string' ? details.logo.trim() : '';
  const tagline = typeof details?.tagline === 'string' ? details.tagline.trim() : '';
  if (!name && !logo) return null;
  return { name, logo, tagline };
};

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
    if (!state.mainWindow || state.mainWindow.isDestroyed()) return;
    if (!state.mainWindow.isMaximized()) {
      store.set('windowState', state.mainWindow.getBounds());
    }
    store.set('isMaximized', state.mainWindow.isMaximized());
  } catch (error) {
    log.error('Error saving window state:', error);
  }
}

// Save window state before quitting
function safeSaveWindowState() {
  try {
    if (state.mainWindow && !state.mainWindow.isDestroyed()) {
      saveWindowState();
    }
  } catch (error) {
    log.warn('Failed to save window state:', error.message);
  }
}

// Add port checking function
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
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

const getCompanyDetailsFromBackend = async () => {
  const cachedBranding = readSplashBrandingCache();
  if (cachedBranding) return cachedBranding;

  for (let attempt = 0; attempt < 40 && !state.backendPort; attempt++) {
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

module.exports = {
  ROOT_DIR,
  store,
  metrics,
  monitorMemory,
  getSettingsFilePath,
  getSplashBrandingCachePath,
  getIconPath,
  getLogoPath,
  getPreloadPath,
  getSplashPreloadPath,
  getSplashHtmlPath,
  normalizeSplashBranding,
  readSplashBrandingCache,
  writeSplashBrandingCache,
  getWindowState,
  saveWindowState,
  safeSaveWindowState,
  isPortAvailable,
  findAvailablePort,
  killPort,
  safeKillPid,
  getCompanyDetailsFromBackend
};
