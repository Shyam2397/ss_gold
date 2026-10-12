const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
// pdf-to-printer: sends a PDF file directly to a Windows printer with no dialog
const pdfToPrinter = require('pdf-to-printer');
// devmode-helper: Windows DEVMODE manipulation for real paper type selection
const devmodeHelper = require('../devmode-helper');

const {
  DEFAULT_TOKEN_PRINTER_SETTINGS,
  DEFAULT_SKIN_TEST_PRINTER_SETTINGS
} = require('./constants');
const { state } = require('./state');
const { getSettingsFilePath } = require('./infrastructure');

// Load settings from file
const loadSettingsFromFile = () => {
  try {
    const filePath = getSettingsFilePath();
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    log.error('Error loading printer settings from file:', error);
  }
  return null;
};

// Save settings to file
const saveSettingsToFile = (settings) => {
  try {
    const filePath = getSettingsFilePath();
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    log.error('Error saving printer settings to file:', error);
    return false;
  }
};

// Initialize printer settings – merges persisted file values over defaults for each printer key
const initPrinterSettings = () => {
  const savedSettings = loadSettingsFromFile();
  return {
    tokenPrinter: {
      ...DEFAULT_TOKEN_PRINTER_SETTINGS,
      ...(savedSettings?.tokenPrinter || {})
    },
    // Skin-test A4 printer settings, persisted independently from the token printer
    skinTestPrinter: {
      ...DEFAULT_SKIN_TEST_PRINTER_SETTINGS,
      ...(savedSettings?.skinTestPrinter || {})
    }
  };
};

state.printerSettings = initPrinterSettings();
log.info('Printer settings initialized:', JSON.stringify(state.printerSettings, null, 2));

// Helper: Map our settings to Electron print options
//
// Quality handling (per project convention):
//   • quality === 'high' / 'best' / undefined → do NOT set printOptions.quality.
//     This lets the printer driver use its native high-DPI / best defaults.
//     Experience shows Electron's hard-coded `quality: 3` can sometimes
//     result in softer output than the driver's native best mode.
//   • quality === 'medium' / 'normal' → printOptions.quality = 2
//   • quality === 'low' / 'draft'     → printOptions.quality = 1
const mapSettingsToPrintOptions = (settings, printerType) => {
  const printOptions = {
    silent: settings.silentMode !== false,
    printBackground: true,
    copies: parseInt(settings.copies) || 1,
  };

  if (settings.printerName) {
    printOptions.deviceName = settings.printerName;
  }

  if (settings.orientation) {
    printOptions.landscape = settings.orientation === 'landscape';
  }

  if (settings.color) {
    printOptions.color = settings.color === 'color';
  }

  const isThermal = printerType === 'token';

  if (isThermal) {
    printOptions.marginsType = 1;
    printOptions.margins = { top: 0, bottom: 0, left: 0, right: 0 };
  }

  if (settings.documentSize) {
    const size = settings.documentSize.toLowerCase();
    if (size === 'a4') {
      printOptions.pageSize = { width: 210000, height: 297000 };
    } else if (size === 'a5') {
      printOptions.pageSize = { width: 148000, height: 210000 };
    } else if (size.includes('80mm') || size.includes('thermal') || size === '80mm') {
      printOptions.pageSize = { width: 80000, height: 150000 };
    } else if (size.includes('58mm')) {
      printOptions.pageSize = { width: 58000, height: 150000 };
    } else if (size === 'letter') {
      printOptions.pageSize = { width: 215900, height: 279400 };
    } else if (size === 'legal') {
      printOptions.pageSize = { width: 215900, height: 355600 };
    }
  }

  const q = (settings.quality || 'high').toLowerCase();
  if (q === 'medium' || q === 'normal' || q === 'standard') {
    printOptions.quality = 2;
  } else if (q === 'low' || q === 'draft' || q === 'economy') {
    printOptions.quality = 1;
  }
  // NOTE: 'high' / 'best' intentionally falls through without setting
  // printOptions.quality — see docstring above.

  return printOptions;
};

