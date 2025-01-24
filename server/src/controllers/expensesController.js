const pool = require('../config/database');

// Create a new expense
const createExpense = async (req, res) => {
  const { date, expense_type, amount, paid_to, pay_mode, remarks } = req.body;

  const sql = `
    INSERT INTO expenses (date, expense_type, amount, paid_to, pay_mode, remarks)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [date, expense_type, amount, paid_to, pay_mode, remarks]);
    res.status(201).json({ id: result.rows[0].id, data: result.rows[0] });
  } catch (err) {
    console.error('Error creating expense:', err);
    return res.status(500).json({ error: 'Failed to create expense' });
  }
};

// Get all expenses
const getAllExpenses = async (req, res) => {
  const sql = `
    SELECT id, date, expense_type, amount, paid_to, pay_mode, remarks, created_at
    FROM expenses
    ORDER BY date DESC
  `;

  try {
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

// Get expense by ID
const getExpenseById = async (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT id, date, expense_type, amount, paid_to, pay_mode, remarks, created_at
    FROM expenses
    WHERE id = $1
  `;

  try {
    const result = await pool.query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching expense:', err);
    return res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

// Update an expense
const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { date, expense_type, amount, paid_to, pay_mode, remarks } = req.body;

  const sql = `
    UPDATE expenses 
    SET date = $1, 
        expense_type = $2, 
        amount = $3, 
        paid_to = $4, 
        pay_mode = $5, 
        remarks = $6
    WHERE id = $7
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [
      date, 
      expense_type, 
      amount, 
      paid_to, 
      pay_mode, 
      remarks, 
      id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating expense:', err);
    return res.status(500).json({ error: 'Failed to update expense' });
  }
};

// Delete an expense
const deleteExpense = async (req, res) => {
  const { id } = req.params;

  const sql = `
    DELETE FROM expenses 
    WHERE id = $1
    RETURNING *
  `;

  try {
    const result = await pool.query(sql, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting expense:', err);
    return res.status(500).json({ error: 'Failed to delete expense' });
  }
};

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};
