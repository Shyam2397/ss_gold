const { app, BrowserWindow } = require('electron');

// Add logging utility
const log = require('electron-log');
log.transports.file.level = 'info';
log.info('App starting...');
log.info(`app.isPackaged: ${app.isPackaged}`);

// Enable garbage collection exposure
app.commandLine.appendSwitch('js-flags', '--expose-gc');

const { state } = require('./main/state');
const { metrics } = require('./main/infrastructure');
const { startServers } = require('./main/servers');
const { createWindow, createSplashWindow } = require('./main/windows');
const { registerIpcHandlers } = require('./main/ipc');
const { registerLifecycle, stateManager } = require('./main/lifecycle');

registerIpcHandlers();
registerLifecycle();

// Optimize garbage collection for faster startup
if (global.gc) {
  global.gc();
  log.info('Garbage collection forced');
}

app.whenReady().then(async () => {
  metrics.startMeasure('app-startup');
  try {
    // Create splash window immediately for better perceived performance
    const backendReadyPromise = startServers().catch(error => {
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
    if (state.splashWindow) state.splashWindow.destroy();
    app.quit();
  }
});
