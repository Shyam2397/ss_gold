const db = require('../config/database');

const getAllPureExchanges = (req, res) => {
  const sql = 'SELECT * FROM pure_exchange';
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
};

const createPureExchange = (req, res) => {
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    tokenNo, date, time, weight, highest, hWeight,
    average, aWeight, goldFineness, gWeight, exGold, exWeight
  ];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({
      message: 'Pure exchange entry created successfully',
      data: { id: this.lastID }
    });
  });
};

const updatePureExchange = (req, res) => {
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
      date = ?,
      time = ?,
      weight = ?,
      highest = ?,
      hWeight = ?,
      average = ?,
      aWeight = ?,
      goldFineness = ?,
      gWeight = ?,
      exGold = ?,
      exWeight = ?
    WHERE tokenNo = ?
  `;

  const params = [
    date, time, weight, highest, hWeight,
    average, aWeight, goldFineness, gWeight,
    exGold, exWeight, tokenNo
  ];

  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Pure exchange entry not found' });
      return;
    }
    res.json({
      message: 'Pure exchange entry updated successfully',
      changes: this.changes
    });
  });
};

const deletePureExchange = (req, res) => {
  const tokenNo = req.params.tokenNo;
  const sql = 'DELETE FROM pure_exchange WHERE tokenNo = ?';
  
  db.run(sql, tokenNo, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Pure exchange entry not found' });
      return;
    }
    res.json({
      message: 'Pure exchange entry deleted successfully',
      changes: this.changes
    });
  });
};

module.exports = {
  getAllPureExchanges,
  createPureExchange,
  updatePureExchange,
  deletePureExchange
};
