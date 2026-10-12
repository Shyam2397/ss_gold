const { app } = require('electron');
const log = require('electron-log');

const { state } = require('./state');
const { store, metrics, safeKillPid, safeSaveWindowState } = require('./infrastructure');

// Crash recovery and state persistence
const stateManager = {
  save: () => {
    try {
      store.set('lastState', {
        metrics: metrics.performanceHistory,
        timestamp: Date.now(),
        windowState: state.mainWindow ? state.mainWindow.getBounds() : null
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
  if (state.mainWindow && !state.mainWindow.isDestroyed()) {
    const windowToClose = state.mainWindow;
    cleanupTasks.push(safeCleanup('closing main window', () => {
      windowToClose.removeAllListeners();
      windowToClose.destroy();
      state.mainWindow = null;
    }));
  }

  if (state.splashWindow && !state.splashWindow.isDestroyed()) {
    cleanupTasks.push(safeCleanup('closing splash window', () => {
      state.splashWindow.destroy();
      state.splashWindow = null;
    }));
  }

  // 2. Kill backend processes
  if (state.backendServer) {
    const backendPid = state.backendServer.pid;
    cleanupTasks.push(safeCleanup('killing backend server', () =>
      safeKillPid(backendPid, 'backend server')
    ));
    state.backendServer = null;
  }

  // 3. Kill Vite dev server if in development
  if (state.viteServer && !app.isPackaged) {
    const vitePid = state.viteServer.pid;
    cleanupTasks.push(safeCleanup('killing Vite server', () =>
      safeKillPid(vitePid, 'Vite server')
    ));
    state.viteServer = null;
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

// Save application state
function safeSaveAppState() {
  if (!state.isAppStateValid || state.isAppQuitting) return;

  try {
    if (stateManager && typeof stateManager.save === 'function') {
      stateManager.save();
    } else {
      state.isAppStateValid = false;
      log.warn('State manager is not available for saving');
    }
  } catch (error) {
    state.isAppStateValid = false;
    log.warn('Failed to save application state:', error.message);
  }
}

function registerLifecycle() {
  // Handle app quitting
  app.on('before-quit', async (event) => {
    // Prevent multiple quit events
    if (state.isQuitting) {
      event.preventDefault();
      return;
    }

    state.isQuitting = true;
    state.isAppQuitting = true; // Mark that we're in the process of quitting
    event.preventDefault();

    log.info('Application is quitting...');

    try {
      // Save window state first (before any windows are destroyed)
      safeSaveWindowState();

      // Save app state (if still valid)
      if (state.isAppStateValid) {
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
}

module.exports = {
  stateManager,
  cleanupProcesses,
  safeSaveAppState,
  registerLifecycle
};
