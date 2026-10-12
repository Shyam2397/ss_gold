const { app } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const log = require('electron-log');

const { PORTS } = require('./constants');
const { state } = require('./state');
const { ROOT_DIR, findAvailablePort, killPort, metrics } = require('./infrastructure');

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
        state.backendPort = PORTS.SERVER;
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
      state.backendPort = serverPort;

      await Promise.all([
        new Promise((resolve, reject) => {
          state.backendServer = spawn('node', [path.join(ROOT_DIR, 'server', 'server.js')], {
            stdio: 'pipe',
            cwd: path.join(ROOT_DIR, 'server'),
            shell: true,
            windowsHide: true,
            env: { ...process.env, PORT: state.backendPort },
          });
          state.backendServer.stdout.on('data', (data) => log.info(`[Backend]: ${data}`));
          state.backendServer.stderr.on('data', (data) => log.error(`[Backend Error]: ${data}`));
          state.backendServer.on('error', reject);
          state.backendServer.on('spawn', () => {
            log.info('Backend server spawned');
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          const viteCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
          state.viteServer = spawn(viteCommand, ['run', 'dev', '--', '--port', vitePort], {
            stdio: 'pipe',
            cwd: path.join(ROOT_DIR, 'client'),
            shell: true,
            windowsHide: true,
          });
          state.viteServer.stdout.on('data', (data) => log.info(`[Vite]: ${data}`));
          state.viteServer.stderr.on('data', (data) => log.error(`[Vite Error]: ${data}`));
          state.viteServer.on('error', reject);
          state.viteServer.on('spawn', () => {
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
      state.productionServerPort = await findAvailablePort(PORTS.SERVER);
      state.backendPort = state.productionServerPort;
      log.info(`Production server port: ${state.productionServerPort}`);

      const serverPath = app.isPackaged
        ? path.join(process.resourcesPath, 'server', 'server.js')
        : path.join(ROOT_DIR, 'server', 'server.js');
      const serverDir = path.dirname(serverPath);
      const serverCommand = app.isPackaged ? process.execPath : 'node';

      log.info(`Starting production server from: ${serverPath}`);
      log.info(`Working directory for server: ${serverDir}`);

      state.backendServer = spawn(serverCommand, [serverPath], {
        cwd: serverDir,
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          PORT: state.backendPort,
          NODE_ENV: 'production',
          ...(app.isPackaged ? { ELECTRON_RUN_AS_NODE: '1' } : {}),
        },
      });

      state.backendServer.stdout.on('data', (data) => {
        const output = data.toString().trim();
        if (output) log.info(`[Backend]: ${output}`);
      });

      state.backendServer.stderr.on('data', (data) => {
        const error = data.toString().trim();
        if (error) log.error(`[Backend Error]: ${error}`);
      });

      state.backendServer.on('error', (err) => {
        log.error('Failed to start backend server:', err);
      });

      state.backendServer.on('close', (code) => {
        log.info(`Backend server process exited with code ${code}`);
      });

      state.backendServer.on('spawn', () => {
        log.info('Backend server spawned for production');
      });

      if (!(await waitForServer(`http://localhost:${state.productionServerPort}`))) {
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

module.exports = { waitForServer, startServers };
