import { useEffect, useRef } from 'react';

/**
 * RGB luminance histogram. Channels are drawn additively so overlaps read as
 * white, matching the familiar photo-editor look. Works from the Uint32Array
 * counts produced by the engine.
 */
export default function Histogram({ histogram, height = 110, channel = 'rgb' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 260;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    if (!histogram) return;

    const series = [];
    if (channel === 'rgb' || channel === 'lum') {
      if (channel === 'lum') series.push({ data: histogram.lum, color: '#e2e8f0', mode: 'lum' });
      else {
        series.push({ data: histogram.r, color: '#ef4444' });
        series.push({ data: histogram.g, color: '#22c55e' });
        series.push({ data: histogram.b, color: '#3b82f6' });
      }
    } else {
      const map = { r: '#ef4444', g: '#22c55e', b: '#3b82f6' };
      series.push({ data: histogram[channel], color: map[channel] || '#e2e8f0' });
    }

    let max = 1;
    series.forEach((s) => {
      for (let i = 0; i < 256; i += 1) if (s.data[i] > max) max = s.data[i];
    });

    // grid lines at quarters
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const x = (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = series.length > 1 ? 'lighter' : 'source-over';
    series.forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      const step = w / 256;
      for (let i = 0; i < 256; i += 1) {
        const v = Math.sqrt(s.data[i] / max); // sqrt keeps shadows readable
        const y = h - v * (h - 4);
        ctx.lineTo(i * step, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, s.color);
      grad.addColorStop(1, `${s.color}22`);
      ctx.fillStyle = grad;
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
  }, [histogram, height, channel]);

  return (
    <canvas
      ref={ref}
      className="w-full rounded-lg"
      style={{ height }}
      aria-label="Histogram"
    />
  );
}
