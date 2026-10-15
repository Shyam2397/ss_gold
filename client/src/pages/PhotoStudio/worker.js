/**
 * Photo Studio worker.
 *
 * Runs the (potentially heavy) pixel pipeline off the main thread so large
 * images never freeze the Electron UI. Messages carry transferable ImageData
 * buffers in and out, so no large copies are made.
 */
import { renderImage, computeHistogram } from './engine';

const post = (type, payload, transfer) => self.postMessage({ type, ...payload }, transfer || []);

self.onmessage = (event) => {
  const { id, type, buffer, width, height, adjustments } = event.data || {};
  try {
    if (type === 'render') {
      const imageData = { data: new Uint8ClampedArray(buffer), width, height };
      const result = renderImage(imageData, adjustments);
      const histogram = computeHistogram(result);
      post('result', { id, buffer: result.data.buffer, width, height, histogram }, [result.data.buffer]);
      return;
    }
    if (type === 'histogram') {
      const imageData = { data: new Uint8ClampedArray(buffer), width, height };
      const histogram = computeHistogram(imageData);
      post('result', { id, histogram });
      return;
    }
    post('error', { id, message: `Unknown task: ${type}` });
  } catch (error) {
    post('error', { id, message: error && error.message ? error.message : String(error) });
  }
};
