import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { getApi } from '../../../services/api';
import { fetchCashAdjustments } from '../services/dashboardService';
import { parseDate } from '../utils/dateUtils';

// How often the dashboard silently refreshes its data (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
};

const startOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

// Current period range used for the KPI figures.
function getPeriodRange(period) {
  const end = endOfDay(new Date());
  let start;
  switch (period) {
    case 'yearly':
      start = new Date(end.getFullYear(), 0, 1);
      break;
    case 'monthly':
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      break;
    case 'weekly': {
      start = startOfDay(end);
      start.setDate(start.getDate() - start.getDay());
      break;
    }
    default:
      start = startOfDay(end);
  }
  return { start, end };
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Ordered time buckets backing the trend chart for each period.
function buildBuckets(period) {
  const buckets = [];
  const today = startOfDay(new Date());

  if (period === 'yearly') {
    const year = today.getFullYear();
    for (let i = 4; i >= 0; i -= 1) {
      const y = year - i;
      buckets.push({
        label: String(y),
        start: new Date(y, 0, 1),
        end: endOfDay(new Date(y, 11, 31)),
      });
    }
    return buckets;
  }

  if (period === 'monthly') {
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      buckets.push({
        label: MONTHS_SHORT[d.getMonth()],
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
      });
    }
    return buckets;
  }

  if (period === 'weekly') {
    for (let i = 7; i >= 0; i -= 1) {
      const start = startOfDay(today);
      start.setDate(start.getDate() - (start.getDay() + i * 7));
      const end = endOfDay(new Date(start));
      end.setDate(end.getDate() + 6);
      buckets.push({ label: `${start.getDate()} ${MONTHS_SHORT[start.getMonth()]}`, start, end });
    }
    return buckets;
  }

  // daily -> last 7 days
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    buckets.push({
      label: `${day.getDate()} ${MONTHS_SHORT[day.getMonth()]}`,
      start: startOfDay(day),
      end: endOfDay(day),
    });
  }
  return buckets;
}

// Karat tiers with the karat threshold each group starts at, ordered high to low.
// Reference (karat → hallmark fineness → gold purity):
//   24K → 999/995 → 99.9/99.5% | 23K → 958 → 95.8% | 22K → 916 → 91.6%
//   20K → 833 → 83.3% | 18K → 750 → 75.0% | 14K → 585 → 58.5%
//   12K → 500 → 50.0% | 10K → 417 → 41.7% | 9K → 375 → 37.5%
export const PURITY_TYPES = [
  { name: '24K', min: 23.5, color: '#9A7019' },
  { name: '23K', min: 22.5, color: '#B08A1E' },
  { name: '22K', min: 21.5, color: '#C69A32' },
  { name: '20K', min: 19.5, color: '#D8B14A' },
  { name: '18K', min: 17.5, color: '#E4C46B' },
  { name: '14K', min: 13.5, color: '#EAD79B' },
  { name: '12K', min: 11.5, color: '#F1E3BB' },
  { name: '10K', min: 9.5, color: '#CFC7B4' },
  { name: '9K', min: 8.5, color: '#B7AE9A' },
];

export const PURITY_ORDER = [...PURITY_TYPES.map((type) => type.name), 'Other'];

const PURITY_COLORS = {
  ...Object.fromEntries(PURITY_TYPES.map((type) => [type.name, type.color])),
  Other: '#8C8577',
};

// Maps a result's karat (or gold fineness) to the purity group used by the charts.
export function karatCategory(karat, fineness) {
  let k = toNumber(karat);
  if (!k) {
    const f = toNumber(fineness);
    if (f) k = f / 4.1667;
  }
  if (!k) return 'Other';
  const match = PURITY_TYPES.find((type) => k >= type.min);
  return match ? match.name : 'Other';
}

function within(date, range) {
  if (!date || Number.isNaN(date.getTime())) return false;
  const day = startOfDay(date);
  return day >= range.start && day <= range.end;
}

