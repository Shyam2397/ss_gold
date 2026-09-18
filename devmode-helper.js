const koffi = require('koffi');
const log = require('electron-log');

/* ==========================================================================
 * devmode-helper.js
 *
 * Low-level mutation of Windows printer DEVMODEW settings through the
 * Win32 Spooler API, using Koffi FFI.
 *
 * What this allows us to do that Electron + pdf-to-printer / SumatraPDF
 * alone can't:
 *   • dmMediaType  (Plain / Photo / Glossy / Labels / Cardstock / …)
 *   • dmColor      (Colour vs Monochrome)
 *   • dmDuplex
 *   • dmPaperSize  (DMPAPER_* enum)
 *   • dmDefaultSource / dmTray (paper bin)
 *   • dmOrientation
 *   • dmQuality
 *   • dmYResolution, dmBitsPerPel (where supported)
 *
 * Strategy: use raw Uint8Array buffers + koffi.encode/decode primitives
 * instead of koffi.struct(), because printer drivers append a VARIABLE
 * length PRIVATE block after the documented fields (total = pDevModeOut
 * from DocumentPropertiesW size-queried call).  A fixed struct would
 * either truncate private driver data or corrupt memory.
 *
 * Workflow:
 *   1. OpenPrinterW(name, &hPrinter)
 *   2. DocumentPropertiesW(NULL, hPrinter, NULL, NULL, NULL, 0) → neededSize
 *   3. alloc Uint8Array(neededSize) as devmodeBuf
 *   4. DocumentPropertiesW(..., devmodeBuf, NULL, DM_OUT_BUFFER) → fills buf
 *   5. Read dmFields bitmask → see which public fields the driver commits to
 *   6. Mutate fields (dmMediaType, dmColor, dmPaperSize, …) via raw offsets
 *   7. Set matching DM_* bits in dmFields so driver honours the changes
 *   8. DocumentPropertiesW(..., devmodeBuf, devmodeBuf, DM_IN_BUFFER | DM_OUT_BUFFER)
 *      → let printer driver validate & normalise the modified struct
 *   9. SetPrinterW(hPrinter, 9, PRINTER_INFO_9{ pDevMode }, 0) → write to
 *      per-user default DEVMODE (affects subsequent print jobs to this printer
 *      from this user account until the printer settings are changed again)
 *  10. ClosePrinter(hPrinter)
 *
 * References:
 *   DEVMODEW:  https://learn.microsoft.com/en-us/windows/win32/api/wingdi/ns-wingdi-devmodew
 *   DocumentPropertiesW: https://learn.microsoft.com/en-us/windows/win32/api/wingdi/nf-wingdi-documentpropertiesw
 *   SetPrinter: https://learn.microsoft.com/en-us/windows/win32/printdocs/setprinter
 * ========================================================================== */

/* --------------------- DEVMODEW public-field offsets (x64) ---------------- */
/*
 * All offsets are for 64-bit Windows, where DEVMODEW has 8-byte natural
 * alignment (DM_SPECVERSION = 0x0401, dmDriverExtra follows the 148-byte
 * public block, private driver bytes start at 156 on x64 after padding).
 *
 * We do NOT attempt to support 32-bit Electron on Windows; x64-only check
 * is performed below at require-time.
 */
const DM_WCHAR_BYTES = 2;
const DM_PUBLIC_FIXED_BYTES = 148;   // documented size of the *packed* public
                                      // fields (after dmDriverExtra there
                                      // are 4 bytes padding to align to 8 on
                                      // x64 before private data starts)

