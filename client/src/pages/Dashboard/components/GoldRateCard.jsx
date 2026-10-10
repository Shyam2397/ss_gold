import React, { useEffect, useState } from 'react';
import { FiCheck, FiEdit2, FiTrendingUp, FiX } from 'react-icons/fi';
import { cn } from '../../../lib/utils';
import rateBG from '../../../asset/rateBG.png';

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const GoldRateCard = ({ rate24k, rate22k, rate18k, updatedAt, hasRate, onSave }) => {
  const [editing, setEditing] = useState(!hasRate);
  const [draft, setDraft] = useState(hasRate ? String(rate24k) : '');

  useEffect(() => {
    if (!editing) setDraft(hasRate ? String(rate24k) : '');
  }, [rate24k, hasRate, editing]);

  const submit = (event) => {
    event.preventDefault();
    const value = parseFloat(draft);
    if (!Number.isFinite(value) || value <= 0) return;
    onSave(value);
    setEditing(false);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/30">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${rateBG})` }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/10 to-black/20"
        aria-hidden="true"
      />

      <div className="relative flex h-full min-h-[168px] flex-col gap-4 p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/80">
            <FiTrendingUp className="h-4 w-4" />
            Gold Rate
          </span>
          {hasRate && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit gold rate"
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <FiEdit2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {hasRate && !editing && (
          <>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/70">24K · per gram</p>
              <p className="text-4xl font-bold tabular-nums sm:text-5xl">{formatMoney(rate24k)}</p>
            </div>
            <div className="mt-3 flex items-center justify-center gap-10 text-xl">
              <p className="text-white/80">
                22K <span className="ml-3 font-semibold tabular-nums text-white">{formatMoney(rate22k)}</span>
              </p>
              <span className="text-white/40">|</span>
              <p className="text-white/80">
                18K <span className="ml-3 font-semibold tabular-nums text-white">{formatMoney(rate18k)}</span>
              </p>
            </div>
            <p className="mt-auto text-[11px] text-white/60">
              {updatedAt ? `Updated ${formatWhen(updatedAt)}` : 'Manually configured'}
            </p>
          </>
        )}

        {(!hasRate || editing) && (
          <form onSubmit={submit} className="flex flex-1 flex-col gap-2">
            <label htmlFor="gold-rate-input" className="text-[11px] font-medium text-white/80">
              24K rate per gram (₹)
            </label>
            <input
              id="gold-rate-input"
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="e.g. 7250"
              autoFocus
              className={cn(
                'w-full rounded-lg border border-white/30 bg-white/95 px-3 py-2 text-base font-semibold tabular-nums text-ink',
                'focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40'
              )}
            />
            <div className="mt-auto flex gap-2">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
              >
                <FiCheck className="h-4 w-4" />
                Save
              </button>
              {editing && hasRate && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(String(rate24k));
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/30 px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <FiX className="h-4 w-4" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default GoldRateCard;
