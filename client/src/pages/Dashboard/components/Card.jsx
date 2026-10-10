import React from 'react';
import { cn } from '../../../lib/utils';

export const Card = ({ className, children }) => (
  <section className={cn('rounded-2xl border border-hairline bg-white shadow-sm', className)}>
    {children}
  </section>
);

export const CardHeader = ({ icon: Icon, title, subtitle, action, className }) => (
  <div className={cn('flex items-start justify-between gap-3 border-b border-hairline px-5 py-4', className)}>
    <div className="flex min-w-0 items-center gap-2.5">
      {Icon && (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
        {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
    {Icon && <Icon className="mb-2 h-6 w-6 text-muted/70" />}
    <p className="text-sm font-medium text-ink">{title}</p>
    {message && <p className="mt-1 max-w-xs text-xs text-muted">{message}</p>}
  </div>
);
