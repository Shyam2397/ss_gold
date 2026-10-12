// Shared mutable state for the main process. Every module reads and writes the
// same object so it always mirrors the previous module-level variables.
const state = {
  mainWindow: null,
  backendServer: null,
  viteServer: null,
  splashWindow: null,
  productionServerPort: null,
  backendPort: null,
  mainWindowReady: false,
  splashBrandingReady: false,
  contentReady: false,
  splashRevealed: false,
  splashRevealTimer: null,
  printerSettings: null,
  isQuitting: false,
  isAppStateValid: true,
  isAppQuitting: false
};

const getBackendBaseUrl = () => {
  if (!state.backendPort) return null;
  return `http://127.0.0.1:${state.backendPort}`;
};

module.exports = { state, getBackendBaseUrl };
