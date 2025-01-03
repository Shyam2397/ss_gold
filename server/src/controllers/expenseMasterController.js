const db = require('../config/database');

// Create a new expense type
const createExpenseType = (req, res) => {
  const { expenseName } = req.body;

  if (!expenseName) {
    return res.status(400).json({ error: 'Expense name is required' });
  }

  const sql = 'INSERT INTO expense_master (expense_name) VALUES (?)';
  
  db.run(sql, [expenseName], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Expense type already exists' });
      }
      console.error('Error creating expense type:', err);
      return res.status(500).json({ error: 'Failed to create expense type' });
    }
    
    res.status(201).json({
      id: this.lastID,
      expenseName,
      message: 'Expense type created successfully'
    });
  });
};

// Get all expense types
const getAllExpenseTypes = (req, res) => {
  const sql = 'SELECT * FROM expense_master ORDER BY expense_name ASC';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Error fetching expense types:', err);
      return res.status(500).json({ error: 'Failed to fetch expense types' });
    }
    
    res.json(rows);
  });
};

// Update an expense type
const updateExpenseType = (req, res) => {
  const { id } = req.params;
  const { expenseName } = req.body;

  if (!expenseName) {
    return res.status(400).json({ error: 'Expense name is required' });
  }

  const sql = `
    UPDATE expense_master 
    SET expense_name = ?, 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;
  
  db.run(sql, [expenseName, id], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ error: 'Expense type already exists' });
      }
      console.error('Error updating expense type:', err);
      return res.status(500).json({ error: 'Failed to update expense type' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense type not found' });
    }
    
    res.json({ 
      id: parseInt(id), 
      expenseName,
      message: 'Expense type updated successfully' 
    });
  });
};

// Delete an expense type
const deleteExpenseType = (req, res) => {
  const { id } = req.params;
  
  const sql = 'DELETE FROM expense_master WHERE id = ?';
  
  db.run(sql, [id], function(err) {
    if (err) {
      console.error('Error deleting expense type:', err);
      return res.status(500).json({ error: 'Failed to delete expense type' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Expense type not found' });
    }
    
    res.json({ message: 'Expense type deleted successfully' });
  });
};

module.exports = {
  createExpenseType,
  getAllExpenseTypes,
  updateExpenseType,
  deleteExpenseType
};
