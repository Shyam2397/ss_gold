import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FiPrinter, FiX } from 'react-icons/fi';
import { generatePrintContent, printData } from '../../SkinTesting/utils/printUtils';

// The print sheet is authored at 210mm x 99mm; convert to CSS pixels (96dpi)
// so the iframe can be scaled down to fit smaller viewports.
const PREVIEW_WIDTH = Math.round((210 / 25.4) * 96);
const PREVIEW_HEIGHT = Math.round((99 / 25.4) * 96);

const PrintPreviewModal = ({ open, data, onClose }) => {
  const [printing, setPrinting] = useState(false);
  const [scale, setScale] = useState(1);
  const previewRef = useRef(null);

  const content = useMemo(
    () => (open && data ? generatePrintContent(data) : ''),
    [open, data]
  );

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Fit the fixed-size sheet into the available preview area so it stays fully
  // visible on tablets and phones instead of being clipped.
  useEffect(() => {
    if (!open) return undefined;
    const el = previewRef.current;
    if (!el) return undefined;
    const update = () => {
      const availableWidth = el.clientWidth - 32;
      const availableHeight = window.innerHeight - 120;
      setScale(
        Math.max(
          0.1,
          Math.min(1, availableWidth / PREVIEW_WIDTH, availableHeight / PREVIEW_HEIGHT)
        )
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [open]);

  if (!open || !data) return null;

  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      await printData(data);
    } catch (err) {
      console.error('Print from preview failed:', err);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="flex w-fit max-w-[95vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Print preview"
      >
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink">
              Print Preview — Token {data.tokenNo || data.token_no || '-'}
            </h3>
            <p className="truncate text-xs text-muted">{data.name || 'Customer'}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={printing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:from-amber-600 hover:to-yellow-600 disabled:opacity-60"
            >
              <FiPrinter className="h-3.5 w-3.5" />
              {printing ? 'Printing…' : 'Print'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ivory hover:text-ink"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div
          ref={previewRef}
          className="flex flex-1 items-center justify-center overflow-hidden bg-ivory p-4"
        >
          <div
            className="overflow-hidden rounded-lg"
            style={{ width: PREVIEW_WIDTH * scale, height: PREVIEW_HEIGHT * scale }}
          >
            <iframe
              title="Print preview"
              srcDoc={content}
              scrolling="no"
              className="rounded-lg border border-hairline bg-white shadow-sm"
              style={{
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreviewModal;
