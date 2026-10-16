import { getPreference } from "../lib/preferences";

export const getCurrencySymbol = () => getPreference("currencySymbol") || "₹";

export const getCurrencyDecimals = () => {
  const value = Number(getPreference("currencyDecimals"));
  return Number.isFinite(value) ? value : 2;
};

/** Formats a money amount with the configured symbol and decimal places. */
export const formatCurrency = (value, options = {}) => {
  const decimals = options.decimals ?? getCurrencyDecimals();
  const symbol = options.symbol ?? getCurrencySymbol();
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `${symbol}${safe.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/** Formats a numeric amount with the configured decimal places (no symbol). */
export const formatAmount = (value, decimals = getCurrencyDecimals()) => {
  const amount = Number(value);
  const safe = Number.isFinite(amount) ? amount : 0;
  return safe.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatWeight = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : "0.00";
};
