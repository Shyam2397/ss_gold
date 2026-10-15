/**
 * Photo Studio - non-destructive edit model.
 *
 * The original image is never modified. Every tool writes plain numbers into
 * the `adjustments` tree below; the render engine replays that tree on top of
 * the untouched source pixels. This keeps undo/redo, reset and before/after
 * trivial (they are just different snapshots of this object).
 */

export const TOOL_TABS = [
  { id: 'basic', label: 'Basic' },
  { id: 'levels', label: 'Levels' },
  { id: 'curves', label: 'Curves' },
  { id: 'color', label: 'Color' },
  { id: 'details', label: 'Details' },
  { id: 'transform', label: 'Transform' },
];

export const HSL_CHANNELS = [
  { id: 'reds', label: 'Reds', hue: 0, color: '#e5484d' },
  { id: 'oranges', label: 'Oranges', hue: 30, color: '#e8890c' },
  { id: 'yellows', label: 'Yellows', hue: 60, color: '#e8c00c' },
  { id: 'greens', label: 'Greens', hue: 120, color: '#30a46c' },
  { id: 'aquas', label: 'Aquas', hue: 180, color: '#12a594' },
  { id: 'blues', label: 'Blues', hue: 225, color: '#3e63dd' },
  { id: 'purples', label: 'Purples', hue: 275, color: '#8e4ec6' },
  { id: 'magentas', label: 'Magentas', hue: 315, color: '#d6409f' },
];

const defaultLevels = () => ({
  inBlack: 0,
  inWhite: 255,
  gamma: 1,
  outBlack: 0,
  outWhite: 255,
});

const defaultCurve = () => ({ points: [{ x: 0, y: 0 }, { x: 255, y: 255 }] });

const defaultHsl = () => ({
  reds: { hue: 0, saturation: 0, lightness: 0 },
  oranges: { hue: 0, saturation: 0, lightness: 0 },
  yellows: { hue: 0, saturation: 0, lightness: 0 },
  greens: { hue: 0, saturation: 0, lightness: 0 },
  aquas: { hue: 0, saturation: 0, lightness: 0 },
  blues: { hue: 0, saturation: 0, lightness: 0 },
  purples: { hue: 0, saturation: 0, lightness: 0 },
  magentas: { hue: 0, saturation: 0, lightness: 0 },
});

export const createTransform = () => ({
  rotate90: 0, // quarter turns: 0/90/180/270
  straighten: 0, // fine angle in degrees, -45..45
  flipH: false,
  flipV: false,
  crop: null, // { x, y, width, height } in source-pixel space
});

export const createDefaultAdjustments = () => ({
  basic: {
    exposure: 0, // -100..100 (~EV)
    brightness: 0, // -100..100
    contrast: 0, // -100..100
    highlights: 0, // -100..100
    shadows: 0, // -100..100
    whites: 0, // -100..100
    blacks: 0, // -100..100
    saturation: 0, // -100..100
    vibrance: 0, // -100..100
    temperature: 0, // -100..100 (cool->warm)
    tint: 0, // -100..100 (green->magenta)
  },
  levels: {
    channel: 'rgb',
    rgb: defaultLevels(),
    r: defaultLevels(),
    g: defaultLevels(),
    b: defaultLevels(),
  },
  curves: {
    channel: 'rgb',
    rgb: defaultCurve(),
    r: defaultCurve(),
    g: defaultCurve(),
    b: defaultCurve(),
  },
  color: {
    master: { hue: 0, saturation: 0, lightness: 0 },
    hsl: defaultHsl(),
    balance: {
      shadows: [0, 0, 0], // cyan..red, magenta..green, yellow..blue (-100..100)
      midtones: [0, 0, 0],
      highlights: [0, 0, 0],
    },
    whiteBalance: { temperature: 0, tint: 0 },
    selective: { hue: 30, range: 40, cyan: 0, magenta: 0, yellow: 0, black: 0 },
  },
  details: {
    sharpen: 0, // 0..100
    clarity: 0, // -100..100
    texture: 0, // -100..100
    noiseReduction: 0, // 0..100
    dehaze: 0, // -100..100
  },
  transform: createTransform(),
});

export const clone = (value) =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

/** Deep "is this section back to its default?" check used to show the reset dot. */
const diff = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

export const isSectionDefault = (adjustments, section) => {
  const base = createDefaultAdjustments();
  return !diff(adjustments[section], base[section]);
};

const setIn = (obj, path, value) => {
  const next = clone(obj);
  let cursor = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    cursor = cursor[path[i]];
  }
  cursor[path[path.length - 1]] = value;
  return next;
};

const HISTORY_LIMIT = 60;
const COALESCE_MS = 700;

export const createInitialHistory = () => ({
  past: [],
  present: createDefaultAdjustments(),
  future: [],
  lastGroup: null,
  lastTime: 0,
});

/**
 * Reducer over the history stack. `SET` updates the live value; consecutive
 * `SET`s that share a `group` within COALESCE_MS (i.e. one slider drag) fold
 * into a single undo step so undo does not walk back pixel-by-pixel.
 */
export const historyReducer = (state, action) => {
  switch (action.type) {
    case 'SET': {
      const present = setIn(state.present, action.path, action.value);
      const now = Date.now();
      const coalesce =
        action.group &&
        action.group === state.lastGroup &&
        now - state.lastTime < COALESCE_MS;
      const past = coalesce
        ? state.past
        : [...state.past, state.present].slice(-HISTORY_LIMIT);
      return {
        ...state,
        past,
        present,
        future: [],
        lastGroup: action.group ?? null,
        lastTime: now,
      };
    }
    case 'RESET_SECTION': {
      const present = {
        ...state.present,
        [action.section]: createDefaultAdjustments()[action.section],
      };
      return {
        ...state,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present,
        future: [],
        lastGroup: null,
      };
    }
    case 'RESET_ALL': {
      if (!action.silent) {
        return {
          ...state,
          past: [...state.past, state.present].slice(-HISTORY_LIMIT),
          present: createDefaultAdjustments(),
          future: [],
          lastGroup: null,
        };
      }
      return { ...createInitialHistory() };
    }
    case 'LOAD_SNAPSHOT': {
      return {
        ...state,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: action.adjustments,
        future: [],
        lastGroup: null,
      };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future].slice(0, HISTORY_LIMIT),
        lastGroup: null,
      };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const next = state.future[0];
      return {
        ...state,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        present: next,
        future: state.future.slice(1),
        lastGroup: null,
      };
    }
    default:
      return state;
  }
};