const applyPrinterDevmode = async (settings, printLabel) => {
  let printerName = settings?.printerName?.trim();
  if (!printerName && state.mainWindow) {
    try {
      const printers = await state.mainWindow.webContents.getPrintersAsync();
      printerName = printers.find((printer) => printer.isDefault)?.name || '';
    } catch (error) {
      log.warn(`[${printLabel}] Could not resolve the system default printer:`, error);
    }
  }

  if (!printerName) {
    log.info(`[${printLabel}] No explicit printer selected; skipping DEVMODE mutation.`);
    return { applied: false, changed: {}, message: 'System default printer selected.' };
  }

  const overrides = {};
  if (settings.paperType && settings.paperType.trim()) overrides.paperType = settings.paperType;
  if (settings.color) overrides.color = settings.color;
  if (settings.orientation) overrides.orientation = settings.orientation;
  if (settings.quality) overrides.quality = settings.quality;
  if (settings.copies != null) overrides.copies = settings.copies;

  if (Object.keys(overrides).length === 0) {
    return { applied: false, changed: {}, message: 'No DEVMODE overrides selected.' };
  }

  log.info(`[${printLabel}] Applying DEVMODE overrides: ${JSON.stringify(overrides)}`);
  const result = await devmodeHelper.applyPrinterDefaults(printerName, overrides);
  if (!result.applied) {
    log.warn(`[${printLabel}] DEVMODE was not applied: ${result.message}`);
  } else {
    log.info(`[${printLabel}] DEVMODE applied: ${result.message}`);
  }
  return result;
};

const buildThermalWaitScript = (fontsReady) => {
  if (fontsReady) {
    // Wait for styles (and the inlined logo) to be fully decoded
    return `
      new Promise((resolve) => {
        const done = () => setTimeout(resolve, 500);
        if (document.readyState === 'complete') {
          if (document.fonts && document.fonts.status !== 'loaded') {
            document.fonts.ready.then(done, done);
          } else {
            done();
          }
        } else {
          window.addEventListener('load', done);
        }
      });
    `;
  }

  return `
    new Promise((resolve) => {
      if (document.readyState === 'complete') {
        // Wait a bit more for fonts to render
        setTimeout(resolve, 500);
      } else {
        window.addEventListener('load', () => {
          setTimeout(resolve, 500);
        });
      }
    });
  `;
};

const printThermalDocument = async (settings, htmlContent, printOptions, label, { fontsReady = false } = {}) => {
  let printWindow = null;
  try {
    const paperSize = (settings.documentSize || '80mm').toLowerCase();
    const is58mm = paperSize.includes('58mm');
    const contentWidth = is58mm ? 220 : 305;

    printWindow = new BrowserWindow({
      width: contentWidth,
      height: 600,
      useContentSize: true,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
      }
    });

    printWindow.webContents.setZoomLevel(0);

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    await new Promise((resolve, reject) => {
      let stylesLoaded = false;
      let loadTimeout;

      printWindow.webContents.executeJavaScript(buildThermalWaitScript(fontsReady)).then(() => {
        stylesLoaded = true;
        clearTimeout(loadTimeout);

        printWindow.webContents.print(printOptions, (success, failureReason) => {
          if (success) {
            log.info(`${label} print completed successfully`);
            resolve(true);
          } else {
            log.error(`${label} print failed: ${failureReason}`);
            reject(new Error(failureReason || 'Print failed'));
          }
        });
      }).catch((err) => {
        if (!stylesLoaded) {
          reject(new Error(`Failed to wait for styles: ${err.message}`));
        }
      });

      // Timeout fallback
      loadTimeout = setTimeout(() => {
        if (!stylesLoaded) {
          log.warn('Style loading timeout, proceeding with print anyway');
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            if (success) {
              log.info(`${label} print completed successfully (after timeout)`);
              resolve(true);
            } else {
              log.error(`${label} print failed: ${failureReason}`);
              reject(new Error(failureReason || 'Print failed'));
            }
          });
        }
      }, 3000);

      printWindow.webContents.once('did-fail-load', (e, ec, em) => {
        clearTimeout(loadTimeout);
        reject(new Error(`Page load failed: ${em} (${ec})`));
      });
    });

    printWindow.destroy();
    printWindow = null;
    return { success: true };
  } catch (error) {
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
    }
    throw error;
  }
};

