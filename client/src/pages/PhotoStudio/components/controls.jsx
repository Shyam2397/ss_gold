import { cn } from '../../../lib/utils';

/**
 * Labelled slider with a live readout and double-click-to-reset, matching the
 * value shown in the number bubble. Used for every Basic / Detail / Colour
 * adjustment so behaviour is identical everywhere.
 */
export function Slider({
  label,
  value,
  min = -100,
  max = 100,
  step = 1,
  defaultValue = 0,
  onChange,
  onReset,
  suffix = '',
  className,
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const isDefault = Math.abs(value - defaultValue) < 1e-6;
  return (
    <div className={cn('group/slider py-1.5', className)}>
      <div className="mb-1 flex items-center justify-between">
        <button
          type="button"
          onDoubleClick={() => (onReset ? onReset() : onChange(defaultValue))}
          className="text-[11px] font-medium text-slate-600 transition-colors hover:text-[#9A7019]"
          title="Double-click to reset"
        >
          {label}
        </button>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums',
            isDefault ? 'text-slate-400' : 'bg-[#F5EAD1] text-[#9A7019]'
          )}
        >
          {value > 0 && min < 0 ? '+' : ''}
          {Number.isInteger(value) ? value : value.toFixed(1)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onDoubleClick={() => (onReset ? onReset() : onChange(defaultValue))}
        className="ps-slider w-full"
        style={{ '--ps-fill': `${pct}%` }}
      />
    </div>
  );
}

export function FieldGroup({ title, children, right }) {
  return (
    <div className="border-b border-slate-100 px-4 py-3 last:border-b-0">
      {(title || right) && (
        <div className="mb-2 flex items-center justify-between">
          {title && (
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {title}
            </h4>
          )}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function ChannelTabs({ value, onChange, channels }) {
  return (
    <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
      {channels.map((channel) => (
        <button
          key={channel.id}
          type="button"
          onClick={() => onChange(channel.id)}
          className={cn(
            'flex-1 rounded-md px-2 py-1 text-[11px] font-medium transition-all',
            value === channel.id
              ? 'bg-white text-[#9A7019] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
          style={value === channel.id && channel.color ? { color: channel.color } : undefined}
        >
          {channel.label}
        </button>
      ))}
    </div>
  );
}

export function IconButton({ active, className, children, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 transition-all',
        active
          ? 'border-[#C69A32] bg-[#F5EAD1] text-[#9A7019]'
          : 'border-slate-200 bg-white hover:border-[#C69A32] hover:text-[#9A7019]',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ActionButton({ variant = 'ghost', size = 'md', className, children, ...props }) {
  const variants = {
    primary:
      'bg-[#C69A32] text-white hover:bg-[#9A7019] border-transparent shadow-sm',
    ghost: 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200',
    danger: 'bg-white text-red-600 hover:bg-red-50 border-red-200',
  };
  const sizes = {
    md: 'gap-2 px-3 py-1.5 text-xs',
    sm: 'gap-1.5 px-2 py-1 text-[11px]',
  };
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
