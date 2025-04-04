const { pool } = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { resetSkinTestsTable } = require('../models/tables');

const getAllSkinTests = async (req, res) => {
  try {
    const query = `
      SELECT token_no, date, time, name, weight, sample, 
             highest, average, gold_fineness, karat,
             silver, copper, zinc, cadmium, nickel, 
             tungsten, iridium, ruthenium, osmium, rhodium,
             rhenium, indium, titanium, palladium, platinum,
             others, remarks, code
      FROM skin_tests
      ORDER BY date DESC, time DESC`;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Detailed error in getAllSkinTests:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createSkinTest = async (req, res) => {
  const data = req.body;
  
  try {
    const tokenNo = data.tokenNo || data.token_no;
    if (!tokenNo) {
      return res.status(400).json({ 
        error: "Missing required fields",
        detail: "tokenNo is required for creating new skin tests"
      });
    }

    // Normalize numeric fields
    const numericFields = [
      'weight', 'highest', 'average', 'gold_fineness', 'karat',
      'silver', 'copper', 'zinc', 'cadmium', 'nickel', 'tungsten',
      'iridium', 'ruthenium', 'osmium', 'rhodium', 'rhenium',
      'indium', 'titanium', 'palladium', 'platinum', 'others'
    ];

    const processedData = {
      token_no: tokenNo,
      date: data.date, // Store date as-is from client
      time: data.time || null,
      name: data.name || '',
      sample: data.sample || '',
      remarks: data.remarks || '',
      code: data.code || ''
    };

    if (!processedData.date || !processedData.time) {
      return res.status(400).json({
        error: "Missing required fields",
        detail: "date and time are required"
      });
    }

    // Process numeric fields
    numericFields.forEach(field => {
      const value = data[field];
      processedData[field] = value === '' || value === null || value === undefined ? 
        0 : 
        parseFloat(value) || 0;
    });

    // Check token existence
    const tokenCheck = await pool.query(
      "SELECT token_no FROM skin_tests WHERE token_no = $1",
      [processedData.token_no]
    );
    
    if (tokenCheck.rows.length > 0) {
      return res.status(400).json({ error: "Token number already exists" });
    }

    const columns = Object.keys(processedData);
    const values = Object.values(processedData);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `
      INSERT INTO skin_tests (${columns.join(', ')}) 
      VALUES (${placeholders}) 
      RETURNING 
        token_no,
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        time,
        name,
        weight,
        sample,
        highest,
        average,
        gold_fineness,
        karat,
        silver,
        copper,
        zinc,
        cadmium,
        nickel,
        tungsten,
        iridium,
        ruthenium,
        osmium,
        rhodium,
        rhenium,
        indium,
        titanium,
        palladium,
        platinum,
        others,
        remarks,
        code
    `;

    const result = await pool.query(sql, values);
    res.status(201).json({ 
      message: "Success", 
      data: {
        ...result.rows[0],
        date: result.rows[0].date // Use formatted date from TO_CHAR
      }
    });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const updateSkinTest = async (req, res) => {
  const data = req.body;
  const { tokenNo } = req.params;

  if (!tokenNo) {
    return res.status(400).json({ error: "Token number is required in URL" });
  }

  const columns = [
    'date', 'time', 'name', 'weight', 'sample', 'highest',
    'average', 'gold_fineness', 'karat', 'silver', 'copper',
    'zinc', 'cadmium', 'nickel', 'tungsten', 'iridium',
    'ruthenium', 'osmium', 'rhodium', 'rhenium', 'indium',
    'titanium', 'palladium', 'platinum', 'others', 'remarks', 'code'
  ];

  try {
    // First check if the record exists
    const checkResult = await pool.query(
      'SELECT token_no FROM skin_tests WHERE token_no = $1',
      [tokenNo]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: "Skin test not found" });
    }

    const sql = `
      UPDATE skin_tests 
      SET ${columns.map((col, i) => 
        col === 'date' ? `date = $${i + 1}::date` : `${col} = $${i + 1}`
      ).join(', ')} 
      WHERE token_no = $${columns.length + 1}
      RETURNING 
        token_no,
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        time,
        name,
        weight,
        sample,
        highest,
        average,
        gold_fineness,
        karat,
        silver,
        copper,
        zinc,
        cadmium,
        nickel,
        tungsten,
        iridium,
        ruthenium,
        osmium,
        rhodium,
        rhenium,
        indium,
        titanium,
        palladium,
        platinum,
        others,
        remarks,
        code
    `;
    const params = [...columns.map(col => data[col] || null), tokenNo];

    const result = await pool.query(sql, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Failed to update skin test" });
    }

    res.json({ message: "Success", data: result.rows[0] });
  } catch (err) {
    if (err.code === '22P02') {
      return res.status(400).json({ 
        error: "Invalid data format",
        detail: "One or more fields contain invalid data types"
      });
    }
    
    return handleDatabaseError(err, res, "Failed to update skin test");
  }
};

const deleteSkinTest = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM skin_tests WHERE token_no = $1 RETURNING *",
      [req.params.tokenNo]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Skin test not found" });
    }
    res.json({ message: "Deleted", data: result.rows[0] });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const getPhoneNumberByCode = async (req, res) => {
  const { code } = req.params;
  
  try {
    const result = await pool.query(
      "SELECT phoneNumber FROM entries WHERE code = $1",
      [code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Code not found" });
    }
    
    res.json({ phoneNumber: result.rows[0].phoneNumber });
  } catch (err) {
    return handleDatabaseError(err, res, "Failed to retrieve phone number");
  }
};

const resetSkinTests = async (req, res) => {
  try {
    await resetSkinTestsTable();
    res.json({ message: "Skin tests table has been reset" });
  } catch (err) {
    return handleDatabaseError(err, res, "Failed to reset skin tests table");
  }
};

module.exports = {
  getAllSkinTests,
  createSkinTest,
  updateSkinTest,
  deleteSkinTest,
  getPhoneNumberByCode,
  resetSkinTests
};
