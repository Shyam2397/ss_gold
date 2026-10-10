import React from 'react';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { cn } from '../../../lib/utils';

const TONES = {
  gold: 'bg-gold/10 text-gold',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-sky-50 text-sky-600',
  red: 'bg-rose-50 text-rose-600',
  violet: 'bg-violet-50 text-violet-600',
  teal: 'bg-teal-50 text-teal-600',
  sky: 'bg-sky-50 text-sky-600',
};

const KpiCard = ({ icon: Icon, label, value, hint, tone = 'gold' }) => {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="h-full">
      <Card className="flex h-full flex-col gap-1.5 overflow-hidden p-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <span className="min-w-0 truncate text-[11px] font-medium text-muted">
            {label}
          </span>
          <span
            className={cn(
              'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg',
              TONES[tone] || TONES.gold
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        </div>
        <div className="truncate text-base font-bold leading-tight tabular-nums text-ink sm:text-lg">
          {value}
        </div>
        {hint && (
          <p className="truncate text-[10px] leading-tight text-muted">
            {hint}
          </p>
        )}
      </Card>
    </motion.div>
  );
};

export default React.memo(KpiCard);
