import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export const DEFAULT_APPEARANCE = {
  colors: {
    primary: "#C69A32",
    accent: "#DD845A",
    headerBg: "#FFFFFF",
    sidebarBg: "#171715",
    pageBg: "#F7F5F0",
  },
  density: {
    headerHeight: 64,
    sidebarWidth: 260,
    sidebarCollapsedWidth: 70,
    rowHeight: 0,
    radius: 1,
  },
  typography: {
    fontFamily: "Poppins",
    fontScale: 1,
  },
};

export const APPEARANCE_AREA_OPTIONS = [
  { value: "dashboard", label: "Dashboard" },
  { value: "entries", label: "New Entries" },
  { value: "token", label: "Token" },
  { value: "skin-testing", label: "Skin Testing" },
  { value: "photo-testing", label: "Photo Testing" },
  { value: "photo-studio", label: "Photo Studio" },
  { value: "pure-exchange", label: "Pure Exchange" },
  { value: "customer-data", label: "Customer Data" },
  { value: "token-data", label: "Token Data" },
  { value: "skintest-data", label: "Skin Test Data" },
  { value: "exchange-data", label: "Exchange Data" },
  { value: "unpaid-customers", label: "Unpaid Customers" },
  { value: "cashbook", label: "Cash Book" },
  { value: "expenses", label: "Expenses" },
  { value: "cash-adjustments", label: "Cash Adjustments" },
  { value: "settings", label: "Settings" },
];

export const areaForPath = (pathname = "") => {
  const path = pathname || "";
  if (path.startsWith("/skintest-data")) return "skintest-data";
  if (path.startsWith("/skin-testing")) return "skin-testing";
  if (path.startsWith("/token-data")) return "token-data";
  if (path.startsWith("/token")) return "token";
  if (path.startsWith("/customer-data")) return "customer-data";
  if (path.startsWith("/exchange-data")) return "exchange-data";
  if (path.startsWith("/unpaid-customers")) return "unpaid-customers";
  if (path.startsWith("/pure-exchange")) return "pure-exchange";
  if (path.startsWith("/photo-testing")) return "photo-testing";
  if (path.startsWith("/photo-studio")) return "photo-studio";
  if (path.startsWith("/cash-adjustments")) return "cash-adjustments";
  if (path.startsWith("/cashbook")) return "cashbook";
  if (path.startsWith("/expenses")) return "expenses";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/dashboard")) return "dashboard";
  if (path.startsWith("/entries")) return "entries";
  return "global";
};

const COLOR_KEYS = ["primary", "accent", "headerBg", "sidebarBg", "pageBg"];
const DENSITY_KEYS = [
  "headerHeight",
  "sidebarWidth",
  "sidebarCollapsedWidth",
  "rowHeight",
  "radius",
];
const TYPOGRAPHY_KEYS = ["fontFamily", "fontScale"];

const clone = (value) => JSON.parse(JSON.stringify(value));

const mergeAppearance = (stored) => {
  const base = {
    colors: { ...DEFAULT_APPEARANCE.colors },
    density: { ...DEFAULT_APPEARANCE.density },
    typography: { ...DEFAULT_APPEARANCE.typography },
    areas: {},
  };
  if (!stored || typeof stored !== "object") return base;

  base.colors = { ...base.colors, ...(stored.colors || {}) };
  base.density = { ...base.density, ...(stored.density || {}) };
  base.typography = { ...base.typography, ...(stored.typography || {}) };

  if (stored.areas && typeof stored.areas === "object") {
    for (const [area, override] of Object.entries(stored.areas)) {
      if (!override) continue;
      base.areas[area] = {
        colors: override.colors || {},
        density: override.density || {},
        typography: override.typography || {},
      };
    }
  }
  return base;
};

const mergeTheme = (base, override) => ({
  colors: { ...base.colors, ...((override && override.colors) || {}) },
  density: { ...base.density, ...((override && override.density) || {}) },
  typography: { ...base.typography, ...((override && override.typography) || {}) },
});

