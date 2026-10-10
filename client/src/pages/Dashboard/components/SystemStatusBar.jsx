import React, { useEffect, useState } from 'react';
import { FiClock, FiDollarSign, FiInbox, FiMonitor, FiPrinter, FiWifi } from 'react-icons/fi';
import { cn } from '../../../lib/utils';

const StatusItem = ({ icon: Icon, label, value, ok }) => (
  <div className="flex items-center gap-2.5 px-4 py-3">
    <span
      className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
        ok === false ? 'bg-branddanger/10 text-branddanger' : 'bg-gold/10 text-gold'
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
        {ok !== null && ok !== undefined && (
          <span
            className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-brandsuccess' : 'bg-branddanger')}
          />
        )}
        {value}
      </p>
    </div>
  </div>
);

const SystemStatusBar = ({ error, lastUpdated, samplesToday, hasGoldRate }) => {
  const [printer, setPrinter] = useState({ value: 'Checking…', ok: null });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!window.electron?.getAvailablePrinters) {
        if (!cancelled) setPrinter({ value: 'Unavailable', ok: false });
        return;
      }
      try {
        const printers = await window.electron.getAvailablePrinters();
        if (cancelled) return;
        const list = Array.isArray(printers) ? printers : printers?.printers || [];
        setPrinter({
          value: list.length > 0 ? `${list.length} available` : 'None found',
          ok: list.length > 0,
        });
      } catch {
        if (!cancelled) setPrinter({ value: 'Unavailable', ok: false });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';

  const connection = error ? { value: 'Disconnected', ok: false } : { value: 'Connected', ok: true };

  return (
    <div className="rounded-2xl border border-hairline bg-white shadow-sm">
      <div className="grid grid-cols-2 divide-hairline sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
        <StatusItem icon={FiWifi} label="Server" value={connection.value} ok={connection.ok} />
        <StatusItem icon={FiPrinter} label="Printer" value={printer.value} ok={printer.ok} />
        <StatusItem icon={FiMonitor} label="Analyzer" value="Not connected" ok={false} />
        <StatusItem
          icon={FiDollarSign}
          label="Gold Rate"
          value={hasGoldRate ? 'Configured' : 'Not set'}
          ok={hasGoldRate}
        />
        <StatusItem icon={FiInbox} label="Samples Today" value={String(samplesToday ?? 0)} ok={null} />
        <StatusItem icon={FiClock} label="Last Synced" value={syncedLabel} ok={null} />
      </div>
      <div className="flex items-center justify-between border-t border-hairline px-4 py-2 text-xs text-muted">
        <span>SS Gold · Gold Testing Centre</span>
        <span>Version v{typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '—'}</span>
      </div>
    </div>
  );
};

export default SystemStatusBar;
