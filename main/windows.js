const { app, BrowserWindow } = require('electron');
const path = require('path');
const log = require('electron-log');

const { PORTS } = require('./constants');
const { state } = require('./state');
const {
  ROOT_DIR,
  getWindowState,
  getIconPath,
  getPreloadPath,
  getSplashPreloadPath,
  getSplashHtmlPath
} = require('./infrastructure');

function revealApplication() {
  if (state.splashRevealed || !state.mainWindowReady || !state.splashBrandingReady || !state.contentReady) return;
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return;

  state.splashRevealed = true;
  if (state.splashRevealTimer) {
    clearTimeout(state.splashRevealTimer);
    state.splashRevealTimer = null;
  }

  const splash = state.splashWindow;
  state.splashWindow = null;

  fadeSplashThenReveal(splash);
}

function showMainWindow() {
  if (!state.mainWindow || state.mainWindow.isDestroyed()) return;
  if (!state.mainWindow.isMaximized()) {
    state.mainWindow.maximize();
  }
  state.mainWindow.show();
  state.mainWindow.focus();
}

function fadeSplashThenReveal(splash) {
  if (!splash || splash.isDestroyed()) {
    showMainWindow();
    return;
  }

  const FADE_MS = 180;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    if (splash && !splash.isDestroyed()) {
      splash.destroy();
    }
    showMainWindow();
  };

  try {
    splash.webContents
      .executeJavaScript(
        `(() => {
          const el = document.body;
          if (!el) return false;
          el.style.transition = 'opacity ${FADE_MS}ms ease-out';
          void el.offsetWidth;
          el.style.opacity = '0';
          return true;
        })();`
      )
      .catch(() => {});
  } catch (error) {
    finish();
    return;
  }

  setTimeout(finish, FADE_MS + 40);
}

function scheduleSplashRevealTimeout() {
  if (state.splashRevealTimer) return;
  state.splashRevealTimer = setTimeout(() => {
    state.splashRevealTimer = null;
    state.splashBrandingReady = true;
    state.contentReady = true;
    revealApplication();
  }, 5000);
}

function createSplashWindow() {
  const iconPath = getIconPath();

  state.splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    center: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: getSplashPreloadPath(),
      contextIsolation: true
    }
  });

  state.splashWindow.once('ready-to-show', () => {
    if (state.splashWindow && !state.splashWindow.isDestroyed()) {
      state.splashWindow.show();
    }
  });

  state.splashWindow.loadFile(getSplashHtmlPath()).catch((error) => {
    log.error('Failed to load splash screen:', error);
    state.splashBrandingReady = true;
    revealApplication();
  });
}

async function createWindow() {
  state.mainWindowReady = false;
  state.contentReady = false;
  state.splashRevealed = false;
  if (state.splashRevealTimer) {
    clearTimeout(state.splashRevealTimer);
    state.splashRevealTimer = null;
  }

  const iconPath = getIconPath();

  const savedWindowState = getWindowState() || {};
  const width = Number.isFinite(savedWindowState.width) ? savedWindowState.width : 1200;
  const height = Number.isFinite(savedWindowState.height) ? savedWindowState.height : 800;
  const hasPosition =
    Number.isFinite(savedWindowState.x) && Number.isFinite(savedWindowState.y);

  state.mainWindow = new BrowserWindow({
    width,
    height,
    ...(hasPosition ? { x: savedWindowState.x, y: savedWindowState.y } : {}),
    maximized: true,
    backgroundColor: '#FEFEFE',
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath()
    },
    show: false
  });

  if (app.isPackaged) {
    state.mainWindow.setMenuBarVisibility(false);
    state.mainWindow.setAutoHideMenuBar(true);
  }

  state.mainWindow.once('ready-to-show', () => {
    state.mainWindowReady = true;
    scheduleSplashRevealTimeout();
    revealApplication();
  });

  state.mainWindow.webContents.on('did-finish-load', () => {
    log.info('Main window finished loading.');
  });

  state.mainWindow.webContents.on('did-fail-load', () => {
    log.error('Failed to load app');
    if (state.splashWindow) {
      state.splashWindow.destroy();
    }
    app.quit();
  });

  const loadURL = !app.isPackaged
    ? `http://localhost:${PORTS.VITE}`
    : `file://${path.join(ROOT_DIR, 'client/dist/index.html')}`;

  log.info(`Loading URL: ${loadURL}`);

  try {
    await state.mainWindow.loadURL(loadURL);

    log.info('URL loaded successfully.');
  } catch (error) {
    log.error('Failed to load URL:', error);
    app.quit();
  }
}

module.exports = {
  revealApplication,
  scheduleSplashRevealTimeout,
  createSplashWindow,
  createWindow
};
