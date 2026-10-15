import { useState } from 'react';
import {
  FiSliders,
  FiBarChart2,
  FiActivity,
  FiDroplet,
  FiAperture,
  FiCrop,
  FiRotateCcw,
  FiRotateCw,
  FiRefreshCw,
} from 'react-icons/fi';
import { cn } from '../../../lib/utils';
import { TOOL_TABS, HSL_CHANNELS, isSectionDefault } from '../state';
import { Slider, FieldGroup, ChannelTabs, ActionButton as RawActionButton } from './controls';
import Histogram from './Histogram';
import CurveEditor from './CurveEditor';

const TAB_ICONS = {
  basic: FiSliders,
  levels: FiBarChart2,
  curves: FiActivity,
  color: FiDroplet,
  details: FiAperture,
  transform: FiCrop,
};

const RGB_CHANNELS = [
  { id: 'rgb', label: 'RGB' },
  { id: 'r', label: 'R', color: '#ef4444' },
  { id: 'g', label: 'G', color: '#22c55e' },
  { id: 'b', label: 'B', color: '#3b82f6' },
];

const BALANCE_ZONES = [
  { id: 'shadows', label: 'Shadows' },
  { id: 'midtones', label: 'Midtones' },
  { id: 'highlights', label: 'Highlights' },
];

const BALANCE_LABELS = ['Cyan / Red', 'Magenta / Green', 'Yellow / Blue'];

// Panel buttons use the compact size so the tools stay dense.
const ActionButton = (props) => <RawActionButton size="sm" {...props} />;

