/**
 * Photo Studio - render engine.
 *
 * Pure, framework-free pixel math. Everything here operates on a plain RGBA
 * buffer ({ data, width, height }) so it can run inside a Web Worker and be
 * reused verbatim for both the low-res preview and the full-resolution export.
 *
 * Pipeline order (Photoshop-like):
 *   per-channel LUTs  ->  HSL / colour / vibrance  ->  detail passes (spatial)
 * Geometry (crop / rotate / flip) is applied by the caller with a canvas
 * before the buffer ever reaches here.
 */

export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const clamp100 = (v) => clamp(v, -100, 100);

/* ------------------------------------------------------------------ */
/* Curve + level LUT builders                                          */
/* ------------------------------------------------------------------ */

/**
 * Monotone cubic Hermite (Fritsch-Carlson) interpolation of the control
 * points, sampled into a 256-entry LUT. Monotone interpolation avoids the
 * overshoot "wiggles" a plain spline would introduce between points.
 */
export function buildCurveLut(points) {
  const lut = new Uint8ClampedArray(256);
  const pts = (points || [])
    .map((p) => ({ x: clamp(p.x, 0, 255), y: clamp(p.y, 0, 255) }))
    .sort((a, b) => a.x - b.x);

  if (pts.length === 0) {
    for (let i = 0; i < 256; i += 1) lut[i] = i;
    return lut;
  }
  if (pts.length === 1) {
    const v = pts[0].y;
    for (let i = 0; i < 256; i += 1) lut[i] = v;
    return lut;
  }

  const n = pts.length;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);

  const d = new Array(n - 1);
  for (let i = 0; i < n - 1; i += 1) {
    d[i] = (ys[i + 1] - ys[i]) / Math.max(1e-6, xs[i + 1] - xs[i]);
  }
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i += 1) {
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  }
  for (let i = 0; i < n - 1; i += 1) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }

  let seg = 0;
  for (let x = 0; x < 256; x += 1) {
    if (x <= xs[0]) {
      lut[x] = ys[0];
      continue;
    }
    if (x >= xs[n - 1]) {
      lut[x] = ys[n - 1];
      continue;
    }
    while (seg < n - 2 && x > xs[seg + 1]) seg += 1;
    const h = xs[seg + 1] - xs[seg];
    const t = (x - xs[seg]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    const h00 = 2 * t3 - 3 * t2 + 1;
    const h10 = t3 - 2 * t2 + t;
    const h01 = -2 * t3 + 3 * t2;
    const h11 = t3 - t2;
    lut[x] = h00 * ys[seg] + h10 * h * m[seg] + h01 * ys[seg + 1] + h11 * h * m[seg + 1];
  }
  return lut;
}

export function buildLevelsLut(level) {
  const lut = new Uint8ClampedArray(256);
  const inBlack = clamp(level.inBlack, 0, 255);
  const inWhite = clamp(level.inWhite, 0, 255);
  const outBlack = clamp(level.outBlack, 0, 255);
  const outWhite = clamp(level.outWhite, 0, 255);
  const range = Math.max(1, inWhite - inBlack);
  const g = 1 / Math.max(0.01, level.gamma);
  for (let i = 0; i < 256; i += 1) {
    let v = clamp01((i - inBlack) / range);
    v = Math.pow(v, g);
    lut[i] = outBlack + v * (outWhite - outBlack);
  }
  return lut;
}

/* Tone shaping from the Basic sliders (same for every channel). */
function toneFn(basic) {
  const exposureGain = Math.pow(2, basic.exposure / 100); // ~ +-1 EV
  const brightness = basic.brightness / 100;
  const contrast = basic.contrast / 100;
  const shadows = basic.shadows / 100;
  const highlights = basic.highlights / 100;
  const whites = basic.whites / 100;
  const blacks = basic.blacks / 100;

  // contrast around mid gray
  const c = 1 + contrast;
  return (v) => {
    // Shadows / highlights are luminance lifts that fade out toward the ends.
    let t = v;
    if (shadows) t += shadows * 0.5 * Math.pow(1 - t, 2);
    if (highlights) t += highlights * 0.5 * Math.pow(t, 2);
    if (whites) t += whites * 0.5 * Math.pow(t, 1.5);
    if (blacks) t -= blacks * 0.5 * Math.pow(1 - t, 1.5);
    t = t * exposureGain;
    t = (t - 0.5) * c + 0.5;
    t += brightness * 0.3;
    return clamp01(t);
  };
}

