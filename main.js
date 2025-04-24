const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Initialize store for window state persistence
const store = new Store();

// Enable garbage collection exposure
app.commandLine.appendSwitch('js-flags', '--expose-gc');

let backendProcess;
let mainWindow;
let backendServer;
let viteServer;
let splashWindow;

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
    console.error('Error saving window state:', error);
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

async function startServers() {
  try {
    const [vitePort, serverPort] = await Promise.all([
      findAvailablePort(PORTS.VITE),
      findAvailablePort(PORTS.SERVER)
    ]);

    await Promise.all([
      new Promise((resolve, reject) => {
        backendServer = spawn('node', ['server/server.js'], {
          stdio: 'pipe',
          cwd: __dirname,
          shell: true,
          windowsHide: true,
          env: { ...process.env, PORT: serverPort }
        });
        backendServer.stdout.pipe(process.stdout);
        backendServer.stderr.pipe(process.stderr);
        backendServer.on('error', reject);
        setTimeout(resolve, 1000);
      }),
      isDev && new Promise(async (resolve, reject) => {
        try {
          const viteCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
          viteServer = spawn(viteCommand, ['run', 'dev', '--', '--port', vitePort], {
            stdio: 'pipe',
            cwd: path.join(__dirname, 'client'),
            shell: true,
            windowsHide: true
          });
          viteServer.stdout.pipe(process.stdout);
          viteServer.stderr.pipe(process.stderr);
          viteServer.on('error', reject);
          setTimeout(resolve, 2000);
        } catch (error) {
          reject(new Error('Failed to start Vite server: ' + error.message));
        }
      })
    ]);

    PORTS.VITE = vitePort;
    PORTS.SERVER = serverPort;
    
  } catch (error) {
    console.error('Error starting servers:', error);
    throw error;
  }
}

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
    console.error('Failed to load app');
    if (splashWindow) {
      splashWindow.destroy();
    }
    app.quit();
  });

  await mainWindow.loadURL(isDev ? `http://localhost:${PORTS.VITE}` : `file://${path.join(__dirname, 'dist/index.html')}`);
}

// IPC handlers
ipcMain.on('toMain', (event, data) => {
  mainWindow.webContents.send('fromMain', data);
});

ipcMain.on('memoryInfo', (event, memoryInfo) => {
  if (memoryInfo.process.heapUsed > 0.9 * memoryInfo.process.heapTotal) {
    console.warn('High memory usage detected');
    if (global.gc) global.gc();
  }
});

ipcMain.handle('getWindowState', () => {
  return mainWindow.getBounds();
});

ipcMain.on('setWindowState', (event, bounds) => {
  mainWindow.setBounds(bounds);
});

function killPort(port) {
  return new Promise((resolve, reject) => {
    const platform = process.platform;
    const cmd = platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} -t`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log(`No process found on port ${port}`);
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
            console.error(`Failed to kill process on port ${port}:`, error);
            reject(error);
          } else {
            console.log(`Successfully killed process on port ${port}`);
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
}

async function cleanupProcesses() {
  try {
    if (backendServer) {
      backendServer.removeAllListeners();
      backendServer.kill();
    }
    if (viteServer) {
      viteServer.removeAllListeners();
      viteServer.kill();
    }

    await Promise.all([
      killPort(PORTS.VITE),
      killPort(PORTS.SERVER)
    ]);

    if (process.platform === 'win32') {
      exec('taskkill /F /IM cmd.exe /T', (error) => {
        if (error) {
          console.error('Failed to close terminal windows:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error during process cleanup:', error);
  }
}

app.whenReady().then(async () => {
  try {
    createSplashWindow();
    await startServers();
    
    setTimeout(async () => {
      await createWindow();
    }, 2000);

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  } catch (error) {
    console.error('Failed to start application:', error);
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
    console.error('Error during window cleanup:', error);
    app.quit();
  }
});

app.on('before-quit', async () => {
  try {
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState();
      mainWindow.removeAllListeners();
      mainWindow = null;
    }
    await cleanupProcesses();
  } catch (error) {
    console.error('Error during final cleanup:', error);
  }
});
