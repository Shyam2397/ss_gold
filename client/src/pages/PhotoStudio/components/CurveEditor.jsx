import { useCallback, useEffect, useRef, useState } from 'react';
import { buildCurveLut } from '../engine';

const SIZE = 256; // logical drawing space, matches the 0-255 channel range

/**
 * Interactive tone curve. Renders the *actual* LUT the engine will use
 * (`buildCurveLut`) so the on-screen curve and the rendered pixels never
 * disagree. Drag points to edit, click empty space to add, double-click to
 * delete (endpoints are pinned to x=0 / x=255).
 */
export default function CurveEditor({ points, onChange, color = '#c69a32', disabled }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const dragRef = useRef(null);
  const [hover, setHover] = useState(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const w = rect.width;
    const h = rect.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = 'rgba(148,163,184,0.18)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const gx = (w / 4) * i;
      const gy = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }
    // diagonal reference
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // curve from the real LUT
    const lut = buildCurveLut(points);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 256; i += 1) {
      const x = (i / 255) * w;
      const y = h - (lut[i] / 255) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // control points
    points.forEach((p, index) => {
      const x = (p.x / 255) * w;
      const y = h - (p.y / 255) * h;
      const isHover = hover === index;
      ctx.beginPath();
      ctx.arc(x, y, isHover ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    });
  }, [points, color, hover]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  const toValue = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 255;
    const y = (1 - (clientY - rect.top) / rect.height) * 255;
    return { x: Math.max(0, Math.min(255, x)), y: Math.max(0, Math.min(255, y)) };
  };

  const nearestPoint = (pos, radius = 16) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = (pos.x / 255) * rect.width;
    const sy = (1 - pos.y / 255) * rect.height;
    let best = -1;
    let bestDist = radius;
    points.forEach((p, index) => {
      const px = (p.x / 255) * rect.width;
      const py = (1 - p.y / 255) * rect.height;
      const d = Math.hypot(px - sx, py - sy);
      if (d < bestDist) {
        bestDist = d;
        best = index;
      }
    });
    return best;
  };

  const onPointerDown = (event) => {
    if (disabled) return;
    event.preventDefault();
    const pos = toValue(event.clientX, event.clientY);
    const index = nearestPoint(pos);
    if (index >= 0) {
      dragRef.current = index;
      canvasRef.current.setPointerCapture(event.pointerId);
      return;
    }
    // add a new point
    const next = [...points, pos].sort((a, b) => a.x - b.x);
    onChange(next);
    const newIndex = next.findIndex((p) => p.x === pos.x && p.y === pos.y);
    dragRef.current = newIndex;
    canvasRef.current.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    const pos = toValue(event.clientX, event.clientY);
    if (dragRef.current == null) {
      setHover(nearestPoint(pos));
      return;
    }
    const index = dragRef.current;
    const isFirst = index === 0;
    const isLast = index === points.length - 1;
    const next = points.map((p, i) => (i === index ? { ...p, y: pos.y } : p));
    if (isFirst) next[index].x = 0;
    else if (isLast) next[index].x = 255;
    else next[index].x = pos.x;
    // keep sorted but preserve the dragged index's identity
    if (!isFirst && !isLast) {
      const dragged = next[index];
      next.sort((a, b) => a.x - b.x);
      dragRef.current = next.indexOf(dragged);
    }
    onChange(next);
  };

  const onPointerUp = (event) => {
    if (dragRef.current != null && canvasRef.current) {
      try {
        canvasRef.current.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    dragRef.current = null;
  };

  const onDoubleClick = (event) => {
    if (disabled) return;
    const pos = toValue(event.clientX, event.clientY);
    const index = nearestPoint(pos, 12);
    if (index > 0 && index < points.length - 1) {
      onChange(points.filter((_, i) => i !== index));
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => setHover(null)}
        onDoubleClick={onDoubleClick}
        className="h-[220px] w-full touch-none rounded-lg"
        style={{ cursor: disabled ? 'default' : 'crosshair' }}
      />
      <p className="mt-1 text-center text-[10px] text-slate-400">
        Drag points · click to add · double-click to remove
      </p>
    </div>
  );
}