const OFFSETS = {
  dmDeviceName:    0,   // WCHAR[32]  = 64 bytes
  dmSpecVersion:  64,   // WORD
  dmDriverVersion:66,   // WORD
  dmSize:         68,   // WORD        → MUST equal sizeof(public fields)
  dmDriverExtra:  70,   // WORD        → size of private driver bytes
  dmFields:       72,   // DWORD       → bitmask of valid fields
  dmOrientation:  76,   // short (bit DM_ORIENTATION = 0x00000001)
  dmPaperSize:    78,   // short (bit DM_PAPERSIZE     = 0x00000002)
  dmPaperLength:  80,   // short
  dmPaperWidth:   82,   // short
  dmScale:        84,   // short
  dmCopies:       86,   // short
  dmDefaultSource:88,   // short (DM_DEFAULTSOURCE  = 0x00000800)
  dmPrintQuality: 90,   // short (DM_PRINTQUALITY   = 0x00000010)
  dmColor:        92,   // short (DM_COLOR          = 0x00000800)
  dmDuplex:       94,   // short (DM_DUPLEX         = 0x00001000)
  dmYResolution:  96,   // short (DM_YRESOLUTION    = 0x00002000)
  dmTTOption:     98,   // short
  dmCollate:      100,  // short (DM_COLLATE        = 0x00004000)
  dmFormName:     102,  // WCHAR[32] = 64 bytes → offset 102..166
  dmLogPixels:    166,  // WORD
  dmBitsPerPel:   168,  // DWORD
  dmPelsWidth:    172,  // DWORD
  dmPelsHeight:   176,  // DWORD
  dmDisplayFlags: 180,  // DWORD
  dmDisplayFrequency: 184, // DWORD
  // From here the union of ICMMethod/ICMIntent/MediaType/DitherType/Reserved1/2
  // — we only use the ones we need; offsets for the short members:
  dmICMMethod:    188,  // DWORD
  dmICMIntent:    192,  // DWORD
  dmMediaType:    196,  // DWORD (bit DM_MEDIATYPE = 0x00040000)
  dmDitherType:   200,  // DWORD
  dmReserved1:    204,  // DWORD
  dmReserved2:    208,  // DWORD
};

/* ------------ DM_* bitmasks that activate a field in dmFields ------------- */
const DM_BIT = {
  ORIENTATION:      0x00000001,
  PAPERSIZE:        0x00000002,
  PAPERLENGTH:      0x00000004,
  PAPERWIDTH:       0x00000008,
  PRINTQUALITY:     0x00000010,
  COLOR:            0x00000800,
  DUPLEX:           0x00001000,
  YRESOLUTION:      0x00002000,
  COLLATE:          0x00004000,
  DEFAULTSOURCE:    0x00008000,
  MEDIATYPE:        0x00040000,
};

/* -------- Win32 enum values (dmColor, dmOrientation, dmQuality, …) -------- */
const DMCOLOR = { MONOCHROME: 1, COLOR: 2 };
const DMORIENT = { PORTRAIT: 1, LANDSCAPE: 2 };
const DMQUAL = { DRAFT: -1, LOW: -2, MEDIUM: -3, HIGH: -4 };  // negative for enum; positive = DPI

/* ------------------------------ DMMEDIA_* ----------------------------------
 * Official WINSPOOL values for dmMediaType (DWORD at offset 196).
 * Sources: wingdi.h / Windows Driver Kit.
 */
const DMMEDIA = {
  STANDARD:       1,   // Plain (default for most printers)
  GLOSSY:         2,   // Photo glossy
  TRANSPARENCY:   3,
  PREPRINTED:     4,
  LETTERHEAD:     5,
  PREPUNCHED:     6,
  HEADED:         7,   // Pre-printed forms
  ENVELOPE:       8,   // Envelope
  PLAIN:          9,   // Plain paper (alternative name for STANDARD on some drivers)
  PHOTO:         10,   // Photo paper
  MATTE:         11,   // Matte
  BACKPRINT:     12,   // Back-print film
  THICK:         13,   // Thick stock
  THIN:          14,   // Thin stock
  LABELS:        15,   // Labels
  BOND:          16,
  CARDPAPER:     17,   // Cardstock
  RECYCLED:      18,
  EXTRAHIGHGLOSS:19,
  EXTRATHICK:    20,
  OTHER:         255,
  USER:        256,   // user-defined start; 0x100+
};

