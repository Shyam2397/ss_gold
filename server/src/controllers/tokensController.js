const db = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');

// Add payment status column if it doesn't exist
db.run(`
  ALTER TABLE tokens 
  ADD COLUMN isPaid INTEGER DEFAULT 0
`, (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding isPaid column:', err);
  }
});

const getAllTokens = (req, res) => {
  db.all("SELECT * FROM tokens ORDER BY id DESC", [], (err, rows) => {
    if (err) return handleDatabaseError(err, res);
    res.json(rows);
  });
};

const getTokenByNumber = (req, res) => {
  db.get(
    "SELECT * FROM tokens WHERE tokenNo = ?",
    req.params.tokenNo,
    (err, row) => {
      if (err) return handleDatabaseError(err, res);
      res.json({ data: row });
    }
  );
};

const createToken = (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  db.run(
    "INSERT INTO tokens (tokenNo, date, time, code, name, test, weight, sample, amount, isPaid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
    [tokenNo, date, time, code, name, test, weight, sample, amount],
    function (err) {
      if (err) return handleDatabaseError(err, res);
      res.status(201).json({ id: this.lastID });
    }
  );
};

const updateToken = (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  db.run(
    "UPDATE tokens SET tokenNo = ?, date = ?, time = ?, code = ?, name = ?, test = ?, weight = ?, sample = ?, amount = ? WHERE id = ?",
    [tokenNo, date, time, code, name, test, weight, sample, amount, req.params.id],
    function (err) {
      if (err) return handleDatabaseError(err, res);
      res.status(200).json({ updatedID: this.changes });
    }
  );
};

const updatePaymentStatus = (req, res) => {
  const { isPaid } = req.body;
  db.run(
    "UPDATE tokens SET isPaid = ? WHERE id = ?",
    [isPaid ? 1 : 0, req.params.id],
    function (err) {
      if (err) return handleDatabaseError(err, res);
      res.status(200).json({ updatedID: this.changes });
    }
  );
};

const deleteToken = (req, res) => {
  db.run("DELETE FROM tokens WHERE id = ?", [req.params.id], function (err) {
    if (err) return handleDatabaseError(err, res);
    res.status(200).json({ deletedID: this.changes });
  });
};

const generateTokenNumber = (req, res) => {
  db.get("SELECT tokenNo FROM tokens ORDER BY id DESC LIMIT 1", [], (err, row) => {
    if (err) return handleDatabaseError(err, res);

    let nextTokenNo;
    if (!row || !row.tokenNo) {
      nextTokenNo = "A1";
    } else {
      const currentToken = row.tokenNo.toString();
      if (currentToken.match(/^[A-Z]/)) {
        const letter = currentToken[0];
        const number = parseInt(currentToken.slice(1));
        nextTokenNo = number >= 999 ? 
          `${String.fromCharCode(letter.charCodeAt(0) + 1)}1` : 
          `${letter}${number + 1}`;
      } else {
        nextTokenNo = (parseInt(currentToken) || 0) + 1;
      }
    }
    res.json({ tokenNo: nextTokenNo });
  });
};

module.exports = {
  getAllTokens,
  getTokenByNumber,
  createToken,
  updateToken,
  deleteToken,
  generateTokenNumber,
  updatePaymentStatus
};
