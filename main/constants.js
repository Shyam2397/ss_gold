// Default printer settings – thermal token/receipt printer
const DEFAULT_TOKEN_PRINTER_SETTINGS = {
  printerName: '',
  paperSource: '',
  documentSize: '80mm',
  orientation: 'portrait',
  paperType: '',
  quality: 'high',
  color: 'monochrome',
  copies: 1,
  silentMode: true
};

// Default printer settings – skin-test certificate (A4 colour printer)
// Explicit defaults below drive two layers of the colour pipeline:
//   1. Chromium's printToPDF() (vector / colour-space accurate)
//   2. pdf-to-printer → SumatraPDF driver hints (color=yes, quality=high, paper-type)
const DEFAULT_SKIN_TEST_PRINTER_SETTINGS = {
  printerName: '',
  paperSource: '',
  documentSize: 'A4',
  orientation: 'portrait',
  paperType: 'plain',
  quality: 'high',
  color: 'color',
  copies: 1,
  silentMode: true
};

// Update port constants and add max retry
const PORTS = {
  VITE: 3000,
  SERVER: 3001,
  MAX_RETRY: 10
};

module.exports = {
  PORTS,
  DEFAULT_TOKEN_PRINTER_SETTINGS,
  DEFAULT_SKIN_TEST_PRINTER_SETTINGS
};