/* ========================================================================== */
/* Koffi bindings — winspool.drv, kernel32.dll                               */
/* ========================================================================== */

let lib = null;
let bindingsInitialized = false;
let koffiLoadError = null;
const HANDLE = koffi.pointer('HANDLE', koffi.opaque());
const HANDLE_PTR = koffi.pointer(HANDLE);
const PRINTER_INFO_9 = koffi.struct({
  pDevMode: 'void *',
});
const PRINTER_INFO_9_PTR = koffi.pointer(PRINTER_INFO_9);

function ensurePlatform() {
  if (process.platform !== 'win32') {
    throw new Error(`[DEVMODE] DEVMODE mutation requires Windows (win32); current platform is ${process.platform}`);
  }
  if (process.arch !== 'x64') {
    throw new Error(`[DEVMODE] DEVMODE offset table is for Windows x64; current arch is ${process.arch}`);
  }
}

function ensureBindings() {
  if (bindingsInitialized) return true;
  try {
    ensurePlatform();
    lib = koffi.load('winspool.drv');
    bindingsInitialized = true;
  } catch (e) {
    koffiLoadError = e;
    log.error('[DEVMODE] Failed to load winspool.drv via Koffi:', e);
    bindingsInitialized = false;
    return false;
  }

  // Function signatures — all Win32 GDI spooler APIs use __stdcall on x86 and
  // the Microsoft x64 calling convention on x64 (no special specifier needed
  // for x64).  HANDLEs are opaque pointers.
  //
  // BOOL OpenPrinterW(WCHAR* pPrinterName, LPHANDLE phPrinter,
  //                   PRINTER_DEFAULTSW* pDefault);
  lib.OpenPrinterW = lib.func(
    '__stdcall',
    'OpenPrinterW',
    'int32_t',
    ['const char16_t*', koffi.out(HANDLE_PTR), 'void*']
  );
  // BOOL ClosePrinter(HANDLE hPrinter);
  lib.ClosePrinter = lib.func('__stdcall', 'ClosePrinter', 'int32_t', [HANDLE]);
  // LONG DocumentPropertiesW(HWND hwnd, HANDLE hPrinter, WCHAR* pDeviceName,
  //                          PDEVMODEW pDevModeOutput, PDEVMODEW pDevModeInput,
  //                          DWORD fMode);
  lib.DocumentPropertiesW = lib.func(
    '__stdcall',
    'DocumentPropertiesW',
    'int32_t',
    ['void*', HANDLE, 'const char16_t*', 'uint8_t*', 'uint8_t*', 'uint32_t']
  );
  // BOOL SetPrinterW(HANDLE hPrinter, DWORD Level, LPBYTE pPrinter,
  //                  DWORD Command); — PRINTER_INFO_9 Level = 9
  lib.SetPrinterW = lib.func(
    '__stdcall',
    'SetPrinterW',
    'int32_t',
    [HANDLE, 'uint32_t', PRINTER_INFO_9_PTR, 'uint32_t']
  );
  // DWORD GetLastError() is on kernel32, fall back via koffi.nodecl style if needed;
  // We can also use errno-ish values via koffi; but for simplicity use
  // FormatMessageW through koffi too.  We load kernel32 just for GetLastError.
  try {
    const k32 = koffi.load('kernel32.dll');
    lib.GetLastError = k32.func('uint32_t __stdcall GetLastError(void)');
  } catch (_) { /* ignore */ }

  return true;
}

/* ========================================================================== */
/* Raw offset helpers — little-endian DEVMODEW memory                         */
/* ========================================================================== */