/* White-balance gains per channel (temperature / tint), keeps mid gray stable. */
function channelGains(tempWb, tintWb, tempBasic, tintBasic) {
  const temp = clamp((tempWb + tempBasic) / 100, -1, 1);
  const tint = clamp((tintWb + tintBasic) / 100, -1, 1);
  // Warm (+) boosts red, cools blue; magenta (+) boosts red+blue vs green.
  const rGain = 1 + temp * 0.4 + tint * 0.15;
  const gGain = 1 - tint * 0.3;
  const bGain = 1 - temp * 0.4 + tint * 0.15;
  // Re-normalise so overall luminance stays put.
  const norm = 1 / Math.max(0.01, 0.299 * rGain + 0.587 * gGain + 0.114 * bGain);
  return [rGain * norm, gGain * norm, bGain * norm];
}

const balanceWeight = (t, kind) => {
  if (kind === 'shadows') return Math.max(0, 1 - t * 1.6);
  if (kind === 'highlights') return Math.max(0, (t - 0.5) * 2);
  return 1 - Math.abs(2 * t - 1); // midtones
};

/**
 * Compose everything value-based into one LUT per channel:
 * white balance -> tone -> RGB levels -> RGB curve -> per-channel levels ->
 * per-channel curve -> colour balance (3-zone).
 * Value-based ops baked into LUTs are essentially free at render time.
 */
export function buildChannelLuts(adj) {
  const tone = toneFn(adj.basic);
  const [gr, gg, gb] = channelGains(
    adj.color.whiteBalance.temperature,
    adj.color.whiteBalance.tint,
    adj.basic.temperature,
    adj.basic.tint
  );
  const gains = [gr, gg, gb];

  // Composite (RGB) levels + curve apply to every channel.
  const rgbLevels = buildLevelsLut(adj.levels.rgb);
  const rgbCurve = buildCurveLut(adj.curves.rgb.points);

  const levelsLut = [
    buildLevelsLut(adj.levels.r),
    buildLevelsLut(adj.levels.g),
    buildLevelsLut(adj.levels.b),
  ];
  const curveLut = [
    buildCurveLut(adj.curves.r.points),
    buildCurveLut(adj.curves.g.points),
    buildCurveLut(adj.curves.b.points),
  ];
  const bal = adj.color.balance;
  const luts = [new Uint8ClampedArray(256), new Uint8ClampedArray(256), new Uint8ClampedArray(256)];

  const sample = (lut, v) => lut[Math.round(clamp(v, 0, 255))];

  for (let c = 0; c < 3; c += 1) {
    for (let i = 0; i < 256; i += 1) {
      let v = (i / 255) * gains[c];
      v = tone(clamp01(v));
      let x = v * 255;
      x = sample(rgbLevels, x);
      x = sample(rgbCurve, x);
      x = sample(levelsLut[c], x);
      x = sample(curveLut[c], x);

      // Colour balance, referenced on the *input* level so zones stay put.
      const t = i / 255;
      const shift =
        bal.shadows[c] * balanceWeight(t, 'shadows') +
        bal.midtones[c] * balanceWeight(t, 'midtones') +
        bal.highlights[c] * balanceWeight(t, 'highlights');
      x += (shift / 100) * 64;

      luts[c][i] = clamp255(x);
    }
  }
  return luts;
}

/* ------------------------------------------------------------------ */
/* HSL helpers                                                         */
/* ------------------------------------------------------------------ */

export function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return [h, s, l];
}

const hue2rgb = (p, q, t) => {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
};

export function hslToRgb(h, s, l) {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = ((h % 360) + 360) % 360 / 360;
  return [hue2rgb(p, q, hn + 1 / 3), hue2rgb(p, q, hn), hue2rgb(p, q, hn - 1 / 3)];
}

/* Precompute per-region hue weights (360 samples) so the pixel loop is cheap. */
const hslChannelWeight = (hue, center, range) => {
  let d = Math.abs(((hue - center + 540) % 360) - 180);
  if (d > range) return 0;
  return 1 - d / range; // linear falloff
};

const anyHslActive = (hsl) =>
  Object.values(hsl).some((c) => c.hue || c.saturation || c.lightness);

