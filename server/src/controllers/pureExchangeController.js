const { pool } = require('../config/database');

const getAllPureExchanges = async (req, res) => {
  const sql = 'SELECT * FROM pure_exchange';
  try {
    const result = await pool.query(sql);
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createPureExchange = async (req, res) => {
  const {
    tokenNo,
    date,
    time,
    weight,
    highest,
    hWeight,
    average,
    aWeight,
    goldFineness,
    gWeight,
    exGold,
    exWeight
  } = req.body;

  const sql = `
    INSERT INTO pure_exchange (
      tokenNo, date, time, weight, highest, hWeight,
      average, aWeight, goldFineness, gWeight, exGold, exWeight
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `;

  const params = [
    tokenNo, date, time, weight, highest, hWeight,
    average, aWeight, goldFineness, gWeight, exGold, exWeight
  ];

  try {
    const result = await pool.query(sql, params);
    res.json({
      message: 'Pure exchange entry created successfully',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updatePureExchange = async (req, res) => {
  const tokenNo = req.params.tokenNo;
  const {
    date,
    time,
    weight,
    highest,
    hWeight,
    average,
    aWeight,
    goldFineness,
    gWeight,
    exGold,
    exWeight
  } = req.body;

  const sql = `
    UPDATE pure_exchange SET
      date = $1,
      time = $2,
      weight = $3,
      highest = $4,
      hWeight = $5,
      average = $6,
      aWeight = $7,
      goldFineness = $8,
      gWeight = $9,
      exGold = $10,
      exWeight = $11
    WHERE tokenNo = $12
    RETURNING *
  `;

  const params = [
    date, time, weight, highest, hWeight,
    average, aWeight, goldFineness, gWeight,
    exGold, exWeight, tokenNo
  ];

  try {
    const result = await pool.query(sql, params);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pure exchange entry not found' });
    }
    res.json({
      message: 'Pure exchange entry updated successfully',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deletePureExchange = async (req, res) => {
  const tokenNo = req.params.tokenNo;
  const sql = 'DELETE FROM pure_exchange WHERE tokenNo = $1 RETURNING *';
  
  try {
    const result = await pool.query(sql, [tokenNo]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pure exchange entry not found' });
    }
    res.json({
      message: 'Pure exchange entry deleted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllPureExchanges,
  createPureExchange,
  updatePureExchange,
  deletePureExchange
};