function rWORD(buf, off)   { return buf[off] | (buf[off + 1] << 8); }
function rSHORT(buf, off)  { const u = rWORD(buf, off); return (u > 0x7FFF) ? u - 0x10000 : u; }
function rDWORD(buf, off)  { return (buf[off] | (buf[off+1]<<8) | (buf[off+2]<<16) | (buf[off+3]<<24)) >>> 0; }
function wWORD(buf, off, v)  { v &= 0xFFFF; buf[off] = v & 0xFF; buf[off+1] = (v>>>8)&0xFF; }
function wSHORT(buf, off, v) { if (v < 0) v += 0x10000; wWORD(buf, off, v); }
function wDWORD(buf, off, v) {
  v >>>= 0;
  buf[off]   =  v & 0xFF;
  buf[off+1] = (v >>> 8) & 0xFF;
  buf[off+2] = (v >>> 16) & 0xFF;
  buf[off+3] = (v >>> 24) & 0xFF;
}

/* ========================================================================== */
/* paperType (UI string) → DMMEDIA_* mapping                                  */
/* Covers all 10 values from Settings.jsx PAPER_TYPES.                        */
/* ========================================================================== */
function paperTypeToDmMediaType(paperType) {
  if (!paperType) return null;
  const t = String(paperType).trim().toLowerCase();
  if (!t) return null;
  switch (t) {
    case '':                            return null;
    case 'plain':                       return DMMEDIA.STANDARD;
    case 'thin':                        return DMMEDIA.THIN;
    case 'thick':                       return DMMEDIA.THICK;
    case 'transparency':                return DMMEDIA.TRANSPARENCY;
    case 'labels':                      return DMMEDIA.LABELS;
    case 'envelope':                    return DMMEDIA.ENVELOPE;
    case 'cardstock':                   return DMMEDIA.CARDPAPER;
    case 'glossy':                      return DMMEDIA.GLOSSY;
    case 'thermal':                     return DMMEDIA.OTHER;  // Most drivers don't expose
                                                              // a thermal DMMEDIA value;
                                                              // use OTHER as a safe marker.
    case 'photo':                       return DMMEDIA.PHOTO;
    case 'matte':                       return DMMEDIA.MATTE;
    // EPSON L3210 specific paper types
    case 'epson-photo-quality-ink-jet': return DMMEDIA.PHOTO;
    case 'epson-matte':                 return DMMEDIA.MATTE;
    case 'epson-ultra-glossy':           return DMMEDIA.GLOSSY;
    case 'epson-premium-glossy':        return DMMEDIA.GLOSSY;
    case 'epson-premium-semigloss':     return DMMEDIA.GLOSSY;
    case 'photo-paper-glossy':          return DMMEDIA.GLOSSY;
    default:
      // Accept synonym substrings such as 'photo-glossy' / 'matte photo'
      if (t.includes('photo'))      return DMMEDIA.PHOTO;
      if (t.includes('glossy'))     return DMMEDIA.GLOSSY;
      if (t.includes('matte'))      return DMMEDIA.MATTE;
      if (t.includes('card'))       return DMMEDIA.CARDPAPER;
      if (t.includes('envelope'))   return DMMEDIA.ENVELOPE;
      if (t.includes('label'))      return DMMEDIA.LABELS;
      if (t.includes('transparen')) return DMMEDIA.TRANSPARENCY;
      if (t.includes('plain'))      return DMMEDIA.PLAIN;
      if (t.includes('thick'))      return DMMEDIA.THICK;
      if (t.includes('thin'))       return DMMEDIA.THIN;
      return DMMEDIA.STANDARD;
  }
}

