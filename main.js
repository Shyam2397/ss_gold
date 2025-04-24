const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
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

async function startServers() {
  // Start backend and Vite servers in parallel
  try {
    await Promise.all([
      new Promise((resolve, reject) => {
        backendServer = spawn('node', ['server/server.js'], {
          stdio: 'pipe',
          cwd: __dirname,
          shell: true,
          windowsHide: true
        });
        // Pipe the output to parent process
        backendServer.stdout.pipe(process.stdout);
        backendServer.stderr.pipe(process.stderr);
        backendServer.on('error', reject);
        setTimeout(resolve, 1000); // Give server time to start
      }),
      isDev && new Promise(async (resolve, reject) => {
        // Try npm first, then yarn if npm fails
        try {
          viteServer = spawn('npm', ['run', 'dev'], {
            stdio: 'pipe',
            cwd: path.join(__dirname, 'client'),
            shell: true,
            windowsHide: true
          });
          // Pipe the output to parent process
          viteServer.stdout.pipe(process.stdout);
          viteServer.stderr.pipe(process.stderr);
          viteServer.on('error', () => {
            // If npm fails, try yarn
            viteServer = spawn('yarn', ['dev'], {
              stdio: 'pipe',
              cwd: path.join(__dirname, 'client'),
              shell: true,
              windowsHide: true
            });
            // Pipe the output to parent process
            viteServer.stdout.pipe(process.stdout);
            viteServer.stderr.pipe(process.stderr);
            viteServer.on('error', reject);
          });
          setTimeout(resolve, 2000); // Give Vite time to start
        } catch (error) {
          reject(new Error('Failed to start Vite server: ' + error.message));
        }
      })
    ]);
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
    show: false // Keep hidden until ready
  });

  // Don't show window until frontend signals ready
  mainWindow.webContents.on('did-finish-load', () => {
    // Add small delay to ensure React has mounted
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.destroy();
      }
      mainWindow.show();
    }, 1500);
  });

  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load app');
    if (splashWindow) {
      splashWindow.destroy();
    }
    app.quit();
  });

  await mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, 'dist/index.html')}`);
}

// IPC handlers
ipcMain.on('toMain', (event, data) => {
  mainWindow.webContents.send('fromMain', data);
});

ipcMain.on('memoryInfo', (event, memoryInfo) => {
  // Log memory info and take action if needed
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

// App lifecycle
app.whenReady().then(async () => {
  try {
    createSplashWindow();
    await startServers();
    
    // Add delay before creating main window
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

// Cleanup
app.on('window-all-closed', () => {
  try {
    if (splashWindow) {
      splashWindow.destroy();
      splashWindow = null;
    }

    // Save window state if window still exists
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState();
    }

    // Cleanup processes
    if (backendServer) {
      backendServer.removeAllListeners();
      backendServer.kill();
    }
    if (viteServer) {
      viteServer.removeAllListeners();
      viteServer.kill();
    }
    
    if (process.platform !== 'darwin') {
      app.quit();
    }
  } catch (error) {
    console.error('Error during window cleanup:', error);
    app.quit();
  }
});

app.on('before-quit', () => {
  try {
    // Final cleanup
    if (mainWindow && !mainWindow.isDestroyed()) {
      saveWindowState();
      mainWindow.removeAllListeners();
      mainWindow = null;
    }
  } catch (error) {
    console.error('Error during final cleanup:', error);
  }
});
