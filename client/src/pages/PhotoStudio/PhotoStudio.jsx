import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  FiUploadCloud,
  FiDownload,
  FiRotateCcw,
  FiRotateCw,
  FiRefreshCw,
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiEye,
  FiImage,
  FiCheck,
  FiX,
} from 'react-icons/fi';
import { cn } from '../../lib/utils';
import { createInitialHistory, historyReducer, isDefaultAdjustments } from './state';
import {
  loadImageFile,
  renderGeometry,
  readPixels,
  putPixels,
  outputSize,
  orientedSize,
  canvasToBlob,
  mimeFor,
  saveBlob,
} from './imageIO';
import { renderPreview, renderFull } from './processorClient';
import PreviewStage from './components/PreviewStage';
import AdjustmentPanel from './components/AdjustmentPanel';
import ExportDialog from './components/ExportDialog';
import { ActionButton, IconButton } from './components/controls';

const formatBytes = (bytes) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
};

// Long-edge cap for an "applied" image so the baked data URL stays reasonable.
const APPLY_MAX = 3000;

export default function PhotoStudio({
  initialFile = null,
  onApply = null,
  onClose = null,
  embedded = false,
} = {}) {
  const [history, dispatch] = useReducer(historyReducer, undefined, createInitialHistory);
  const adjustments = history.present;

  const [source, setSource] = useState(null); // { source, width, height, name, type, size }
  const [activeTab, setActiveTab] = useState('basic');
  const [histogram, setHistogram] = useState(null);
  const [geometryVersion, setGeometryVersion] = useState(0);
  const [displayVersion, setDisplayVersion] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const previewSourceRef = useRef(null); // geometry-applied, unprocessed ImageData
  const renderTimer = useRef(null);
  const toastTimer = useRef(null);

  const transform = adjustments.transform;

  /* ---------------------------------------------------------- loading */

  const openFile = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await loadImageFile(file);
      setSource(loaded);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsCropping(false);
      setShowOriginal(false);
      dispatch({ type: 'RESET_ALL', silent: true });
    } catch (err) {
      setError(err.message || 'Failed to open image');
    } finally {
      setLoading(false);
    }
  }, []);

  // When launched as an embedded editor, open the provided image immediately.
  useEffect(() => {
    if (initialFile) openFile(initialFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  /* ---------------------------------------------- geometry -> preview */

  const buildPreviewSource = useCallback(() => {
    if (!source) {
      previewSourceRef.current = null;
      return;
    }
    const activeTransform = isCropping ? { ...transform, crop: null } : transform;
    const canvas = renderGeometry(source.source, activeTransform, null, true);
    previewSourceRef.current = readPixels(canvas);
    setGeometryVersion((v) => v + 1);
  }, [source, transform, isCropping]);

  // Rebuild when the image or any geometry changes.
  useEffect(() => {
    buildPreviewSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, transform.rotate90, transform.flipH, transform.flipV, transform.straighten, transform.crop, isCropping]);

  /* --------------------------------------------------- pixel pipeline */

  useEffect(() => {
    const previewSource = previewSourceRef.current;
    const canvas = canvasRef.current;
    if (!previewSource || !canvas) return undefined;

    if (showOriginal) {
      putPixels(canvas, previewSource);
      setDisplayVersion((v) => v + 1);
      return undefined;
    }

    clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(async () => {
      try {
        const result = await renderPreview(previewSource, adjustments);
        if (result.stale || !result.buffer) return;
        const imageData = new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height);
        putPixels(canvas, imageData);
        setDisplayVersion((v) => v + 1);
        if (result.histogram) setHistogram(result.histogram);
      } catch (err) {
        setError(err.message || 'Render failed');
      }
    }, 60);

    return () => clearTimeout(renderTimer.current);
  }, [adjustments, geometryVersion, showOriginal]);

  /* ------------------------------------------------------- shortcuts */

  useEffect(() => {
    const onKey = (event) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) {
        if (event.key === '[') setZoom((z) => Math.max(0.2, z / 1.15));
        if (event.key === ']') setZoom((z) => Math.min(8, z * 1.15));
        if (event.key === '0') {
          setZoom(1);
          setPan({ x: 0, y: 0 });
        }
        if (event.key === '\\') setShowOriginal((s) => !s);
        return;
      }
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if ((event.key.toLowerCase() === 'z' && event.shiftKey) || event.key.toLowerCase() === 'y') {
        event.preventDefault();
        dispatch({ type: 'REDO' });
      } else if (event.key.toLowerCase() === 'o' && !embedded) {
        event.preventDefault();
        inputRef.current?.click();
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (source && !embedded) setExportOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [source, embedded]);

  const showToast = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  /* ---------------------------------------------------------- export */

  const handleExport = async (options) => {
    if (!source) return;
    setExporting(true);
    try {
      const activeTransform = transform;
      const oriented = orientedSize(source.source, activeTransform);
      const c = activeTransform.crop || { x: 0, y: 0, width: 1, height: 1 };
      const cw = c.width * oriented.width;
      const ch = c.height * oriented.height;
      let targetW;
      if (options.sizeMode === 'custom') {
        const s = options.longEdge / Math.max(cw, ch);
        targetW = Math.max(1, Math.round(cw * s));
      } else {
        targetW = Math.max(1, Math.round(cw));
      }

      const geometryCanvas = renderGeometry(source.source, activeTransform, { width: targetW }, false);
      const imageData = readPixels(geometryCanvas);
      const result = await renderFull(imageData, adjustments);
      if (!result.buffer) throw new Error('Render failed');
      const processed = new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height);

      const temp = document.createElement('canvas');
      putPixels(temp, processed);

      let finalCanvas = temp;
      if (options.format === 'jpeg') {
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = temp.width;
        finalCanvas.height = temp.height;
        const ctx = finalCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
        ctx.drawImage(temp, 0, 0);
      }

      const blob = await canvasToBlob(finalCanvas, mimeFor(options.format), options.quality);
      const res = await saveBlob(blob, options.filename);
      if (res.saved) {
        showToast(`Exported ${options.filename}`);
        setExportOpen(false);
      }
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  /* ----------------------------------------------------------- apply */

  const handleApply = async () => {
    if (!source || !onApply) return;

    // Nothing edited and the original file/URL is still available: hand it back
    // untouched so we do not add a lossy JPEG re-encode for no reason (and do
    // not accumulate generation loss across repeated open/apply cycles).
    if (isDefaultAdjustments(adjustments) && typeof initialFile === 'string' && initialFile) {
      onApply(initialFile);
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const activeTransform = transform;
      const oriented = orientedSize(source.source, activeTransform);
      const c = activeTransform.crop || { x: 0, y: 0, width: 1, height: 1 };
      const cw = c.width * oriented.width;
      const ch = c.height * oriented.height;
      const scale = Math.min(1, APPLY_MAX / Math.max(cw, ch));
      const targetW = Math.max(1, Math.round(cw * scale));

      const geometryCanvas = renderGeometry(source.source, activeTransform, { width: targetW }, false);
      const imageData = readPixels(geometryCanvas);
      const result = await renderFull(imageData, adjustments);
      if (!result.buffer) throw new Error('Render failed');
      const processed = new ImageData(new Uint8ClampedArray(result.buffer), result.width, result.height);

      const temp = document.createElement('canvas');
      putPixels(temp, processed);
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = temp.width;
      finalCanvas.height = temp.height;
      const ctx = finalCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
      ctx.drawImage(temp, 0, 0);

      onApply(finalCanvas.toDataURL('image/jpeg', 0.95));
    } catch (err) {
      setError(err.message || 'Apply failed');
    } finally {
      setExporting(false);
    }
  };

  /* ----------------------------------------------------------- render */

  const cropTransform = isCropping ? { ...transform, crop: null } : transform;
  const outSize = source ? outputSize(source.source, cropTransform, null) : null;

  const placeholder = !source && (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400">
      <FiImage size={48} className="mb-3 text-slate-300" />
      <p className="text-sm font-medium text-slate-500">No image open</p>
      <p className="mt-1 text-xs">Open a jewellery photo to start editing</p>
    </div>
  );

  return (
    <div
      className="flex flex-col overflow-hidden bg-slate-50"
      style={{ height: embedded ? '100%' : 'calc(100dvh - 4rem)' }}
    >
      {/* Header / toolbar */}
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="mr-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5EAD1] text-[#9A7019]">
            <FiImage size={16} />
          </span>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold text-slate-800">Photo Studio</h1>
            <p className="text-[10px] text-slate-400">
              {source ? (
                <>
                  {source.name} · {outSize?.width}×{outSize?.height} · {formatBytes(source.size)}
                </>
              ) : (
                'Non-destructive editor'
              )}
            </p>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => openFile(event.target.files?.[0])}
        />

        {!embedded && (
          <>
            <ActionButton onClick={() => inputRef.current?.click()}>
              <FiUploadCloud size={14} /> Open
            </ActionButton>

            <div className="mx-1 h-6 w-px bg-slate-200" />
          </>
        )}

        <IconButton
          title="Undo (Ctrl+Z)"
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={!history.past.length}
        >
          <FiRotateCcw size={15} />
        </IconButton>
        <IconButton
          title="Redo (Ctrl+Shift+Z)"
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={!history.future.length}
        >
          <FiRotateCw size={15} />
        </IconButton>

        <div className="mx-1 h-6 w-px bg-slate-200" />

        <IconButton
          title="Toggle original (\\ )"
          active={showOriginal}
          disabled={!source}
          onClick={() => setShowOriginal((s) => !s)}
        >
          <FiEye size={15} />
        </IconButton>
        <ActionButton
          variant={showOriginal ? 'primary' : 'ghost'}
          disabled={!source}
          onClick={() => setShowOriginal((s) => !s)}
        >
          Before / After
        </ActionButton>

        <div className="ml-auto flex items-center gap-2">
          <ActionButton
            variant="danger"
            disabled={!source}
            onClick={() => dispatch({ type: 'RESET_ALL' })}
          >
            <FiRefreshCw size={13} /> Reset all
          </ActionButton>
          {embedded ? (
            <>
              <ActionButton variant="ghost" onClick={onClose}>
                <FiX size={13} /> Cancel
              </ActionButton>
              <ActionButton variant="primary" disabled={!source || exporting} onClick={handleApply}>
                <FiCheck size={13} /> {exporting ? 'Applying…' : 'Apply'}
              </ActionButton>
            </>
          ) : (
            <ActionButton
              variant="primary"
              disabled={!source}
              onClick={() => setExportOpen(true)}
            >
              <FiDownload size={13} /> Export
            </ActionButton>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <div
          className={cn('relative flex min-h-0 min-w-0 flex-1 flex-col', dragging && 'ring-2 ring-inset ring-[#C69A32]')}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            openFile(event.dataTransfer.files?.[0]);
          }}
        >
          <PreviewStage
            canvasRef={canvasRef}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
            isCropping={isCropping}
            crop={transform.crop}
            onCropChange={(crop) => dispatch({ type: 'SET', path: ['transform', 'crop'], value: crop, group: 'crop' })}
            renderVersion={displayVersion}
            hasImage={!!source}
            placeholder={placeholder}
          />

          {/* Zoom bar */}
          <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-white/80 px-3 py-1.5 backdrop-blur">
            <IconButton
              title="Zoom out ([)"
              disabled={!source}
              onClick={() => setZoom((z) => Math.max(0.2, z / 1.15))}
            >
              <FiZoomOut size={15} />
            </IconButton>
            <button
              type="button"
              className="min-w-[52px] rounded-md px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 hover:bg-slate-100"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              title="Fit to screen (0)"
            >
              {Math.round(zoom * 100)}%
            </button>
            <IconButton
              title="Zoom in (])"
              disabled={!source}
              onClick={() => setZoom((z) => Math.min(8, z * 1.15))}
            >
              <FiZoomIn size={15} />
            </IconButton>
            <IconButton
              title="Fit to screen (0)"
              disabled={!source}
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              <FiMaximize size={15} />
            </IconButton>
            {isCropping && (
              <span className="ml-3 rounded-full bg-[#F5EAD1] px-3 py-0.5 text-[11px] font-medium text-[#9A7019]">
                Cropping — drag handles, then “Done”
              </span>
            )}
          </div>

          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#C69A32]/30 border-t-[#C69A32]" />
                <span className="text-xs font-medium text-slate-500">Loading image…</span>
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <aside className="flex w-[320px] shrink-0 flex-col overflow-hidden border-l border-slate-200 xl:w-[350px]">
          {source ? (
            <AdjustmentPanel
              adjustments={adjustments}
              dispatch={dispatch}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              histogram={histogram}
              isCropping={isCropping}
              onToggleCrop={() => setIsCropping((c) => !c)}
              onResetCrop={() =>
                dispatch({ type: 'SET', path: ['transform', 'crop'], value: null, group: 'crop' })
              }
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-slate-400">
              <FiImage size={32} className="text-slate-300" />
              <p className="text-xs">Adjustment tools appear once an image is open.</p>
            </div>
          )}
        </aside>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="font-medium underline">
            Dismiss
          </button>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      {!embedded && (
        <ExportDialog
          open={exportOpen}
          busy={exporting}
          onClose={() => !exporting && setExportOpen(false)}
          onExport={handleExport}
          defaultName={source ? source.name.replace(/\.[^.]+$/, '') : 'photo'}
          sourceSize={outSize}
        />
      )}
    </div>
  );
}
