import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * Hands-on preview surface: fits the rendered canvas to the viewport, supports
 * wheel-zoom + drag-pan, and hosts the crop overlay while cropping.
 *
 * The canvas is authored by the parent (PhotoStudio) which paints processed
 * pixels into it. This component only measures and decorates.
 */
export default function PreviewStage({
  canvasRef,
  zoom,
  setZoom,
  pan,
  setPan,
  isCropping,
  crop,
  onCropChange,
  renderVersion,
  hasImage,
  placeholder,
}) {
  const stageRef = useRef(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [fit, setFit] = useState({ w: 0, h: 0 });
  const dragRef = useRef(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => {
      setStage({ w: el.clientWidth, h: el.clientHeight });
    });
    ro.observe(el);
    setStage({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!hasImage || !canvas || !canvas.width || !canvas.height || !stage.w || !stage.h) {
      setFit({ w: 0, h: 0 });
      return;
    }
    const pad = 32;
    const maxW = stage.w - pad;
    const maxH = stage.h - pad;
    const scale = Math.min(maxW / canvas.width, maxH / canvas.height, 1);
    setFit({ w: canvas.width * scale, h: canvas.height * scale });
  }, [stage, renderVersion, hasImage, canvasRef]);

  const onWheel = useCallback(
    (event) => {
      event.preventDefault();
      const next = clampZoom(zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
      setZoom(next);
      if (next <= 1) setPan({ x: 0, y: 0 });
    },
    [zoom, setZoom, setPan]
  );

  const onPointerDown = (event) => {
    if (isCropping || !fit.w) return;
    dragRef.current = { x: event.clientX, y: event.clientY, pan: { ...pan } };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!dragRef.current) return;
    setPan({
      x: dragRef.current.pan.x + (event.clientX - dragRef.current.x),
      y: dragRef.current.pan.y + (event.clientY - dragRef.current.y),
    });
  };
  const onPointerUp = (event) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const ready = fit.w > 0;

  return (
    <div
      ref={stageRef}
      className={cn(
        'relative flex-1 overflow-hidden ps-checker min-h-0',
        ready && !isCropping && (zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-default')
      )}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {placeholder}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {hasImage && (
          <div
            className="pointer-events-auto relative"
            style={{
              width: fit.w || undefined,
              height: fit.h || undefined,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: dragRef.current ? 'none' : 'transform 0.08s ease-out',
            }}
          >
            <canvas
              ref={canvasRef}
              className="block h-full w-full rounded shadow-[0_10px_40px_rgba(15,23,42,0.35)]"
            />
            {isCropping && fit.w > 0 && <CropOverlay rect={crop} onChange={onCropChange} />}
          </div>
        )}
      </div>
    </div>
  );
}

const clampZoom = (z) => Math.max(0.2, Math.min(8, z));

/* ------------------------------------------------------------------ */

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const HANDLE_STYLE = {
  nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
  n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
  ne: 'left-full top-0 -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
  e: 'left-full top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
  se: 'left-full top-full -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
  s: 'left-1/2 top-full -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
  sw: 'left-0 top-full -translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
  w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
};

function CropOverlay({ rect, onChange }) {
  const boxRef = useRef(null);
  const dragRef = useRef(null);
  const r = rect || { x: 0.08, y: 0.08, width: 0.84, height: 0.84 };

  const start = (event, mode) => {
    event.stopPropagation();
    event.preventDefault();
    dragRef.current = {
      mode,
      startX: event.clientX,
      startY: event.clientY,
      rect: { ...r },
      bounds: boxRef.current.getBoundingClientRect(),
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const move = (event) => {
    const d = dragRef.current;
    if (!d) return;
    const dw = (event.clientX - d.startX) / d.bounds.width;
    const dh = (event.clientY - d.startY) / d.bounds.height;
    let { x, y, width, height } = d.rect;
    const min = 0.05;

    if (d.mode === 'move') {
      x = clamp01(d.rect.x + dw);
      y = clamp01(d.rect.y + dh);
      width = Math.min(d.rect.width, 1 - x);
      height = Math.min(d.rect.height, 1 - y);
    } else {
      if (d.mode.includes('w')) {
        const nx = clamp01(d.rect.x + dw);
        width = d.rect.width + (d.rect.x - nx);
        x = nx;
      }
      if (d.mode.includes('e')) width = clamp01(d.rect.x + d.rect.width + dw) - x;
      if (d.mode.includes('n')) {
        const ny = clamp01(d.rect.y + dh);
        height = d.rect.height + (d.rect.y - ny);
        y = ny;
      }
      if (d.mode.includes('s')) height = clamp01(d.rect.y + d.rect.height + dh) - y;
      width = Math.max(min, width);
      height = Math.max(min, height);
      if (x + width > 1) width = 1 - x;
      if (y + height > 1) height = 1 - y;
    }
    onChange({ x, y, width, height });
  };

  const end = (event) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="absolute inset-0 select-none"
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
    >
      {/* darkened outside */}
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={boxRef}
        className="absolute cursor-move border border-[#FFD700] shadow-[0_0_0_9999px_rgba(15,23,42,0.55)]"
        style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` }}
        onPointerDown={(event) => start(event, 'move')}
      >
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border border-white/20" />
          ))}
        </div>
        {HANDLES.map((h) => (
          <span
            key={h}
            className={cn('absolute h-3 w-3 rounded-sm border border-[#9A7019] bg-[#FFD700]', HANDLE_STYLE[h])}
            onPointerDown={(event) => start(event, h)}
          />
        ))}
      </div>
    </div>
  );
}
