import { useEffect, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';
import { cn } from '../../../lib/utils';
import { ActionButton, Slider } from './controls';

const FORMATS = [
  { id: 'jpeg', label: 'JPEG', hint: 'Smallest, no transparency' },
  { id: 'png', label: 'PNG', hint: 'Lossless, supports transparency' },
  { id: 'webp', label: 'WebP', hint: 'Modern, small & sharp' },
];

export default function ExportDialog({ open, onClose, onExport, defaultName, sourceSize, busy }) {
  const [format, setFormat] = useState('jpeg');
  const [quality, setQuality] = useState(92);
  const [sizeMode, setSizeMode] = useState('original');
  const [longEdge, setLongEdge] = useState(2000);
  const [name, setName] = useState(defaultName || 'photo');

  useEffect(() => {
    if (open) {
      setName(defaultName || 'photo');
      if (sourceSize) setLongEdge(Math.max(256, Math.round(Math.max(sourceSize.width, sourceSize.height))));
    }
  }, [open, defaultName, sourceSize]);

  if (!open) return null;

  const ext = format === 'jpeg' ? 'jpg' : format;
  const showQuality = format === 'jpeg' || format === 'webp';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Export image</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>

        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Format</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              className={cn(
                'rounded-lg border px-2 py-2 text-center transition-all',
                format === f.id
                  ? 'border-[#C69A32] bg-[#F5EAD1]'
                  : 'border-slate-200 hover:border-slate-300'
              )}
            >
              <span className="block text-xs font-semibold text-slate-700">{f.label}</span>
              <span className="mt-0.5 block text-[9px] leading-tight text-slate-400">{f.hint}</span>
            </button>
          ))}
        </div>

        {showQuality && (
          <div className="mb-3">
            <Slider
              label="Quality"
              min={10}
              max={100}
              value={quality}
              suffix="%"
              defaultValue={92}
              onChange={setQuality}
            />
          </div>
        )}

        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Size</p>
        <div className="mb-3 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="radio"
              name="sizeMode"
              checked={sizeMode === 'original'}
              onChange={() => setSizeMode('original')}
              className="accent-[#C69A32]"
            />
            Original resolution
            {sourceSize && (
              <span className="text-slate-400">
                ({Math.round(sourceSize.width)} x {Math.round(sourceSize.height)})
              </span>
            )}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
            <input
              type="radio"
              name="sizeMode"
              checked={sizeMode === 'custom'}
              onChange={() => setSizeMode('custom')}
              className="accent-[#C69A32]"
            />
            Longest edge
            <input
              type="number"
              min={256}
              max={8000}
              value={longEdge}
              disabled={sizeMode !== 'custom'}
              onChange={(e) => setLongEdge(Number(e.target.value) || 256)}
              className="w-20 rounded border border-slate-200 px-1.5 py-0.5 text-right font-mono text-[11px] disabled:opacity-40"
            />
            px
          </label>
        </div>

        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">File name</p>
        <div className="mb-5 flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-[#C69A32] focus:outline-none"
          />
          <span className="font-mono text-xs text-slate-400">.{ext}</span>
        </div>

        <div className="flex justify-end gap-2">
          <ActionButton onClick={onClose} disabled={busy}>
            Cancel
          </ActionButton>
          <ActionButton
            variant="primary"
            disabled={busy}
            onClick={() =>
              onExport({
                format,
                quality: quality / 100,
                sizeMode,
                longEdge,
                filename: `${name || 'photo'}.${ext}`,
              })
            }
          >
            {busy ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Exporting...
              </span>
            ) : (
              <>
                <FiDownload size={13} /> Export
              </>
            )}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
