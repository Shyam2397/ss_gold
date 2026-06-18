const { pool } = require('../config/database');

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

module.exports = {
  getOpeningBalance
};
