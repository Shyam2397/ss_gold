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

const KpiCard = ({ icon: Icon, label, value, hint, tone = 'gold', size = 'sm' }) => {
  const isLarge = size === 'large';

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }} className="h-full">
      <Card
        className={cn(
          'flex h-full flex-col',
          isLarge ? 'min-h-[132px] justify-between gap-3 p-6' : 'gap-1.5 p-3'
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'truncate font-medium text-muted',
              isLarge ? 'text-sm' : 'text-[11px]'
            )}
          >
            {label}
          </span>
          <span
            className={cn(
              'flex flex-shrink-0 items-center justify-center rounded-lg',
              isLarge ? 'h-11 w-11' : 'h-7 w-7',
              TONES[tone] || TONES.gold
            )}
          >
            <Icon className={isLarge ? 'h-5 w-5' : 'h-3.5 w-3.5'} />
          </span>
        </div>
        <div
          className={cn(
            'font-bold leading-tight tabular-nums text-ink',
            isLarge ? 'text-3xl sm:text-4xl' : 'text-base sm:text-lg'
          )}
        >
          {value}
        </div>
        {hint && (
          <p
            className={cn(
              'truncate leading-tight text-muted',
              isLarge ? 'text-xs' : 'text-[10px]'
            )}
          >
            {hint}
          </p>
        )}
      </Card>
    </motion.div>
  );
};

export default React.memo(KpiCard);
