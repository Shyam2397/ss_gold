const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');
const isDev = require('electron-is-dev');

// Add logging utility
const log = require('electron-log');
log.transports.file.level = 'info';
log.info('App starting...');

// Initialize store with better error handling
let store;
try {
  const Store = require('electron-store');
  store = new Store({
    name: 'ss-gold-config',
    defaults: {
      windowState: {
        width: 1200,
        height: 800,
        x: undefined,
        y: undefined
      }
    },
    clearInvalidConfig: true // Clear if config becomes corrupted
  });
  log.info('Store initialized successfully');
} catch (error) {
  log.error('Store initialization failed:', error.message);
  store = {
    get: (key, defaultValue) => defaultValue,
    set: () => {},
    delete: () => {}
  };
}

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

    if (isDev) {
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

      const serverPath = isDev
        ? path.join(__dirname, 'server', 'server.js')
        : path.join(process.resourcesPath, 'server', 'server.js');
      backendServer = spawn('node', [serverPath], {
        stdio: 'pipe',
        shell: true,
        windowsHide: true,
        env: { ...process.env, PORT: productionServerPort },
        cwd: isDev ? path.join(__dirname, 'server') : path.join(process.resourcesPath, 'server'),
      });
      backendServer.stdout.on('data', (data) => log.info(`[Backend]: ${data}`));
      backendServer.stderr.on('data', (data) => log.error(`[Backend Error]: ${data}`));
      backendServer.on('error', (err) => log.error('Failed to start backend server:', err));
      backendServer.on('spawn', () => log.info('Backend server spawned for production'));

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
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  splashWindow.loadFile('splash.html');
}

async function createWindow() {
  const windowState = getWindowState();
  mainWindow = new BrowserWindow({
    ...windowState,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

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

    const loadURL = isDev
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

ipcMain.handle('get-system-memory', () => {
  return {
    total: os.totalmem(),
    free: os.freemem(),
  };
});

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

// Update cleanup function with better handling
async function cleanupProcesses() {
  log.info('Starting cleanup process...');
  try {
    const cleanup = [];
    if (backendServer) {
      cleanup.push(new Promise(resolve => {
        backendServer.removeAllListeners();
        backendServer.kill();
        backendServer.on('exit', () => {
          log.info('Backend server terminated');
          resolve();
        });
      }));
    }
    if (viteServer) {
      cleanup.push(new Promise(resolve => {
        viteServer.removeAllListeners();
        viteServer.kill();
        viteServer.on('exit', () => {
          log.info('Vite server terminated');
          resolve();
        });
      }));
    }
    // Wait for all processes to cleanup
    await Promise.all([
      ...cleanup,
      killPort(PORTS.VITE),
      killPort(PORTS.SERVER)
    ]);

    if (process.platform === 'win32') {
      await new Promise(resolve => {
        exec('taskkill /F /IM cmd.exe /T', (error) => {
          if (error) {
            log.error('Failed to close terminal windows:', error);
          } else {
            log.info('Terminal windows closed');
          }
          resolve();
        });
      });
    }

    log.info('Cleanup completed successfully');
  } catch (error) {
    log.error('Cleanup process failed:', error);
    throw error;
  }
}

app.whenReady().then(async () => {
  metrics.startMeasure('app-startup');
  try {
    // Recover from previous crash if needed
    const lastState = stateManager.recover();
    if (lastState && Date.now() - lastState.timestamp < 30000) {
      log.info('Recovering from previous session');
    }

    createSplashWindow();
    await startServers();
    
    setTimeout(async () => {
      try {
        await createWindow();
      } catch (error) {
        log.error('Failed to create window:', error);
        app.quit();
      }
    }, 2000);

    const startupTime = metrics.endMeasure('app-startup');
    log.info(`Application started in ${startupTime}ms`);

    // Save state periodically
    setInterval(stateManager.save, 30000);

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

app.on('window-all-closed', async () => {
  try {
    if (splashWindow) {
      splashWindow.destroy();
      splashWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState();
    }
    await cleanupProcesses();
    
    if (process.platform !== 'darwin') {
      app.quit();
    }
  } catch (error) {
    log.error('Error during window cleanup:', error);
    app.quit();
  }
});

app.on('before-quit', async () => {
  stateManager.save();
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState();
      mainWindow.removeAllListeners();
      mainWindow = null;
    }
    await cleanupProcesses();
  } catch (error) {
    log.error('Error during final cleanup:', error);
  }
});