const anyColorActive = (adj) => {
  const m = adj.color.master;
  const sel = adj.color.selective;
  return (
    m.hue || m.saturation || m.lightness ||
    adj.basic.saturation || adj.basic.vibrance ||
    anyHslActive(adj.color.hsl) ||
    sel.cyan || sel.magenta || sel.yellow || sel.black
  );
};

/* ------------------------------------------------------------------ */
/* Spatial (detail) passes                                             */
/* ------------------------------------------------------------------ */

function boxBlur(src, width, height, radius) {
  const tmp = new Uint8ClampedArray(src.length);
  const out = new Uint8ClampedArray(src.length);
  const r = Math.max(1, Math.round(radius));
  // horizontal
  for (let y = 0; y < height; y += 1) {
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      const row = y * width;
      for (let x = -r; x <= r; x += 1) sum += src[(row + clamp(x, 0, width - 1)) * 4 + c];
      for (let x = 0; x < width; x += 1) {
        tmp[(row + x) * 4 + c] = sum / (2 * r + 1);
        const add = clamp(x + r + 1, 0, width - 1);
        const sub = clamp(x - r, 0, width - 1);
        sum += src[(row + add) * 4 + c] - src[(row + sub) * 4 + c];
      }
    }
  }
  // vertical
  for (let x = 0; x < width; x += 1) {
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      for (let y = -r; y <= r; y += 1) sum += tmp[(clamp(y, 0, height - 1) * width + x) * 4 + c];
      for (let y = 0; y < height; y += 1) {
        const i = (y * width + x) * 4 + c;
        out[i] = sum / (2 * r + 1);
        const add = clamp(y + r + 1, 0, height - 1);
        const sub = clamp(y - r, 0, height - 1);
        sum += tmp[(add * width + x) * 4 + c] - tmp[(sub * width + x) * 4 + c];
      }
    }
  }
  // copy alpha
  for (let i = 3; i < src.length; i += 4) out[i] = src[i];
  return out;
}

const anyDetailsActive = (d) =>
  d.sharpen || d.clarity || d.texture || d.noiseReduction || d.dehaze;

