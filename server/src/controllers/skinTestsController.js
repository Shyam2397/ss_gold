const db = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { resetSkinTestsTable } = require('../models/tables');

const getAllSkinTests = (req, res) => {
  db.all("SELECT * FROM skin_tests ORDER BY tokenNo DESC", [], (err, rows) => {
    if (err) return handleDatabaseError(err, res);
    
    const processedRows = rows.map(row => {
      return new Promise((resolve, reject) => {
        db.get("SELECT phoneNumber FROM entries WHERE code = ?", [row.code], (err, entryRow) => {
          if (err) {
            resolve({ ...row, phoneNumber: null });
          } else {
            resolve({ 
              ...row, 
              phoneNumber: entryRow ? entryRow.phoneNumber : null 
            });
          }
        });
      });
    });

    Promise.all(processedRows)
      .then(finalRows => {
        res.json({ data: finalRows });
      })
      .catch(error => {
        return res.status(500).json({ error: 'Failed to process skin tests' });
      });
  });
};

const createSkinTest = (req, res) => {
  const data = req.body;
  
  db.get("SELECT tokenNo FROM skin_tests WHERE tokenNo = ?", [data.tokenNo], (err, row) => {
    if (err) return handleDatabaseError(err, res);
    if (row) return res.status(400).json({ error: "Token number already exists" });

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

    const sql = `INSERT INTO skin_tests (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    const params = columns.map(col => processedData[col]);

    db.run(sql, params, function (err) {
      if (err) return handleDatabaseError(err, res);
      res.json({ message: "Success", data: processedData, id: this.lastID });
    });
  });
};

const updateSkinTest = (req, res) => {
  const data = req.body;
  const columns = [
    'date', 'time', 'name', 'weight', 'sample', 'highest',
    'average', 'gold_fineness', 'karat', 'silver', 'copper',
    'zinc', 'cadmium', 'nickel', 'tungsten', 'iridium',
    'ruthenium', 'osmium', 'rhodium', 'rhenium', 'indium',
    'titanium', 'palladium', 'platinum', 'others', 'remarks', 'code'
  ];

  const sql = `UPDATE skin_tests SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE tokenNo = ?`;
  const params = [...columns.map(col => data[col]), req.params.tokenNo];

  db.run(sql, params, function (err) {
    if (err) return handleDatabaseError(err, res);
    res.json({ message: "Success", data: data, changes: this.changes });
  });
};

const deleteSkinTest = (req, res) => {
  db.run("DELETE FROM skin_tests WHERE tokenNo = ?", req.params.tokenNo, function (err) {
    if (err) return handleDatabaseError(err, res);
    res.json({ message: "Deleted", changes: this.changes });
  });
};

const getPhoneNumberByCode = (req, res) => {
  const { code } = req.params;
  
  db.get(
    "SELECT phoneNumber FROM entries WHERE code = ?",
    [code],
    (err, row) => {
      if (err) {
        return handleDatabaseError(err, res, "Failed to retrieve phone number");
      }
      
      if (!row) {
        return res.status(404).json({ error: "No phone number found for the provided code" });
      }
      
      res.status(200).json({ phoneNumber: row.phoneNumber });
    }
  );
};

const resetSkinTests = async (req, res) => {
  try {
    await resetSkinTestsTable();
    res.json({ message: "Table reset successfully" });
  } catch (err) {
    handleDatabaseError(err, res, "Failed to reset table");
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
