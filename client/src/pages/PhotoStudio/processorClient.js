/**
 * Promise wrapper around the render worker.
 *
 * A single worker instance is shared. Only the most recent `render` request is
 * allowed to resolve; older ones are resolved with `{ stale: true }` so a fast
 * slider drag doesn't queue up dozens of frames.
 */

let worker = null;
let seq = 0;
const pending = new Map();
let latestRenderId = 0;

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (event) => {
    const { type, id } = event.data || {};
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (type === 'error') {
      entry.reject(new Error(event.data.message));
    } else if (type === 'result' && id !== latestRenderId && entry.kind === 'render') {
      entry.resolve({ stale: true });
    } else {
      entry.resolve(event.data);
    }
  };
  worker.onerror = (error) => {
    pending.forEach((entry) => entry.reject(error));
    pending.clear();
  };
  return worker;
}

export function renderPreview(imageData, adjustments) {
  const w = ensureWorker();
  const id = ++seq;
  latestRenderId = id;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, kind: 'render' });
    const buffer = imageData.data.slice().buffer;
    w.postMessage(
      { id, type: 'render', buffer, width: imageData.width, height: imageData.height, adjustments },
      [buffer]
    );
  });
}

/**
 * Render that is never dropped as "stale". Used for the one-off full-quality
 * render on Apply/Export, where a concurrent preview frame must not cancel it.
 */
export function renderFull(imageData, adjustments) {
  const w = ensureWorker();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, kind: 'full' });
    const buffer = imageData.data.slice().buffer;
    w.postMessage(
      { id, type: 'render', buffer, width: imageData.width, height: imageData.height, adjustments },
      [buffer]
    );
  });
}

export function computeHistogramAsync(imageData) {
  const w = ensureWorker();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, kind: 'histogram' });
    const buffer = imageData.data.slice().buffer;
    w.postMessage(
      { id, type: 'histogram', buffer, width: imageData.width, height: imageData.height },
      [buffer]
    );
  });
}

export function terminateProcessor() {
  if (worker) {
    worker.terminate();
    worker = null;
    pending.clear();
  }
}
