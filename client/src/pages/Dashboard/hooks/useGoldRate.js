import { useCallback, useEffect, useState } from 'react';

// There is no server-side gold rate feed in this app, so the 24K per-gram
// reference is a manually configured value kept on the machine. 22K/18K are
// derived from it using the standard karat ratio.
const STORAGE_KEY = 'dashboard.goldRate.v1';

const EMPTY = { rate24k: 0, updatedAt: null };

const read = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    const rate24k = parseFloat(parsed?.rate24k);
    return {
      rate24k: Number.isFinite(rate24k) && rate24k > 0 ? rate24k : 0,
      updatedAt: parsed?.updatedAt || null,
    };
  } catch {
    return EMPTY;
  }
};

export function useGoldRate() {
  const [state, setState] = useState(read);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY) setState(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = useCallback((value) => {
    const parsed = parseFloat(value);
    const next = {
      rate24k: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
      updatedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable (private mode); keep the in-memory value.
    }
    setState(next);
  }, []);

  return {
    rate24k: state.rate24k,
    updatedAt: state.updatedAt,
    rate22k: state.rate24k ? (state.rate24k * 22) / 24 : 0,
    rate18k: state.rate24k ? (state.rate24k * 18) / 24 : 0,
    hasRate: state.rate24k > 0,
    save,
  };
}

export default useGoldRate;
