import { useSyncExternalStore } from "react";

export const PREFERENCE_DEFAULTS = {
  showSaveConfirmation: false,
  skinTest_printValuesOnly: false,
  confirmBeforeDelete: true,
  defaultLandingPath: "",
  dashboardRefreshInterval: 5,
  currencySymbol: "₹",
  currencyDecimals: 2,
};

const listeners = new Set();
let snapshot = null;

const parse = (key, raw) => {
  const fallback = PREFERENCE_DEFAULTS[key];
  if (raw === null || raw === undefined) return fallback;
  if (typeof fallback === "boolean") return raw === "true";
  if (typeof fallback === "number") {
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }
  return raw;
};

export const getPreference = (key) => {
  try {
    return parse(key, window.localStorage.getItem(key));
  } catch {
    return PREFERENCE_DEFAULTS[key];
  }
};

const emit = () => listeners.forEach((listener) => listener());

export const setPreference = (key, value) => {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore storage failures (private mode / quota); the current session still
    // reflects the change through the in-memory snapshot.
  }
  snapshot = null;
  emit();
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => {
  if (!snapshot) {
    snapshot = Object.fromEntries(
      Object.keys(PREFERENCE_DEFAULTS).map((key) => [key, getPreference(key)])
    );
  }
  return snapshot;
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", () => {
    snapshot = null;
    emit();
  });
}

export const usePreference = (key) =>
  useSyncExternalStore(
    subscribe,
    () => getPreference(key),
    () => PREFERENCE_DEFAULTS[key]
  );

export const usePreferences = () => {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, () => PREFERENCE_DEFAULTS);
  return { preferences, setPreference };
};