const silentPrintToken = async (event, htmlContent) => {
  try {
    const settings = state.printerSettings.tokenPrinter;
    log.info(`Starting token print to printer: ${settings.printerName || 'default'}`);
    log.info(`Token print settings: copies=${settings.copies}, silent=${settings.silentMode}`);

    const printOptions = mapSettingsToPrintOptions(settings, 'token');
    log.info('Mapped print options for token:', JSON.stringify(printOptions));
    await applyPrinterDevmode(settings, 'Token-Print');

    return await printThermalDocument(settings, htmlContent, printOptions, 'Token');
  } catch (error) {
    log.error('Error during token silent print:', error);
    return { success: false, error: error.message };
  }
};

const silentPrintPureExchange = async (event, htmlContent) => {
  try {
    const settings = state.printerSettings.tokenPrinter; // Use same thermal printer settings as token
    log.info(`Starting pure exchange print to printer: ${settings.printerName || 'default'}`);
    log.info(`Pure exchange print settings: copies=${settings.copies}, silent=${settings.silentMode}`);

    const printOptions = mapSettingsToPrintOptions(settings, 'token');
    log.info('Mapped print options for pure exchange:', JSON.stringify(printOptions));
    await applyPrinterDevmode(settings, 'PureExchange-Print');

    return await printThermalDocument(settings, htmlContent, printOptions, 'Pure exchange');
  } catch (error) {
    log.error('Error during pure exchange silent print:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// UNPAID CUSTOMER STATEMENT SILENT PRINT
// ============================================================

/**
 * The statement is 80mm thermal like the token and pure-exchange receipts, so
 * it reuses the same thermal printer settings and print-option mapping rather
 * than adding a second configuration surface. 58mm/80mm width is derived from
 * the saved paper size exactly as the token path does.
 */
const silentPrintCustomerStatement = async (event, htmlContent) => {
  try {
    const settings = state.printerSettings.tokenPrinter;
    log.info(`Starting customer statement print to printer: ${settings.printerName || 'default'}`);
    log.info(`Customer statement print settings: copies=${settings.copies}, silent=${settings.silentMode}`);

    const printOptions = mapSettingsToPrintOptions(settings, 'token');
    log.info('Mapped print options for customer statement:', JSON.stringify(printOptions));
    await applyPrinterDevmode(settings, 'CustomerStatement-Print');

    // The logo is inlined as a base64 data URI by Vite (see assetsInlineLimit in
    // vite.config.js). A data: URL document has no base path, so a normal
    // /assets/logo.png reference would silently fail to load here and print a
    // blank header.
    return await printThermalDocument(settings, htmlContent, printOptions, 'Customer statement', { fontsReady: true });
  } catch (error) {
    log.error('Error during customer statement silent print:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================
// SKIN TEST SILENT PRINT  –  PDF-based, high-quality workflow
// ============================================================

/**
 * generatePDF()
 * Renders the supplied HTML in a hidden BrowserWindow and exports it as a
 * high-resolution PDF using Electron's webContents.printToPDF().
 *
 * @param {string} htmlContent - Full HTML string to render
 * @param {string} printerName - Target printer name (used for settings lookup)
 * @returns {string} Absolute path to the saved temporary PDF file
 */
async function generatePDF(htmlContent, printerName) {
  let offscreenWindow = null;
  try {
    log.info('[SkinTest-Print] generatePDF() – creating offscreen render window');

    // Create a hidden window sized precisely to A4.
    //   • useContentSize: true  – width/height refer to the render surface, not
    //                              including any window chrome (frame:false makes
    //                              this redundant but we keep it for clarity)
    //   • backgroundColor       – explicitly opaque white so the compositor has
    //                              a known solid backdrop for every pixel; this
    //                              avoids any premultiplied-alpha colour shifts
    //                              when the PDF rasteriser blends transparent pixels
    //   • show / frame          – hidden, frameless
    offscreenWindow = new BrowserWindow({
      width: 794,
      height: 1123,
      useContentSize: true,
      show: false,
      frame: false,
      backgroundColor: '#FFFFFF',
      hasShadow: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
        sandbox: false,
        spellcheck: false,
      },
    });

    // Prevent any accidental visual glitches from animations.
    offscreenWindow.webContents.on('before-input-event', (e) => e.preventDefault());

    // Load the HTML content; data: URI keeps everything self-contained.
    await offscreenWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`,
      {
        extraHeaders: 'pragma: no-cache\n',
      }
    );

    // Wait for the page (fonts, images, layout) to fully settle.
    // Uses both document.fonts.ready and a fixed delay to cover:
    //   • web-font swap completion  (Poppins / Allura)
    //   • image decoding
    //   • Chromium's composite pass after load
    await offscreenWindow.webContents.executeJavaScript(`
      new Promise(async (resolve) => {
        const settle = () => setTimeout(resolve, 800);
        if (document.readyState === 'complete') {
          try {
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
          } catch (_) { /* ignore – older engines don't expose fonts.ready */ }
          settle();
        } else {
          window.addEventListener('load', async () => {
            try {
              if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
              }
            } catch (_) { /* ignore */ }
            settle();
          });
        }
      });
    `);

    log.info('[SkinTest-Print] generatePDF() – page settled, calling printToPDF()');

    // printToPDF options for maximum colour fidelity:
    //   • printBackground   : true  – renders every background colour, image,
    //                                 gradient, and box-shadow
    //   • preferCSSPageSize : true  – honours @page { size: A4 } declared in
    //                                 the HTML, preventing Chromium from
    //                                 overriding the paper size
    //   • pageSize          : 'A4' – explicit fallback if preferCSSPageSize
    //                                 is ignored by the underlying Skia/PDFium
    //   • landscape         : false
    //   • scaleFactor       : 100   – 1:1 scale, no zoom applied (100 = 100%)
    //   • margins.marginType: 1     – Electron enum: 0=default, 1=none,
    //                                 2=minimum. 1 forces zero margins; layout
    //                                 is handled entirely by the HTML/CSS.
    //
    // Chromium internally renders to the PDF using the sRGB colour space; the
    // PDF stream itself is vector/resolution-independent.  Actual raster DPI
    // is determined later by the printer driver when pdf-to-printer submits
    // the job – we just make sure colours are not shifted along the way.
    const pdfData = await offscreenWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4',
      landscape: false,
      scaleFactor: 100,
      margins: {
        marginType: 1,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      displayHeaderFooter: false,
    });

    const tmpDir = app.getPath('userData');
    const tmpPath = path.join(tmpDir, `skin-test-print-${Date.now()}.pdf`);
    fs.writeFileSync(tmpPath, pdfData);

    log.info(`[SkinTest-Print] generatePDF() – PDF saved to: ${tmpPath} (${(pdfData.length / 1024).toFixed(1)} KB)`);

    offscreenWindow.destroy();
    offscreenWindow = null;

    return tmpPath;
  } catch (err) {
    if (offscreenWindow && !offscreenWindow.isDestroyed()) {
      offscreenWindow.destroy();
    }
    log.error('[SkinTest-Print] generatePDF() error:', err);
    throw err;
  }
}

/**
 * printSilent()
 * Sends a PDF file directly to the target printer using pdf-to-printer.
 * No system print dialog is shown (fully silent).
 *
 * pdf-to-printer wraps SumatraPDF.  Beyond the named properties below,
 * arbitrary flags can be injected via the `options` array which are
 * appended directly to the SumatraPDF command line.
 *
 * @param {string} pdfPath       - Path to the temporary PDF file
 * @param {object} printCfg      - Print configuration
 * @param {string} printCfg.printerName  - Printer name ('' = system default)
 * @param {number} printCfg.copies       - Number of copies
 * @param {string} printCfg.quality      - 'high' | 'medium' | 'low'  (saved setting)
 * @param {string} printCfg.color        - 'color' | 'monochrome'      (saved setting)
 * @param {string} printCfg.paperType    - 'plain' | 'photo' | ...    (saved setting, optional)
 * @param {string} printCfg.paperSource  - tray/bin name              (saved setting, optional)
 *
 * IMPORTANT – driver capabilities & reality (2026-09):
 *   • paperType (DEVMODE dmMediaType) CAN now be set via devmode-helper.js
 *     using Win32 DocumentPropertiesW + SetPrinterW APIs. This applies the
 *     paper type to the printer's default DEVMODE before printing.
 *   • Only tokens explicitly listed in SumatraPDF "Printing.md" are used.
 *     Unknown tokens (e.g. "quality=high", "color=yes", "fit=no", "asr=no")
 *     can cause SumatraPDF to ignore the *whole* -print-settings string.
 *     See https://www.sumatrapdfreader.org/docs/Printing.md .
 */
async function printSilent(pdfPath, printCfg) {
  const { printerName, copies, quality, color, paperType, paperSource } = printCfg || {};
  try {
    log.info(
      `[SkinTest-Print] printSilent() – pdf: "${pdfPath}", printer: "${printerName || 'default'}", copies: ${copies}, quality: ${quality}, color: ${color}, paperType: ${paperType || 'n/a'}, paperSource: ${paperSource || 'n/a'}`
    );

    await applyPrinterDevmode({
      printerName,
      paperType,
      color,
      quality,
      copies,
    }, 'SkinTest-Print');

    // Build the standard pdf-to-printer options.  `monochrome: false` is
    // critical: without it many GDI drivers silently fall back to draft /
    // economy greyscale even when the PDF contains vector colour content.
    const options = {
      scale: 'noscale',
      paperSize: 'A4',
      monochrome: color === 'monochrome',
      copies: copies || 1,
      silent: true,
    };

    if (printerName && printerName.trim()) {
      options.printer = printerName.trim();
    }

    if (paperSource && paperSource.trim()) {
      options.bin = paperSource.trim();
    }

    // =========================================================================
    // SumatraPDF -print-settings  (ONLY tokens listed in official docs are used)
    // Docs: https://www.sumatrapdfreader.org/docs/Printing.md#-print-settings-options
    //
    // Tokens we emit — all documented and supported:
    //   • paper=A4                  – reconfirm paper SIZE at driver level
    //                                 (matches our pdf-to-printer paperSize:A4)
    //   • noscale                   – print at 100% (matches scale:'noscale')
    //   • color  |  monochrome      – force colour / grayscale rendering
    //   • disable-auto-rotation     – don't auto-rotate wide pages 90°;
    //                                 prevents an extra resample that can
    //                                 slightly shift colours
    //   • ignore-pdf-print-settings – ignore any embedded ViewerPreferences
    //                                 that would override our settings
    //
    // Tokens NOT emitted here (they are unsupported / non-documented and
    // risk having the whole -print-settings string silently ignored):
    //   • quality=<high|…>  – SumatraPDF exposes NO driver-quality token
    //     (quality is handled by omitting Electron's `quality` enum so the
    //      driver uses its native best DPI default — see mapSettingsToPrintOptions)
    //   • color=yes / color=no      – wrong syntax; use bare "color" / "monochrome"
    //   • fit=no / asr=no           – wrong syntax; use "noscale" /
    //                                  "disable-auto-rotation"
    //   • paper=photo/glossy/plain  – SumatraPDF `paper=` means PAPER SIZE,
    //                                  not MediaType. Paper type (MediaType) is
    //                                  now handled via DEVMODE before this call.
    // =========================================================================
    const driverFlags = [];

    // Colour mode: use the bare documented tokens.
    driverFlags.push(color === 'monochrome' ? 'monochrome' : 'color');

    // Exact sizing + no auto-rotate resample
    driverFlags.push('paper=A4');
    driverFlags.push('noscale');
    driverFlags.push('disable-auto-rotation');

    // Ignore any embedded PDF ViewerPreferences (PrintScaling / PickTrayByPDFSize / etc.)
    // so our explicit settings always win, regardless of how a future PDF was generated.
    driverFlags.push('ignore-pdf-print-settings');

    const settingsStr = driverFlags.join(',');
    log.info(`[SkinTest-Print] printSilent() – SumatraPDF -print-settings: "${settingsStr}" (all tokens are officially documented)`);

    // pdf-to-printer's `options` array receives raw CLI flags.
    options.options = ['-print-settings', settingsStr];

    await pdfToPrinter.print(pdfPath, options);

    log.info('[SkinTest-Print] printSilent() – job submitted successfully');
  } catch (err) {
    log.error('[SkinTest-Print] printSilent() error:', err);
    throw err;
  } finally {
    try {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
        log.info(`[SkinTest-Print] printSilent() – temp PDF removed: ${pdfPath}`);
      }
    } catch (cleanupErr) {
      log.warn('[SkinTest-Print] printSilent() – failed to remove temp PDF:', cleanupErr);
    }
  }
}

/**
 * printPage()
 * Orchestrates the full print workflow:
 *   1. generatePDF() – render HTML → PDF (high quality, A4, colour)
 *   2. printSilent() – send PDF to printer silently via pdf-to-printer
 *
 * @param {string} htmlContent - Full HTML of the skin-test certificate
 * @param {object} printCfg    - Print configuration (printerName, copies, quality, color, ...)
 * @returns {{ success: boolean, error?: string }}
 */
async function printPage(htmlContent, printCfg) {
  let pdfPath = null;
  try {
    log.info('[SkinTest-Print] printPage() – starting skin-test silent print workflow');

    pdfPath = await generatePDF(htmlContent, printCfg?.printerName || '');
    await printSilent(pdfPath, printCfg);

    log.info('[SkinTest-Print] printPage() – workflow completed successfully');
    return { success: true };
  } catch (err) {
    log.error('[SkinTest-Print] printPage() – workflow failed:', err);

    if (pdfPath) {
      try {
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      } catch (_) { /* ignore secondary cleanup error */ }
    }

    return { success: false, error: err.message };
  }
}

/**
 * IPC handler: 'silent-print-skin-test'
 * Invoked by the renderer (SkinTesting page) with the HTML certificate content.
 * Reads the saved printer settings so the caller doesn't need to pass them.
 *
 * Payload: { htmlContent: string, printerName?: string, copies?: number }
 * Returns: { success: boolean, error?: string }
 */
const silentPrintSkinTest = async (event, { htmlContent, printerName, copies }) => {
  try {
    const savedSkinTest = state.printerSettings?.skinTestPrinter || {};
    const savedToken = state.printerSettings?.tokenPrinter || {};

    const resolvedPrinter =
      printerName ||
      savedSkinTest.printerName ||
      savedToken.printerName ||
      '';

    const resolvedCopies =
      copies ||
      savedSkinTest.copies ||
      1;

    const resolvedQuality = savedSkinTest.quality || 'high';
    const resolvedColor = savedSkinTest.color || 'color';
    const resolvedPaperType = savedSkinTest.paperType || '';
    const resolvedPaperSource = savedSkinTest.paperSource || '';

    log.info(
      `[SkinTest-Print] IPC handler – printer: "${resolvedPrinter}", copies: ${resolvedCopies}, quality: ${resolvedQuality}, color: ${resolvedColor}`
    );

    const printCfg = {
      printerName: resolvedPrinter,
      copies: resolvedCopies,
      quality: resolvedQuality,
      color: resolvedColor,
      paperType: resolvedPaperType,
      paperSource: resolvedPaperSource,
    };

    const result = await printPage(htmlContent, printCfg);
    return result;
  } catch (err) {
    log.error('[SkinTest-Print] IPC handler – unexpected error:', err);
    return { success: false, error: err.message };
  }
};

// ============================================================
// END SKIN TEST SILENT PRINT
// ============================================================

const testPrint = async (event, { printerType, htmlContent }) => {
  let printWindow = null;
  try {
    const settings = printerType === 'skinTest'
      ? state.printerSettings.skinTestPrinter
      : state.printerSettings.tokenPrinter;

    log.info(`Test print for ${printerType} to: ${settings.printerName || 'default'}`);
    log.info(`Test print settings: quality=${settings.quality}, color=${settings.color}, copies=${settings.copies}`);

    const paperSize = (settings.documentSize || (printerType === 'token' ? '80mm' : 'A4')).toLowerCase();
    const is58mm = paperSize.includes('58mm');

    printWindow = new BrowserWindow({
      width: printerType === 'token' ? (is58mm ? 220 : 305) : 900,
      height: printerType === 'token' ? 600 : 1100,
      useContentSize: true,
      show: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: printerType !== 'token',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        offscreen: false,
      }
    });

    printWindow.webContents.setZoomLevel(0);

    // Build print options from the saved settings so quality/color are applied
    const printOptions = mapSettingsToPrintOptions(settings, printerType);
    // For test prints always use silent=false so the system dialog confirms the job
    printOptions.silent = false;
    log.info('Test print options:', JSON.stringify(printOptions));
    await applyPrinterDevmode(settings, `Test-${printerType}`);

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    await new Promise((resolve, reject) => {
      let printed = false;
      let loadTimeout;

      printWindow.webContents.executeJavaScript(`
        new Promise((resolve) => {
          if (document.readyState === 'complete') {
            setTimeout(resolve, 500);
          } else {
            window.addEventListener('load', () => setTimeout(resolve, 500));
          }
        });
      `).then(() => {
        printed = true;
        clearTimeout(loadTimeout);

        printWindow.webContents.print(printOptions, (success, failureReason) => {
          if (success) {
            log.info('Test print sent successfully');
            resolve(true);
          } else {
            // User cancelled the dialog – treat as non-fatal
            if (failureReason === 'cancelled') {
              log.info('Test print cancelled by user');
              resolve(false);
            } else {
              log.error(`Test print failed: ${failureReason}`);
              reject(new Error(failureReason || 'Print failed'));
            }
          }
        });
      }).catch((err) => {
        if (!printed) reject(new Error(`Failed to prepare test page: ${err.message}`));
      });

      loadTimeout = setTimeout(() => {
        if (!printed) {
          log.warn('Test print load timeout, proceeding anyway');
          printWindow.webContents.print(printOptions, (success, failureReason) => {
            if (success || failureReason === 'cancelled') resolve(success);
            else reject(new Error(failureReason || 'Print failed'));
          });
        }
      }, 3000);

      printWindow.webContents.once('did-fail-load', (e, ec, em) => {
        clearTimeout(loadTimeout);
        reject(new Error(`Page load failed: ${em} (${ec})`));
      });
    });

    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
      printWindow = null;
    }
    return { success: true, message: 'Test print sent to printer' };
  } catch (error) {
    log.error('Error during test print:', error);
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy();
    }
    return { success: false, error: error.message };
  }
};

const getPrinterSettings = () => {
  try {
    return { ...state.printerSettings };
  } catch (error) {
    log.error('Error getting printer settings:', error);
    return {
      tokenPrinter: { ...DEFAULT_TOKEN_PRINTER_SETTINGS },
      skinTestPrinter: { ...DEFAULT_SKIN_TEST_PRINTER_SETTINGS }
    };
  }
};

const updatePrinterSettings = async (event, settings) => {
  try {
    state.printerSettings = {
      tokenPrinter: {
        ...DEFAULT_TOKEN_PRINTER_SETTINGS,
        ...(settings?.tokenPrinter || {})
      },
      // Persist skin-test printer settings alongside token printer settings
      skinTestPrinter: {
        ...DEFAULT_SKIN_TEST_PRINTER_SETTINGS,
        ...(settings?.skinTestPrinter || {})
      }
    };

    const saved = saveSettingsToFile(state.printerSettings);
    log.info('Printer settings saved:', JSON.stringify(state.printerSettings, null, 2));
    return { success: saved, settings: { ...state.printerSettings } };
  } catch (error) {
    log.error('Error saving printer settings:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  silentPrintToken,
  silentPrintPureExchange,
  silentPrintCustomerStatement,
  silentPrintSkinTest,
  testPrint,
  getPrinterSettings,
  updatePrinterSettings
};
