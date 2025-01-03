const db = require('../config/database');

// Create a new expense
const createExpense = (req, res) => {
  const { date, expense_type, amount, paid_to, pay_mode, remarks } = req.body;

  const sql = `
    INSERT INTO expenses (date, expense_type, amount, paid_to, pay_mode, remarks)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [date, expense_type, amount, paid_to, pay_mode, remarks], function(err) {
    if (err) {
      console.error('Error creating expense:', err);
      return res.status(500).json({ error: 'Failed to create expense' });
    }
    res.status(201).json({ id: this.lastID });
  });
};

// Get all expenses
const getAllExpenses = (req, res) => {
  const sql = `
    SELECT id, date, expense_type, amount, paid_to, pay_mode, remarks, created_at
    FROM expenses
    ORDER BY date DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching expenses:', err);
      return res.status(500).json({ error: 'Failed to fetch expenses' });
    }
    res.json(rows);
  });
};

// Get expense by ID
const getExpenseById = (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT id, date, expense_type, amount, paid_to, pay_mode, remarks, created_at
    FROM expenses
    WHERE id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      console.error('Error fetching expense:', err);
      return res.status(500).json({ error: 'Failed to fetch expense' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(row);
  });
};

// Update an expense
const updateExpense = (req, res) => {
  const { id } = req.params;
  const { date, expense_type, amount, paid_to, pay_mode, remarks } = req.body;

  const sql = `
    UPDATE expenses
    SET date = ?, expense_type = ?, amount = ?, paid_to = ?, pay_mode = ?, remarks = ?
    WHERE id = ?
  `;

  db.run(sql, [date, expense_type, amount, paid_to, pay_mode, remarks, id], function(err) {
    if (err) {
      console.error('Error updating expense:', err);
      return res.status(500).json({ error: 'Failed to update expense' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense updated successfully' });
  });
};

// Delete an expense
const deleteExpense = (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM expenses WHERE id = ?';

  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting expense:', err);
      return res.status(500).json({ error: 'Failed to delete expense' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  });
};

module.exports = {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};