function useDashboardOverview() {
  const [tokens, setTokens] = useState([]);
  const [entries, setEntries] = useState([]);
  const [skinTests, setSkinTests] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [exchanges, setExchanges] = useState([]);
  const [cashAdjustments, setCashAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    const signal = abortControllerRef.current?.signal;
    try {
      setError(null);
      const instance = await getApi();
      const request = (url) => instance.get(url, signal ? { signal } : undefined);
      const safeRequest = (url) => request(url).catch(() => null);

      const [tokensRes, entriesRes, skinTestsRes, expensesRes, exchangesRes, cashAdjustmentsRes] =
        await Promise.all([
          request('/tokens'),
          request('/entries'),
          request('/skin-tests'),
          safeRequest('/api/expenses'),
          safeRequest('/pure-exchange'),
          fetchCashAdjustments().catch(() => []),
        ]);

      const normalisedTokens = asArray(tokensRes?.data).map((token) => ({
        ...token,
        weight: toNumber(token.weight),
        amount: toNumber(token.amount),
        _ts: parseDate(token.date, token.time).getTime() || 0,
      }));

      const normalisedSkinTests = asArray(skinTestsRes?.data).map((test) => ({
        ...test,
        weight: toNumber(test.weight),
        gold_fineness: toNumber(test.gold_fineness),
        karat: toNumber(test.karat),
        _ts: parseDate(test.date, test.time).getTime() || 0,
        _category: karatCategory(test.karat, test.gold_fineness),
      }));

      const normalisedExpenses = asArray(expensesRes?.data).map((expense) => ({
        ...expense,
        amount: toNumber(expense.amount),
      }));

      const normalisedExchanges = asArray(exchangesRes?.data?.data).map((exchange) => ({
        ...exchange,
        weight: toNumber(exchange.weight),
        exweight: toNumber(exchange.exweight),
      }));

      setTokens(normalisedTokens);
      setEntries(asArray(entriesRes?.data));
      setSkinTests(normalisedSkinTests);
      setExpenses(normalisedExpenses);
      setExchanges(normalisedExchanges);
      setCashAdjustments(Array.isArray(cashAdjustmentsRes) ? cashAdjustmentsRes : []);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      setError(err.message || 'Failed to load dashboard data');
      setLoading(false);
      toast.error('Failed to load dashboard data');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [fetchData]);

  const skinTestTokenNos = useMemo(
    () => new Set(skinTests.map((test) => String(test.token_no))),
    [skinTests]
  );

  const kpis = useMemo(() => {
    const range = getPeriodRange(selectedPeriod);
    const todayRange = getPeriodRange('daily');
    const weekRange = getPeriodRange('weekly');

    const tokensInPeriod = tokens.filter((t) => within(parseDate(t.date, t.time), range));
    const testsInPeriod = skinTests.filter((t) => within(parseDate(t.date, t.time), range));
    const pendingInPeriod = tokensInPeriod.filter((t) => !skinTestTokenNos.has(String(t.token_no)));

    const tokensToday = tokens.filter((t) => within(parseDate(t.date, t.time), todayRange));
    const testsToday = skinTests.filter((t) => within(parseDate(t.date, t.time), todayRange));
    const pendingToday = tokensToday.filter((t) => !skinTestTokenNos.has(String(t.token_no)));
    const customersThisWeek = entries.filter((entry) => within(parseDate(entry.created_at), weekRange));

    return {
      totalSamples: tokensInPeriod.length,
      completedTests: testsInPeriod.length,
      pendingTests: pendingInPeriod.length,
      totalCustomers: entries.length,
      samplesToday: tokensToday.length,
      completedToday: testsToday.length,
      pendingToday: pendingToday.length,
      customersThisWeek: customersThisWeek.length,
    };
  }, [tokens, skinTests, entries, selectedPeriod, skinTestTokenNos]);

  // Financial / exchange totals mirroring the previous dashboard's metric grid.
  const finance = useMemo(() => {
    const revenue = tokens.reduce((sum, token) => sum + token.amount, 0);
    const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const adjustments = cashAdjustments.reduce(
      (acc, adjustment) => {
        const amount = toNumber(adjustment?.amount);
        if (String(adjustment?.adjustment_type).toLowerCase() === 'addition') {
          acc.credit += amount;
        } else {
          acc.debit += amount;
        }
        return acc;
      },
      { credit: 0, debit: 0 }
    );

    const totalRevenue = revenue + adjustments.credit;
    const totalExpenses = expenseTotal + adjustments.debit;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const range = getPeriodRange(selectedPeriod);
    const periodExchanges = exchanges.filter((exchange) => within(parseDate(exchange.date), range));

    const countTest = (keyword) =>
      tokens.filter((token) => String(token.test).toLowerCase().includes(keyword)).length;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalTokens: tokens.length,
      skinTestCount: countTest('skin'),
      photoTestCount: countTest('photo'),
      totalExchanges: exchanges.length,
      impureWeight: periodExchanges.reduce((sum, exchange) => sum + exchange.weight, 0),
      pureWeight: periodExchanges.reduce((sum, exchange) => sum + exchange.exweight, 0),
    };
  }, [tokens, expenses, exchanges, cashAdjustments, selectedPeriod]);

  const trend = useMemo(() => {
    const buckets = buildBuckets(selectedPeriod).map((bucket) => {
      const row = { label: bucket.label, start: bucket.start, end: bucket.end, Samples: 0 };
      PURITY_ORDER.forEach((name) => {
        row[name] = 0;
      });
      return row;
    });

    if (buckets.length === 0) return [];

    const first = buckets[0].start;
    const last = buckets[buckets.length - 1].end;

    const findBucket = (date) => {
      if (!date || Number.isNaN(date.getTime()) || date < first || date > last) return null;
      return buckets.find((b) => date >= b.start && date <= b.end) || null;
    };

    skinTests.forEach((test) => {
      const bucket = findBucket(parseDate(test.date, test.time));
      if (bucket && bucket[test._category] !== undefined) bucket[test._category] += 1;
    });

    tokens.forEach((token) => {
      const bucket = findBucket(parseDate(token.date, token.time));
      if (bucket) bucket.Samples += 1;
    });

    return buckets.map(({ start, end, ...row }) => row);
  }, [skinTests, tokens, selectedPeriod]);

  const purity = useMemo(() => {
    const range = getPeriodRange(selectedPeriod);
    const counts = {};
    PURITY_ORDER.forEach((name) => {
      counts[name] = 0;
    });

    skinTests
      .filter((test) => within(parseDate(test.date, test.time), range))
      .forEach((test) => {
        const category = counts[test._category] === undefined ? 'Other' : test._category;
        counts[category] += 1;
      });

    const total = PURITY_ORDER.reduce((sum, key) => sum + counts[key], 0);
    const slices = PURITY_ORDER.map((name) => ({
      name,
      value: counts[name],
      color: PURITY_COLORS[name],
      percent: total > 0 ? (counts[name] / total) * 100 : 0,
    }));

    return { total, slices };
  }, [skinTests, selectedPeriod]);

  // Today's skin tests, mirroring the Skin Test page list but limited to the
  // current day and ordered newest-token first for the dashboard card.
  const recentSamples = useMemo(() => {
    const today = startOfDay(new Date()).getTime();

    return [...skinTests]
      .filter((test) => {
        const date = parseDate(test.date, test.time);
        return !Number.isNaN(date.getTime()) && startOfDay(date).getTime() === today;
      })
      .sort((a, b) => {
        const an = Number(a.token_no);
        const bn = Number(b.token_no);
        if (!Number.isNaN(an) && !Number.isNaN(bn)) return bn - an;
        return String(b.token_no).localeCompare(String(a.token_no));
      })
      .map((test) => ({
        ...test,
        tokenNo: test.token_no,
        name: test.name || 'Unknown',
        sample: test.sample || '',
        goldFineness: test.gold_fineness,
      }));
  }, [skinTests]);

  const latestResults = useMemo(() => {
    return [...skinTests]
      .sort((a, b) => b._ts - a._ts)
      .slice(0, 5)
      .map((test) => ({
        tokenNo: test.token_no,
        name: test.name || 'Unknown',
        date: test.date,
        time: test.time,
        goldFineness: test.gold_fineness,
        karat: test.karat,
        category: test._category,
      }));
  }, [skinTests]);

  return {
    loading,
    error,
    selectedPeriod,
    setSelectedPeriod,
    lastUpdated,
    kpis,
    finance,
    trend,
    purity,
    recentSamples,
    latestResults,
    tokens,
    expenses,
    exchanges,
    refresh: fetchData,
  };
}

export { useDashboardOverview };
export default useDashboardOverview;
