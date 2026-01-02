const { pool } = require('../config/database');

// Create a new cash adjustment
const createCashAdjustment = async (req, res) => {
  const {
    date,
    time,
    amount,
    adjustment_type,
    reason,
    reference_number,
    entered_by,
    remarks
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO cash_adjustments 
       (date, time, amount, adjustment_type, reason, reference_number, entered_by, remarks)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [date, time, amount, adjustment_type, reason, reference_number, entered_by, remarks]
    );
    
    res.status(201).json({
      success: true,
      message: 'Cash adjustment created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating cash adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating cash adjustment',
      error: error.message
    });
  }
};

// Get all cash adjustments with optional date range filtering and limit
const getCashAdjustments = async (req, res) => {
  const { from_date, to_date, limit, type } = req.query;
  
  try {
    let query = 'SELECT * FROM cash_adjustments';
    const queryParams = [];
    let paramCount = 0;
    
    // Add date range filter if provided
    if (from_date && to_date) {
      paramCount += 2;
      query += ` WHERE date BETWEEN $${paramCount - 1} AND $${paramCount}`;
      queryParams.push(from_date, to_date);
    } else if (from_date) {
      paramCount += 1;
      query += ` WHERE date >= $${paramCount}`;
      queryParams.push(from_date);
    } else if (to_date) {
      paramCount += 1;
      query += ` WHERE date <= $${paramCount}`;
      queryParams.push(to_date);
    }
    
    // Add type filter if provided
    if (type) {
      if (paramCount > 0) {
        // Already have a WHERE clause, so use AND
        paramCount += 1;
        query += ` AND adjustment_type = $${paramCount}`;
      } else {
        // No WHERE clause yet, so add it
        paramCount += 1;
        query += ` WHERE adjustment_type = $${paramCount}`;
      }
      queryParams.push(type);
    }
    
    // Always order by most recent first
    query += ' ORDER BY date DESC, time DESC';
    
    // Add limit if provided
    if (limit && !isNaN(parseInt(limit))) {
      paramCount += 1;
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
    }
    
    const result = await pool.query(query, queryParams);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching cash adjustments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cash adjustments',
      error: error.message
    });
  }
};

// Get a single cash adjustment by ID
const getCashAdjustmentById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM cash_adjustments WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cash adjustment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching cash adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching cash adjustment',
      error: error.message
    });
  }
};

// Update a cash adjustment
const updateCashAdjustment = async (req, res) => {
  const { id } = req.params;
  const {
    date,
    time,
    amount,
    adjustment_type,
    reason,
    reference_number,
    entered_by,
    remarks
  } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE cash_adjustments 
       SET date = $1, 
           time = $2, 
           amount = $3, 
           adjustment_type = $4, 
           reason = $5, 
           reference_number = $6, 
           entered_by = $7, 
           remarks = $8,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [date, time, amount, adjustment_type, reason, reference_number, entered_by, remarks, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cash adjustment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cash adjustment updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating cash adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cash adjustment',
      error: error.message
    });
  }
};

// Delete a cash adjustment
const deleteCashAdjustment = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM cash_adjustments WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cash adjustment not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Cash adjustment deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error deleting cash adjustment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting cash adjustment',
      error: error.message
    });
  }
};

// Get cash adjustment summary by date range
const getCashAdjustmentSummary = async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Both startDate and endDate are required'
    });
  }
  
  try {
    const query = `
      SELECT 
        adjustment_type,
        COUNT(*) as count,
        SUM(amount) as total_amount
      FROM cash_adjustments
      WHERE date BETWEEN $1 AND $2
      GROUP BY adjustment_type
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    
    // Calculate net adjustment
    let additions = 0;
    let deductions = 0;
    
    result.rows.forEach(row => {
      if (row.adjustment_type === 'addition') {
        additions += parseFloat(row.total_amount);
      } else if (row.adjustment_type === 'deduction') {
        deductions += parseFloat(row.total_amount);
      }
    });
    
    const netAdjustment = additions - deductions;
    
    res.status(200).json({
      success: true,
      data: {
        summary: result.rows,
        additions,
        deductions,
        net_adjustment: netAdjustment.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error generating cash adjustment summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating cash adjustment summary',
      error: error.message
    });
  }
};

module.exports = {
  createCashAdjustment,
  getCashAdjustments,
  getCashAdjustmentById,
  updateCashAdjustment,
  deleteCashAdjustment,
  getCashAdjustmentSummary
};