function NumField({ value, onChange, min = 0, max = 255, step = 1 }) {
  return (
    <input
      type="number"
      value={Math.round(value)}
      min={min}
      max={max}
      step={step}
      onChange={(event) => {
        const v = Number(event.target.value);
        if (!Number.isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
      }}
      className="w-14 rounded border border-slate-200 px-1.5 py-0.5 text-right font-mono text-[11px] text-slate-600 focus:border-[#C69A32] focus:outline-none"
    />
  );
}

export default function AdjustmentPanel({
  adjustments,
  dispatch,
  activeTab,
  setActiveTab,
  histogram,
  onResetSection,
  isCropping,
  onToggleCrop,
  onResetCrop,
}) {
  const [balanceZone, setBalanceZone] = useState('midtones');
  const [hslChannel, setHslChannel] = useState('reds');

  const set = (path, value, group) =>
    dispatch({ type: 'SET', path, value, group: group || path.join('.') });
  const defaults = () => dispatch({ type: 'RESET_SECTION', section: activeTab });
  const sectionDirty = !isSectionDefault(adjustments, activeTab);

  const basic = adjustments.basic;
  const levels = adjustments.levels;
  const curves = adjustments.curves;
  const color = adjustments.color;
  const details = adjustments.details;
  const transform = adjustments.transform;

  return (
    <div className="flex h-full w-full min-w-0 flex-col bg-white">
      {/* Tool tabs */}
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-slate-100 px-2 py-2">
        {TOOL_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const dirty = !isSectionDefault(adjustments, tab.id);
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'relative flex min-w-[46px] flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[9px] font-medium leading-tight transition-all',
                activeTab === tab.id
                  ? 'bg-[#F5EAD1] text-[#9A7019]'
                  : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              <Icon size={14} />
              {tab.label}
              {dirty && (
                <span className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-[#C69A32]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto ps-scroll">
        {/* ---------------------------------------------------------- BASIC */}
        {activeTab === 'basic' && (
          <>
            <FieldGroup title="Light">
              <Slider label="Exposure" value={basic.exposure} onChange={(v) => set(['basic', 'exposure'], v)} />
              <Slider label="Brightness" value={basic.brightness} onChange={(v) => set(['basic', 'brightness'], v)} />
              <Slider label="Contrast" value={basic.contrast} onChange={(v) => set(['basic', 'contrast'], v)} />
              <Slider label="Highlights" value={basic.highlights} onChange={(v) => set(['basic', 'highlights'], v)} />
              <Slider label="Shadows" value={basic.shadows} onChange={(v) => set(['basic', 'shadows'], v)} />
              <Slider label="Whites" value={basic.whites} onChange={(v) => set(['basic', 'whites'], v)} />
              <Slider label="Blacks" value={basic.blacks} onChange={(v) => set(['basic', 'blacks'], v)} />
            </FieldGroup>
            <FieldGroup title="Color">
              <Slider label="Saturation" value={basic.saturation} onChange={(v) => set(['basic', 'saturation'], v)} />
              <Slider label="Vibrance" value={basic.vibrance} onChange={(v) => set(['basic', 'vibrance'], v)} />
            </FieldGroup>
            <FieldGroup title="White Balance">
              <Slider label="Temperature" value={basic.temperature} onChange={(v) => set(['basic', 'temperature'], v)} />
              <Slider label="Tint" value={basic.tint} onChange={(v) => set(['basic', 'tint'], v)} />
            </FieldGroup>
          </>
        )}

        {/* --------------------------------------------------------- LEVELS */}
        {activeTab === 'levels' && (
          <>
            <FieldGroup title="Histogram" right={<span className="text-[10px] uppercase text-slate-400">{levels.channel}</span>}>
              <Histogram histogram={histogram} channel="rgb" height={100} />
            </FieldGroup>
            <FieldGroup title="Channel">
              <ChannelTabs
                value={levels.channel}
                onChange={(v) => set(['levels', 'channel'], v)}
                channels={RGB_CHANNELS}
              />
            </FieldGroup>
            <FieldGroup title="Input Levels">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Black point</span>
                <NumField
                  value={levels[levels.channel].inBlack}
                  onChange={(v) => set(['levels', levels.channel, 'inBlack'], v)}
                />
              </div>
              <Slider
                label="Midtones (gamma)"
                min={0.1}
                max={3}
                step={0.01}
                defaultValue={1}
                value={levels[levels.channel].gamma}
                onChange={(v) => set(['levels', levels.channel, 'gamma'], v)}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>White point</span>
                <NumField
                  value={levels[levels.channel].inWhite}
                  onChange={(v) => set(['levels', levels.channel, 'inWhite'], v)}
                />
              </div>
            </FieldGroup>
            <FieldGroup title="Output Levels">
              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Output black</span>
                <NumField
                  value={levels[levels.channel].outBlack}
                  onChange={(v) => set(['levels', levels.channel, 'outBlack'], v)}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Output white</span>
                <NumField
                  value={levels[levels.channel].outWhite}
                  onChange={(v) => set(['levels', levels.channel, 'outWhite'], v)}
                />
              </div>
            </FieldGroup>
          </>
        )}

        {/* --------------------------------------------------------- CURVES */}
        {activeTab === 'curves' && (
          <>
            <FieldGroup title="Channel">
              <ChannelTabs
                value={curves.channel}
                onChange={(v) => set(['curves', 'channel'], v)}
                channels={RGB_CHANNELS}
              />
            </FieldGroup>
            <div className="px-4 py-3">
              <CurveEditor
                points={curves[curves.channel].points}
                color={{ rgb: '#c69a32', r: '#ef4444', g: '#22c55e', b: '#3b82f6' }[curves.channel]}
                onChange={(points) => set(['curves', curves.channel, 'points'], points, `curve-${curves.channel}`)}
              />
            </div>
            <div className="px-4 pb-3">
              <ActionButton
                className="w-full"
                onClick={() => set(['curves', curves.channel, 'points'], [{ x: 0, y: 0 }, { x: 255, y: 255 }])}
              >
                <FiRefreshCw size={12} /> Reset {curves.channel.toUpperCase()} curve
              </ActionButton>
            </div>
          </>
        )}

        {/* ---------------------------------------------------------- COLOR */}
        {activeTab === 'color' && (
          <>
            <FieldGroup title="Master">
              <Slider label="Hue" min={-180} max={180} value={color.master.hue} onChange={(v) => set(['color', 'master', 'hue'], v)} />
              <Slider label="Saturation" value={color.master.saturation} onChange={(v) => set(['color', 'master', 'saturation'], v)} />
              <Slider label="Lightness" value={color.master.lightness} onChange={(v) => set(['color', 'master', 'lightness'], v)} />
            </FieldGroup>

            <FieldGroup title="Hue / Saturation (HSL)">
              <div className="mb-2 flex flex-wrap gap-1">
                {HSL_CHANNELS.map((channel) => (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => setHslChannel(channel.id)}
                    className={cn(
                      'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all',
                      hslChannel === channel.id
                        ? 'border-transparent text-white'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    )}
                    style={hslChannel === channel.id ? { backgroundColor: channel.color } : undefined}
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
              <Slider label="Hue" min={-180} max={180} value={color.hsl[hslChannel].hue} onChange={(v) => set(['color', 'hsl', hslChannel, 'hue'], v)} />
              <Slider label="Saturation" value={color.hsl[hslChannel].saturation} onChange={(v) => set(['color', 'hsl', hslChannel, 'saturation'], v)} />
              <Slider label="Lightness" value={color.hsl[hslChannel].lightness} onChange={(v) => set(['color', 'hsl', hslChannel, 'lightness'], v)} />
            </FieldGroup>

            <FieldGroup title="Color Balance">
              <div className="mb-2">
                <ChannelTabs value={balanceZone} onChange={setBalanceZone} channels={BALANCE_ZONES} />
              </div>
              {BALANCE_LABELS.map((label, index) => (
                <Slider
                  key={label}
                  label={label}
                  value={color.balance[balanceZone][index]}
                  onChange={(v) => {
                    const next = [...color.balance[balanceZone]];
                    next[index] = v;
                    set(['color', 'balance', balanceZone], next);
                  }}
                  group={`balance-${balanceZone}-${index}`}
                />
              ))}
            </FieldGroup>

            <FieldGroup title="White Balance">
              <Slider label="Temperature" value={basic.temperature} onChange={(v) => set(['basic', 'temperature'], v)} />
              <Slider label="Tint" value={basic.tint} onChange={(v) => set(['basic', 'tint'], v)} />
            </FieldGroup>

            <FieldGroup title="Selective Color">
              <Slider label="Range hue" min={0} max={360} value={color.selective.hue} onChange={(v) => set(['color', 'selective', 'hue'], v)} suffix="°" />
              <Slider label="Range width" min={5} max={120} value={color.selective.range} onChange={(v) => set(['color', 'selective', 'range'], v)} />
              <Slider label="Cyan" value={color.selective.cyan} onChange={(v) => set(['color', 'selective', 'cyan'], v)} />
              <Slider label="Magenta" value={color.selective.magenta} onChange={(v) => set(['color', 'selective', 'magenta'], v)} />
              <Slider label="Yellow" value={color.selective.yellow} onChange={(v) => set(['color', 'selective', 'yellow'], v)} />
              <Slider label="Black" value={color.selective.black} onChange={(v) => set(['color', 'selective', 'black'], v)} />
            </FieldGroup>
          </>
        )}

        {/* -------------------------------------------------------- DETAILS */}
        {activeTab === 'details' && (
          <FieldGroup title="Detail">
            <Slider label="Sharpen" min={0} max={100} value={details.sharpen} onChange={(v) => set(['details', 'sharpen'], v)} />
            <Slider label="Clarity" value={details.clarity} onChange={(v) => set(['details', 'clarity'], v)} />
            <Slider label="Texture" value={details.texture} onChange={(v) => set(['details', 'texture'], v)} />
            <Slider label="Noise Reduction" min={0} max={100} value={details.noiseReduction} onChange={(v) => set(['details', 'noiseReduction'], v)} />
            <Slider label="Dehaze" value={details.dehaze} onChange={(v) => set(['details', 'dehaze'], v)} />
          </FieldGroup>
        )}

        {/* ------------------------------------------------------ TRANSFORM */}
        {activeTab === 'transform' && (
          <>
            <FieldGroup title="Rotate & Flip">
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  onClick={() => set(['transform', 'rotate90'], (((transform.rotate90 - 90) % 360) + 360) % 360)}
                  title="Rotate left"
                >
                  <FiRotateCcw size={14} /> Left
                </ActionButton>
                <ActionButton
                  onClick={() => set(['transform', 'rotate90'], (transform.rotate90 + 90) % 360)}
                  title="Rotate right"
                >
                  <FiRotateCw size={14} /> Right
                </ActionButton>
                <ActionButton
                  variant={transform.flipH ? 'primary' : 'ghost'}
                  onClick={() => set(['transform', 'flipH'], !transform.flipH)}
                >
                  Flip H
                </ActionButton>
                <ActionButton
                  variant={transform.flipV ? 'primary' : 'ghost'}
                  onClick={() => set(['transform', 'flipV'], !transform.flipV)}
                >
                  Flip V
                </ActionButton>
              </div>
            </FieldGroup>
            <FieldGroup title="Straighten">
              <Slider
                label="Angle"
                min={-45}
                max={45}
                step={0.5}
                value={transform.straighten}
                suffix="°"
                onChange={(v) => set(['transform', 'straighten'], v)}
              />
            </FieldGroup>
            <FieldGroup title="Crop">
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  variant={isCropping ? 'primary' : 'ghost'}
                  onClick={onToggleCrop}
                >
                  <FiCrop size={14} /> {isCropping ? 'Done cropping' : 'Crop image'}
                </ActionButton>
                <ActionButton variant="danger" onClick={onResetCrop} disabled={!transform.crop}>
                  Reset crop
                </ActionButton>
              </div>
            </FieldGroup>
          </>
        )}
      </div>

      {/* Footer reset */}
      <div className="shrink-0 border-t border-slate-100 p-3">
        <ActionButton className="w-full" onClick={defaults} disabled={!sectionDirty}>
          <FiRefreshCw size={12} /> Reset {TOOL_TABS.find((t) => t.id === activeTab)?.label}
        </ActionButton>
      </div>
    </div>
  );
}
