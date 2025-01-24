const pool = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { resetSkinTestsTable } = require('../models/tables');

const getAllSkinTests = async (req, res) => {
  try {
    const skinTestsResult = await pool.query(
      "SELECT * FROM skin_tests ORDER BY tokenNo DESC"
    );
    
    const processedRows = await Promise.all(
      skinTestsResult.rows.map(async (row) => {
        try {
          const entryResult = await pool.query(
            "SELECT phoneNumber FROM entries WHERE code = $1",
            [row.code]
          );
          return {
            ...row,
            phoneNumber: entryResult.rows[0]?.phoneNumber || null
          };
        } catch (err) {
          return { ...row, phoneNumber: null };
        }
      })
    );

    res.json({ data: processedRows });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process skin tests' });
  }
};

const createSkinTest = async (req, res) => {
  const data = req.body;
  
  try {
    const tokenCheck = await pool.query(
      "SELECT tokenNo FROM skin_tests WHERE tokenNo = $1",
      [data.tokenNo]
    );
    
    if (tokenCheck.rows.length > 0) {
      return res.status(400).json({ error: "Token number already exists" });
    }

    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = String(value || (key === 'weight' || key.includes('_') ? '0' : ''));
      return acc;
    }, {});

    const columns = [
      'tokenNo', 'date', 'time', 'name', 'weight', 'sample',
      'highest', 'average', 'gold_fineness', 'karat', 'silver',
      'copper', 'zinc', 'cadmium', 'nickel', 'tungsten',
      'iridium', 'ruthenium', 'osmium', 'rhodium', 'rhenium',
      'indium', 'titanium', 'palladium', 'platinum',
      'others', 'remarks', 'code'
    ];

    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO skin_tests (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    const params = columns.map(col => processedData[col]);

    const result = await pool.query(sql, params);
    res.json({ message: "Success", data: result.rows[0] });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const updateSkinTest = async (req, res) => {
  const data = req.body;
  const columns = [
    'date', 'time', 'name', 'weight', 'sample', 'highest',
    'average', 'gold_fineness', 'karat', 'silver', 'copper',
    'zinc', 'cadmium', 'nickel', 'tungsten', 'iridium',
    'ruthenium', 'osmium', 'rhodium', 'rhenium', 'indium',
    'titanium', 'palladium', 'platinum', 'others', 'remarks', 'code'
  ];

  try {
    const sql = `
      UPDATE skin_tests 
      SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(', ')} 
      WHERE tokenNo = $${columns.length + 1}
      RETURNING *
    `;
    const params = [...columns.map(col => data[col]), req.params.tokenNo];

    const result = await pool.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Skin test not found" });
    }
    res.json({ message: "Success", data: result.rows[0] });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const deleteSkinTest = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM skin_tests WHERE tokenNo = $1 RETURNING *",
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