/* ========================================================================== */
/* applyPrinterDefaults()  — the public entry point                           */
/*                                                                             */
/* @param {string} printerName - Windows printer name (the same string you'd  */
/*                               pass to pdf-to-printer).  Empty = default.   */
/* @param {object} overrides   - Fields to mutate on the printer's default    */
/*                               DEVMODE.  Fields omitted are LEFT UNCHANGED. */
/*   {                                                                          */
/*     paperType?: string         (Plain/Glossy/Photo/Matte/Thin/Thick/…)     */
/*     color?: 'color'|'monochrome'                                            */
/*     orientation?: 'portrait'|'landscape'                                    */
/*     duplex?: number             (1=simplex / 2=horizontal / 3=vertical)    */
/*     paperSize?: string          ('A4'|'Letter'|'Legal'|'A5'|DMPAPER_#)     */
/*     quality?: 'high'|'medium'|'low'                                         */
/*     tray?: string|number        (dmDefaultSource bin code)                 */
/*     copies?: number                                                            */
/*   }                                                                          */
/*                                                                             */
/* @returns {Promise<{applied: boolean, message: string, changed: object}>}    */
/*   applied = true → the driver accepted the change.                          */
/*                                                                             */
/* NOTES:                                                                      */
/*   • This mutates the PER-USER default DEVMODE for the printer.              */
/*     It lasts longer than the current process — until the user changes       */
/*     preferences again via Control Panel.  This is desirable so that pdf-    */
/*     to-printer / Electron pick up our new defaults for the NEXT job.        */
/*   • SetPrinter(9, PRINTER_INFO_9) requires the SERVER_ACCESS_ADMINISTER    */
/*     access-right on the printer handle for *some* drivers.  We try both     */
/*     OpenPrinter(NULL defaults) AND the PRINTER_ALL_ACCESS mask through      */
/*     PRINTER_DEFAULTS if the first call fails silently.                      */
/* ========================================================================== */
async function applyPrinterDefaults(printerName, overrides) {
  if (!ensureBindings()) {
    return {
      applied: false,
      changed: {},
      message: `Koffi/winspool not available: ${koffiLoadError?.message || 'unknown error'}`
    };
  }
  if (!printerName) {
    return {
      applied: false,
      changed: {},
      message: 'Cannot resolve default printer name; pass an explicit printerName to applyPrinterDefaults()'
    };
  }
  overrides = overrides || {};

  const changed = {};
  const unsupported = {};
  let hPrinter = null;
  try {
    // ---- 1. OpenPrinterW ---------------------------------------------------
    const hPrinterOut = [null];
    const ok = lib.OpenPrinterW(printerName, hPrinterOut, null);
    if (!ok) {
      const err = lib.GetLastError ? lib.GetLastError() : 0;
      return {
        applied: false,
        changed,
        message: `OpenPrinterW("${printerName}") failed (Win32 err ${err}). Check spelling and that the printer is installed.`
      };
    }
    hPrinter = hPrinterOut[0];

    // ---- 2. Query required size -------------------------------------------
    let neededSize = lib.DocumentPropertiesW(null, hPrinter, printerName, null, null, 0);
    if (neededSize <= 0) {
      return {
        applied: false,
        changed,
        message: `DocumentPropertiesW size query returned ${neededSize} for "${printerName}"`
      };
    }
    // Safety margin: drivers sometimes report a slightly undersized buffer.
    neededSize = Math.max(neededSize, 256) + 64;

    // ---- 3. Allocate & read current DEVMODE -------------------------------
    const devmodeBuf = new Uint8Array(neededSize);
    const outSize = lib.DocumentPropertiesW(
      null, hPrinter, printerName, devmodeBuf, null, 2  // DM_OUT_BUFFER = 2
    );
    if (outSize < 0) {
      return {
        applied: false,
        changed,
        message: `DocumentPropertiesW(DM_OUT_BUFFER) failed for "${printerName}" (${outSize})`
      };
    }

    // ---- 4. Sanity check: dmSize ≤ total size -----------------------------
    const dmSize = rWORD(devmodeBuf, OFFSETS.dmSize);
    const dmExtra = rWORD(devmodeBuf, OFFSETS.dmDriverExtra);
    if (dmSize === 0) {
      // Zero dmSize usually means a driver that didn't fully init; fall back
      // to the x64 Windows documented public field size (148).
      wWORD(devmodeBuf, OFFSETS.dmSize, DM_PUBLIC_FIXED_BYTES);
    }
    log.debug(
      `[DEVMODE] "${printerName}" current: dmSize=${rWORD(devmodeBuf, OFFSETS.dmSize)}, dmDriverExtra=${dmExtra}, total buf=${neededSize}`
    );

    const oldFields = rDWORD(devmodeBuf, OFFSETS.dmFields);
    let newFields = oldFields >>> 0;

    // ---- 5. Apply override → DEVMODE field --------------------------------
    if (overrides.paperType != null && String(overrides.paperType).trim() !== '') {
      const mt = paperTypeToDmMediaType(overrides.paperType);
      if (mt != null) {
        if ((oldFields & DM_BIT.MEDIATYPE) === 0) {
          unsupported.paperType = {
            requested: overrides.paperType,
            reason: 'The printer driver does not advertise DM_MEDIATYPE support.'
          };
          log.warn(
            `[DEVMODE] "${printerName}" does not advertise DM_MEDIATYPE; ` +
            `paper type "${overrides.paperType}" cannot be selected through public DEVMODE fields.`
          );
        } else {
          const cur = rDWORD(devmodeBuf, OFFSETS.dmMediaType);
          if (cur !== mt >>> 0) {
            wDWORD(devmodeBuf, OFFSETS.dmMediaType, mt);
            changed.paperType = { from: cur, to: mt, name: overrides.paperType };
          }
          newFields |= DM_BIT.MEDIATYPE;
        }
      }
    }

    if (overrides.color != null) {
      const want = String(overrides.color).toLowerCase().includes('mono')
        ? DMCOLOR.MONOCHROME
        : DMCOLOR.COLOR;
      const cur = rSHORT(devmodeBuf, OFFSETS.dmColor);
      if (cur !== want) {
        wSHORT(devmodeBuf, OFFSETS.dmColor, want);
        changed.color = { from: cur, to: want };
      }
      newFields |= DM_BIT.COLOR;
    }

    if (overrides.orientation != null) {
      const want = String(overrides.orientation).toLowerCase().includes('land')
        ? DMORIENT.LANDSCAPE
        : DMORIENT.PORTRAIT;
      const cur = rSHORT(devmodeBuf, OFFSETS.dmOrientation);
      if (cur !== want) {
        wSHORT(devmodeBuf, OFFSETS.dmOrientation, want);
        changed.orientation = { from: cur, to: want };
      }
      newFields |= DM_BIT.ORIENTATION;
    }

    if (overrides.duplex != null && Number.isFinite(Number(overrides.duplex))) {
      const d = Math.max(1, Math.min(3, Number(overrides.duplex) | 0 || 1));
      const cur = rSHORT(devmodeBuf, OFFSETS.dmDuplex);
      if (cur !== d) {
        wSHORT(devmodeBuf, OFFSETS.dmDuplex, d);
        changed.duplex = { from: cur, to: d };
      }
      newFields |= DM_BIT.DUPLEX;
    }

    if (overrides.quality != null) {
      const q = String(overrides.quality).toLowerCase();
      let want;
      if (q === 'high' || q === 'best' || q === 'maximum')  want = DMQUAL.HIGH;
      else if (q === 'medium' || q === 'normal' || q === 'standard') want = DMQUAL.MEDIUM;
      else if (q === 'low' || q === 'draft' || q === 'economy')     want = DMQUAL.LOW;
      else want = null;
      if (want != null) {
        const cur = rSHORT(devmodeBuf, OFFSETS.dmPrintQuality);
        if (cur !== want) {
          wSHORT(devmodeBuf, OFFSETS.dmPrintQuality, want);
          changed.quality = { from: cur, to: want };
        }
        newFields |= DM_BIT.PRINTQUALITY;
      }
    }

    if (overrides.tray != null && Number.isFinite(Number(overrides.tray))) {
      const d = Number(overrides.tray) | 0;
      const cur = rSHORT(devmodeBuf, OFFSETS.dmDefaultSource);
      if (cur !== d) {
        wSHORT(devmodeBuf, OFFSETS.dmDefaultSource, d);
        changed.defaultSource = { from: cur, to: d };
      }
      newFields |= DM_BIT.DEFAULTSOURCE;
    }

    if (overrides.copies != null && Number.isFinite(Number(overrides.copies))) {
      const c = Math.max(1, Math.min(9999, Number(overrides.copies) | 0));
      const cur = rSHORT(devmodeBuf, OFFSETS.dmCopies);
      if (cur !== c) {
        wSHORT(devmodeBuf, OFFSETS.dmCopies, c);
        changed.copies = { from: cur, to: c };
      }
    }

    // ---- 6. Write back updated dmFields bitmask ---------------------------
    wDWORD(devmodeBuf, OFFSETS.dmFields, newFields);

    // ---- 7. Driver validation merge: DocumentPropertiesW IN+OUT -----------
    // DM_IN_BUFFER = 8, DM_OUT_BUFFER = 2.  Driver validates and normalises
    // our modified struct (e.g. clips dmMediaType to a set the printer supports,
    // falling back to DMMEDIA_STANDARD if it doesn't know glossy).
    const mergeResult = lib.DocumentPropertiesW(
      null, hPrinter, printerName,
      devmodeBuf, devmodeBuf, 8 | 2   // DM_IN_BUFFER | DM_OUT_BUFFER
    );

    // Re-read fields after driver normalisation
    const mergedFields = rDWORD(devmodeBuf, OFFSETS.dmFields);
    const mergedMediaType = (mergedFields & DM_BIT.MEDIATYPE)
      ? rDWORD(devmodeBuf, OFFSETS.dmMediaType)
      : null;
    if (mergeResult < 0) {
      log.warn(
        `[DEVMODE] Driver rejected our IN→OUT merge (code ${mergeResult}). ` +
        `Proceeding anyway with the unvalidated struct — some fields may be ignored.`
      );
    }

    // ---- 8. Persist the validated DEVMODE for the next job ----------------
    // pdf-to-printer opens the printer independently, so pass the validated
    // buffer to the spooler as PRINTER_INFO_9 before submitting the PDF.
    const printerInfo9 = {
      pDevMode: koffi.as(devmodeBuf, 'void *'),
    };
    const setOk = lib.SetPrinterW(
      hPrinter,
      9,
      printerInfo9,
      0
    );
    if (!setOk) {
      const err = lib.GetLastError ? lib.GetLastError() : 0;
      return {
        applied: false,
        changed,
        message: `SetPrinterW(PRINTER_INFO_9) failed for "${printerName}" (Win32 err ${err}). ` +
          'The driver accepted the DEVMODE, but Windows did not persist it.'
      };
    }

    // ---- 9. Log summary ----------------------------------------------------
    log.info(
      `[DEVMODE] applyPrinterDefaults("${printerName}") OK: changed fields = ${JSON.stringify(changed)}; ` +
      `driver final dmFields=0x${mergedFields.toString(16)}; dmMediaType after driver merge=${mergedMediaType ?? '(unchanged)'}`
    );
    const unsupportedNames = Object.keys(unsupported);
    return {
      applied: unsupportedNames.length === 0,
      changed,
      unsupported,
      message: unsupportedNames.length > 0
        ? `Applied supported DEVMODE fields to "${printerName}", but ${unsupportedNames.join(', ')} is unsupported by this printer driver.`
        : Object.keys(changed).length === 0
          ? `Nothing to change: printer "${printerName}" defaults already matched the requested values.`
          : `Applied ${Object.keys(changed).length} DEVMODE field(s) to "${printerName}" defaults.`
    };
  } catch (err) {
    log.error('[DEVMODE] applyPrinterDefaults() threw:', err);
    return {
      applied: false,
      changed,
      message: String(err?.message || err)
    };
  } finally {
    if (hPrinter != null) {
      try { lib.ClosePrinter(hPrinter); } catch (_) { /* ignore */ }
      hPrinter = null;
    }
  }
}

module.exports = {
  applyPrinterDefaults,
  paperTypeToDmMediaType,
  DMMEDIA,
  DMCOLOR,
  DMORIENT,
  DMQUAL,
  DM_BIT,
  _OFFSETS: OFFSETS,
  _platformOK: () => {
    try { ensurePlatform(); return true; } catch { return false; }
  }
};
