const { pool } = require('../config/database');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * GET /api/cashbook/opening-balance?before_date=YYYY-MM-DD
 * 
 * Computes the opening balance for the cashbook as of a given date.
 * 
 * Formula:
 *   Opening Balance = previousPaidIncome - previousExpenses + previousAdjustmentsNet
 * 
 * Where:
 *   - previousPaidIncome: SUM of paid token amounts before the date
 *   - previousExpenses: SUM of all expense amounts before the date
 *   - previousAdjustmentsNet: SUM(additions) - SUM(deductions) from cash_adjustments before the date
 * 
 * Pending (unpaid tokens) is tracked separately as informational only.
 * Also returns previousPendingTokenIds for reference.
 */
const getOpeningBalance = async (req, res) => {
  const { before_date } = req.query;

  if (!before_date) {
    return res.status(400).json({
      success: false,
      message: 'before_date parameter is required (YYYY-MM-DD)'
    });
  }

  try {
    // Run all 4 queries in parallel
    const [paidIncomeResult, expensesResult, adjustmentsResult, pendingResult] = await Promise.all([
      // 1. Previous paid income (tokens with is_paid = 1 before current month)
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM tokens
         WHERE date < $1 AND is_paid = 1`,
        [before_date]
      ),
      // 2. Previous expenses (all expenses before current month)
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) as total
         FROM expenses
         WHERE date < $1`,
        [before_date]
      ),
      // 3. Previous cash adjustments net (additions - deductions before current month)
      pool.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN adjustment_type = 'addition' THEN amount ELSE 0 END), 0) as additions,
           COALESCE(SUM(CASE WHEN adjustment_type = 'deduction' THEN amount ELSE 0 END), 0) as deductions
         FROM cash_adjustments
         WHERE date < $1`,
        [before_date]
      ),
      // 4. Previous pending (unpaid tokens before current month) - need IDs too
      pool.query(
        `SELECT id, amount
         FROM tokens
         WHERE date < $1 AND is_paid = 0`,
        [before_date]
      )
    ]);

    const previousPaidIncome = parseFloat(paidIncomeResult.rows[0].total) || 0;
    const previousExpenses = parseFloat(expensesResult.rows[0].total) || 0;
    const previousAdditions = parseFloat(adjustmentsResult.rows[0].additions) || 0;
    const previousDeductions = parseFloat(adjustmentsResult.rows[0].deductions) || 0;
    const previousAdjustmentsNet = previousAdditions - previousDeductions;
    
    const previousPendingTokens = pendingResult.rows;
    const previousPending = previousPendingTokens.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
    const previousPendingTokenIds = previousPendingTokens.map(t => `token-${t.id}`);

    // Opening Balance = paidIncome - expenses + adjustmentsNet
    // Pending is informational only - does not affect the balance
    const openingBalance = previousPaidIncome - previousExpenses + previousAdjustmentsNet;

    res.json({
      success: true,
      data: {
        openingBalance,
        openingPending: previousPending,
        previousPendingTokenIds,
        breakdown: {
          previousPaidIncome,
          previousExpenses,
          previousAdditions,
          previousDeductions,
          previousAdjustmentsNet,
          previousPending
        }
      }
    });
  } catch (error) {
    console.error('Error calculating opening balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating opening balance',
      error: error.message
    });
  }
};

/**
 * GET /api/cashbook/monthly-summary
 * 
 * Returns aggregated monthly data (income, expense, pending) for the last 4 months
 * including the current month. Uses server-side date calculations to avoid timezone issues.
 */
const getMonthlySummary = async (req, res) => {
  try {
    // Calculate the start date: 1st day of 3 months ago (covers current + 3 previous = 4 months)
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const startDate = `${startMonth.getFullYear()}-${String(startMonth.getMonth() + 1).padStart(2, '0')}-01`;

    // Run 3 queries in parallel
    const [incomeResult, expenseResult, pendingResult] = await Promise.all([
      // Monthly income: paid tokens + cash adjustment additions
      pool.query(
        `SELECT 
           EXTRACT(YEAR FROM date)::int AS year,
           EXTRACT(MONTH FROM date)::int AS month,
           SUM(amount) as total
         FROM tokens
         WHERE date >= $1 AND is_paid = 1
         GROUP BY year, month
         UNION ALL
         SELECT 
           EXTRACT(YEAR FROM date)::int AS year,
           EXTRACT(MONTH FROM date)::int AS month,
           SUM(amount) as total
         FROM cash_adjustments
         WHERE date >= $1 AND adjustment_type = 'addition'
         GROUP BY year, month`,
        [startDate]
      ),
      // Monthly expenses: all expenses + cash adjustment deductions
      pool.query(
        `SELECT 
           EXTRACT(YEAR FROM date)::int AS year,
           EXTRACT(MONTH FROM date)::int AS month,
           SUM(amount) as total
         FROM expenses
         WHERE date >= $1
         GROUP BY year, month
         UNION ALL
         SELECT 
           EXTRACT(YEAR FROM date)::int AS year,
           EXTRACT(MONTH FROM date)::int AS month,
           SUM(amount) as total
         FROM cash_adjustments
         WHERE date >= $1 AND adjustment_type = 'deduction'
         GROUP BY year, month`,
        [startDate]
      ),
      // Monthly pending: unpaid tokens
      pool.query(
        `SELECT 
           EXTRACT(YEAR FROM date)::int AS year,
           EXTRACT(MONTH FROM date)::int AS month,
           SUM(amount) as total
         FROM tokens
         WHERE date >= $1 AND is_paid = 0
         GROUP BY year, month`,
        [startDate]
      )
    ]);

    // Merge results into a single map keyed by "YYYY-M"
    const monthlyMap = new Map();

    const ensureMonth = (year, month) => {
      const key = `${year}-${month}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: `${MONTH_NAMES[month - 1]} ${year}`,
          timestamp: new Date(year, month - 1, 1).getTime(),
          income: 0,
          expense: 0,
          pending: 0
        });
      }
      return monthlyMap.get(key);
    };

    incomeResult.rows.forEach(row => {
      const data = ensureMonth(row.year, row.month);
      data.income += parseFloat(row.total) || 0;
    });

    expenseResult.rows.forEach(row => {
      const data = ensureMonth(row.year, row.month);
      data.expense += parseFloat(row.total) || 0;
    });

    pendingResult.rows.forEach(row => {
      const data = ensureMonth(row.year, row.month);
      data.pending += parseFloat(row.total) || 0;
    });

    // Sort by timestamp descending (most recent first)
    const monthlyData = Array.from(monthlyMap.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error('Error fetching monthly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching monthly summary',
      error: error.message
    });
  }
};

module.exports = {
  getOpeningBalance,
  getMonthlySummary
};