function applyDetails(data, width, height, d) {
  let buf = data;

  if (d.noiseReduction > 0) {
    const blurred = boxBlur(buf, width, height, 1);
    const amt = (d.noiseReduction / 100) * 0.85;
    for (let i = 0; i < buf.length; i += 4) {
      for (let c = 0; c < 3; c += 1) buf[i + c] = buf[i + c] * (1 - amt) + blurred[i + c] * amt;
    }
  }

  // Local contrast family: small radius = texture/sharpen, big radius = clarity.
  const smallR = 1;
  const bigR = Math.max(2, Math.round(Math.min(width, height) / 20));
  const needSmall = d.sharpen > 0 || d.texture !== 0;
  const needBig = d.clarity !== 0;

  if (needSmall) {
    const small = boxBlur(buf, width, height, smallR);
    const sharp = (d.sharpen / 100) * 1.4;
    const texture = (d.texture / 100) * 1.1;
    for (let i = 0; i < buf.length; i += 4) {
      for (let c = 0; c < 3; c += 1) {
        const hi = buf[i + c] - small[i + c];
        buf[i + c] = clamp255(buf[i + c] + hi * (sharp + texture));
      }
    }
  }
  if (needBig) {
    const big = boxBlur(buf, width, height, bigR);
    const clarity = (d.clarity / 100) * 1.0;
    for (let i = 0; i < buf.length; i += 4) {
      for (let c = 0; c < 3; c += 1) {
        const lo = buf[i + c] - big[i + c];
        buf[i + c] = clamp255(buf[i + c] + lo * clarity);
      }
    }
  }

  if (d.dehaze) {
    const amt = d.dehaze / 100; // -1..1
    const contrast = 1 + amt * 0.6;
    const sat = 1 + amt * 0.5;
    for (let i = 0; i < buf.length; i += 4) {
      for (let c = 0; c < 3; c += 1) {
        let v = buf[i + c] / 255;
        v = (v - 0.5) * contrast + 0.5 - amt * 0.06;
        buf[i + c] = clamp255(v * 255);
      }
      const r = buf[i];
      const g = buf[i + 1];
      const b = buf[i + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      buf[i] = clamp255(l + (r - l) * sat);
      buf[i + 1] = clamp255(l + (g - l) * sat);
      buf[i + 2] = clamp255(l + (b - l) * sat);
    }
  }
  return buf;
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* ------------------------------------------------------------------ */

export function renderImage(imageData, adj) {
  const { width, height } = imageData;
  const data = new Uint8ClampedArray(imageData.data); // never touch the source
  const luts = buildChannelLuts(adj);

  // 1) per-channel LUTs
  for (let i = 0; i < data.length; i += 4) {
    data[i] = luts[0][data[i]];
    data[i + 1] = luts[1][data[i + 1]];
    data[i + 2] = luts[2][data[i + 2]];
  }

  // 2) colour: master HSL, selective HSL, vibrance/saturation, selective colour
  if (anyColorActive(adj)) applyColor(data, adj);

  // 3) details
  if (anyDetailsActive(adj.details)) applyDetails(data, width, height, adj.details);

  return { data, width, height };
}

function applyColor(data, adj) {
  const master = adj.color.master;
  const hsl = adj.color.hsl;
  const sel = adj.color.selective;
  const satPct = adj.basic.saturation / 100;
  const vibPct = adj.basic.vibrance / 100;
  const hslActive = anyHslActive(hsl);
  const selActive = sel.cyan || sel.magenta || sel.yellow || sel.black;

  // Precompute region weights for each of the 8 hue centres.
  const centers = [0, 30, 60, 120, 180, 225, 275, 315];
  const keys = ['reds', 'oranges', 'yellows', 'greens', 'aquas', 'blues', 'purples', 'magentas'];
  const weightTable = keys.map((k) => {
    const range = clamp(Number(sel.range) || 40, 5, 120);
    const arr = new Float32Array(360);
    for (let h = 0; h < 360; h += 1) {
      const c = centerOf(k, centers, keys);
      arr[h] = hslActive ? hslChannelWeight(h, c, 40) : hslChannelWeight(h, c, range);
    }
    return arr;
  });
  const selWeights = new Float32Array(360);
  for (let h = 0; h < 360; h += 1) selWeights[h] = hslChannelWeight(h, sel.hue, clamp(sel.range, 5, 120));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    let [h, s, l] = rgbToHsl(r, g, b);

    // master
    h += master.hue;
    s = clamp01(s * (1 + master.saturation / 100));
    l = clamp01(l + master.lightness / 200);

    // saturation + vibrance (vibrance leans on the least-saturated pixels)
    s = clamp01(s * (1 + satPct));
    if (vibPct) s = clamp01(s * (1 + vibPct * (1 - s)));

    // selective HSL per region
    if (hslActive) {
      const hi = ((Math.round(h) % 360) + 360) % 360;
      for (let k = 0; k < 8; k += 1) {
        const w = weightTable[k][hi];
        if (w <= 0) continue;
        const ch = hsl[keys[k]];
        h += ch.hue * w;
        s = clamp01(s + (ch.saturation / 100) * w * (s > 0 ? 1 : 0));
        l = clamp01(l + (ch.lightness / 100) * w * 0.5);
      }
    }

    let [nr, ng, nb] = hslToRgb(h, s, l);
    r = nr; g = ng; b = nb;

    // selective colour (simplified CMYK push within a hue range)
    if (selActive) {
      const hi = ((Math.round(h) % 360) + 360) % 360;
      const w = selWeights[hi];
      if (w > 0) {
        r = clamp01(r - (sel.cyan / 100) * w);
        g = clamp01(g - (sel.magenta / 100) * w);
        b = clamp01(b - (sel.yellow / 100) * w);
        const black = (sel.black / 100) * w;
        r = clamp01(r * (1 - black));
        g = clamp01(g * (1 - black));
        b = clamp01(b * (1 - black));
      }
    }

    data[i] = r * 255;
    data[i + 1] = g * 255;
    data[i + 2] = b * 255;
  }
}

const centerOf = (key, centers, keys) => centers[keys.indexOf(key)];

/* ------------------------------------------------------------------ */
/* Histogram                                                           */
/* ------------------------------------------------------------------ */

export function computeHistogram(imageData) {
  const { data } = imageData;
  const r = new Uint32Array(256);
  const g = new Uint32Array(256);
  const b = new Uint32Array(256);
  const lum = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const rr = data[i];
    const gg = data[i + 1];
    const bb = data[i + 2];
    r[rr] += 1;
    g[gg] += 1;
    b[bb] += 1;
    lum[(0.299 * rr + 0.587 * gg + 0.114 * bb) | 0] += 1;
  }
  return { r, g, b, lum };
}

export { clamp100 };