const hexToRgb = (hex) => {
  if (typeof hex !== "string") return null;
  const value = hex.trim().replace(/^#/, "");
  const full =
    value.length === 3
      ? value.split("").map((ch) => ch + ch).join("")
      : value;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

const toTriplet = (hex, fallback) => {
  const rgb = hexToRgb(hex) || hexToRgb(fallback);
  if (!rgb) return "0 0 0";
  return `${rgb.r} ${rgb.g} ${rgb.b}`;
};

const shade = (hex, amount) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "";
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.min(1, Math.abs(amount));
  const mix = (channel) => Math.round(channel + (target - channel) * ratio);
  return `${mix(rgb.r)} ${mix(rgb.g)} ${mix(rgb.b)}`;
};

const toDimension = (value, fallback) => {
  const numeric = Number(value);
  return `${Number.isFinite(numeric) ? numeric : fallback}px`;
};

const toFontFamily = (value) => {
  const family = (value || "Poppins").toString().trim() || "Poppins";
  return /[",]/.test(family) ? family : `"${family}", sans-serif`;
};

const GOOGLE_FONT_WEIGHTS = "300;400;500;600;700";
let fontLinkTimer = null;
let lastFontSignature = "";

const primaryFontFamily = (value) =>
  (value || "")
    .toString()
    .split(",")[0]
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();

const collectFontFamilies = (appearance) => {
  const families = [];
  const add = (value) => {
    const family = primaryFontFamily(value);
    if (!family || family.toLowerCase() === "poppins") return;
    if (families.some((existing) => existing.toLowerCase() === family.toLowerCase())) return;
    families.push(family);
  };
  add(appearance && appearance.typography && appearance.typography.fontFamily);
  const areas = (appearance && appearance.areas) || {};
  for (const override of Object.values(areas)) {
    if (override && override.typography) add(override.typography.fontFamily);
  }
  return families;
};

const buildGoogleFontUrl = (families, withWeights) =>
  `https://fonts.googleapis.com/css2?${families
    .map(
      (family) =>
        `family=${family.trim().replace(/\s+/g, "+")}${
          withWeights ? `:wght@${GOOGLE_FONT_WEIGHTS}` : ""
        }`
    )
    .join("&")}&display=swap`;

const applyFontLink = (appearance) => {
  if (typeof document === "undefined") return;
  const families = collectFontFamilies(appearance);
  const signature = families.join("|");
  let link = document.getElementById("app-appearance-font");

  if (families.length === 0) {
    if (link) link.remove();
    lastFontSignature = "";
    return;
  }
  if (signature === lastFontSignature && link) return;
  lastFontSignature = signature;

  if (!link) {
    link = document.createElement("link");
    link.id = "app-appearance-font";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.dataset.fallback = "0";
  link.onerror = () => {
    if (link.dataset.fallback === "1") return;
    link.dataset.fallback = "1";
    link.href = buildGoogleFontUrl(families, false);
  };
  link.href = buildGoogleFontUrl(families, true);
};

const scheduleFontLink = (appearance) => {
  if (fontLinkTimer) clearTimeout(fontLinkTimer);
  fontLinkTimer = setTimeout(() => applyFontLink(appearance), 400);
};

const buildVars = (theme) => {
  const { colors: c, density: d, typography: t } = theme;
  return [
    `--app-primary:${toTriplet(c.primary, DEFAULT_APPEARANCE.colors.primary)};`,
    `--app-primary-dark:${shade(c.primary, -0.18)};`,
    `--app-gold:${toTriplet(c.primary, DEFAULT_APPEARANCE.colors.primary)};`,
    `--app-gold-dark:${shade(c.primary, -0.2)};`,
    `--app-gold-light:${shade(c.primary, 0.24)};`,
    `--app-gold-soft:${shade(c.primary, 0.84)};`,
    `--app-gold-bright:${shade(c.primary, 0.4)};`,
    `--app-secondary:${toTriplet(c.accent, DEFAULT_APPEARANCE.colors.accent)};`,
    `--app-secondary-dark:${shade(c.accent, -0.16)};`,
    `--app-header-bg:${c.headerBg};`,
    `--app-sidebar-bg:${c.sidebarBg};`,
    `--app-page-bg:${c.pageBg};`,
    `--app-header-h:${toDimension(d.headerHeight, 64)};`,
    `--app-sidebar-w:${toDimension(d.sidebarWidth, 260)};`,
    `--app-sidebar-w-collapsed:${toDimension(d.sidebarCollapsedWidth, 70)};`,
    Number(d.rowHeight) > 0 ? `--app-row-h:${toDimension(d.rowHeight, 44)};` : "",
    `--app-radius:${Number.isFinite(Number(d.radius)) ? Number(d.radius) : 1};`,
    `--app-font:${toFontFamily(t.fontFamily)};`,
    `--app-font-scale:${Number.isFinite(Number(t.fontScale)) ? Number(t.fontScale) : 1};`,
  ].join("");
};

const listeners = new Set();
let cache = null;
let cacheUserId = null;
let activeUserId = null;

const resolveUserId = () => {
  if (activeUserId) return activeUserId;
  try {
    const raw = window.localStorage.getItem("user");
    if (!raw) return "guest";
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? String(parsed.id) : "guest";
  } catch {
    return "guest";
  }
};

const storageKey = (userId) => `appearance:${userId}`;

const readStorage = (userId) => {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAppearance = () => {
  const userId = resolveUserId();
  if (!cache || cacheUserId !== userId) {
    cacheUserId = userId;
    cache = mergeAppearance(readStorage(userId));
  }
  return cache;
};

const emit = () => listeners.forEach((listener) => listener());

const ensureStyleEl = () => {
  let el = document.getElementById("app-appearance");
  if (!el) {
    el = document.createElement("style");
    el.id = "app-appearance";
    document.head.appendChild(el);
  }
  return el;
};

export const applyAppearance = (appearance = getAppearance()) => {
  if (typeof document === "undefined") return;
  const style = ensureStyleEl();
  const rules = [`:root{${buildVars(appearance)}}`];
  const areas = appearance.areas || {};
  for (const [area, override] of Object.entries(areas)) {
    if (!override) continue;
    rules.push(`[data-app-area="${area}"]{${buildVars(mergeTheme(appearance, override))}}`);
  }
  style.textContent = rules.join("");
  scheduleFontLink(appearance);
};

const persist = (next) => {
  const userId = resolveUserId();
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // Ignore private-mode / quota failures; the session still reflects the change.
  }
  cache = next;
  cacheUserId = userId;
  emit();
  applyAppearance(next);
};

export const setAppearanceValue = (group, key, value) => {
  const next = clone(getAppearance());
  next[group] = { ...(next[group] || {}), [key]: value };
  persist(next);
};

export const setAreaValue = (area, group, key, value) => {
  const next = clone(getAppearance());
  const areas = { ...(next.areas || {}) };
  const current = { ...(areas[area] || {}) };
  current[group] = { ...(current[group] || {}), [key]: value };
  areas[area] = current;
  next.areas = areas;
  persist(next);
};

export const resetArea = (area) => {
  const next = clone(getAppearance());
  const areas = { ...(next.areas || {}) };
  delete areas[area];
  next.areas = areas;
  persist(next);
};

export const resetAppearance = () => {
  const next = { ...clone(DEFAULT_APPEARANCE), areas: {} };
  persist(next);
};

export const refreshAppearance = () => {
  activeUserId = resolveUserId();
  cache = null;
  cacheUserId = null;
  emit();
  applyAppearance();
};

export const appearanceStorageKey = () => storageKey(resolveUserId());

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => getAppearance();

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (!event.key || event.key.startsWith("appearance:")) {
      cache = null;
      cacheUserId = null;
      emit();
      applyAppearance();
    }
  });
}

export const useAppearance = () =>
  useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_APPEARANCE);

export const AppearanceAreaContext = createContext("global");

export const useAppearanceArea = () => useContext(AppearanceAreaContext);

export const useAreaAppearance = () => {
  const area = useAppearanceArea();
  const appearance = useAppearance();
  const override = area && area !== "global" ? appearance.areas?.[area] : null;
  const theme = useMemo(
    () => mergeTheme(appearance, override || {}),
    [appearance, override]
  );
  return { area, appearance, theme };
};

export const useRowHeight = (base) => {
  const { theme } = useAreaAppearance();
  const value = Number(theme.density?.rowHeight);
  return value > 0 ? value : base;
};

export const AppearanceProvider = ({ userId, children }) => {
  useEffect(() => {
    refreshAppearance();
  }, [userId]);

  useEffect(() => {
    applyAppearance();
  }, []);

  return (
    <AppearanceAreaContext.Provider value="global">
      {children}
    </AppearanceAreaContext.Provider>
  );
};
