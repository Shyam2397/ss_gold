const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');
const isDev = require('electron-is-dev');

// Add logging utility
const log = require('electron-log');
log.transports.file.level = 'info';
log.info('App starting...');

// Add this with other global variables at the top of the file
let isQuitting = false;

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

      // For production, use a more direct approach to spawn the server
      const serverDir = isDev 
        ? path.join(__dirname, 'server')
        : path.join(process.resourcesPath, 'server');

      log.info(`Starting server from: ${serverPath}`);
      log.info(`Working directory: ${serverDir}`);

      // Use the system's node executable directly
      const nodePath = process.platform === 'win32' ? 'node.exe' : 'node';
      
      // Spawn the process directly with node
      backendServer = spawn(nodePath, [serverPath], {
        cwd: serverDir,
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          PORT: productionServerPort,
          NODE_ENV: 'production',
          ELECTRON_RUN_AS_NODE: '1'
        }
      });

      // Handle process events
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
      
      // Add a small delay to ensure the process starts
      await new Promise(resolve => setTimeout(resolve, 1000));
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
  const iconPath = path.join(__dirname, 'client', 'src', 'assets', 'logo.ico');
  
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true
    }
  });
  splashWindow.loadFile('splash.html');
}

async function createWindow() {
  const iconPath = path.join(__dirname, 'client', 'src', 'assets', 'logo.ico');
  
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
  if (viteServer && isDev) {
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
