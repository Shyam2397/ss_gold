const { pool } = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');

// Add payment status column if it doesn't exist
const initializeTable = async () => {
  try {
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 
          FROM information_schema.columns 
          WHERE table_name = 'tokens' 
          AND column_name = 'ispaid'
        ) THEN 
          ALTER TABLE tokens ADD COLUMN isPaid INTEGER DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('Tokens table initialized successfully');
  } catch (err) {
    console.error('Error initializing tokens table:', err);
    throw err;
  }
};

// Initialize table but don't block module loading
(async () => {
  try {
    await initializeTable();
  } catch (err) {
    console.error('Failed to initialize tokens table:', err);
    // Don't throw here, let the application continue
  }
})();

const getAllTokens = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        "tokenNo",
        date,
        time,
        code,
        name,
        test,
        weight,
        sample,
        amount,
        "isPaid"
      FROM tokens 
      ORDER BY id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const getTokenByNumber = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tokens WHERE tokenNo = $1",
      [req.params.tokenNo]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const createToken = async (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tokens ("tokenNo", date, time, code, name, test, weight, sample, amount, "isPaid") 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0) 
       RETURNING id, "tokenNo", date, time, code, name, test, weight, sample, amount, "isPaid"`,
      [tokenNo, date, time, code, name, test, weight, sample, amount]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const updateToken = async (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tokens 
       SET "tokenNo" = $1, date = $2, time = $3, code = $4, name = $5, 
           test = $6, weight = $7, sample = $8, amount = $9 
       WHERE id = $10 
       RETURNING id, "tokenNo", date, time, code, name, test, weight, sample, amount, "isPaid"`,
      [tokenNo, date, time, code, name, test, weight, sample, amount, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Token not found" });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const updatePaymentStatus = async (req, res) => {
  const { isPaid } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tokens SET isPaid = $1 WHERE id = $2 RETURNING *",
      [isPaid ? 1 : 0, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Token not found" });
    }
    res.status(200).json({ updatedID: result.rowCount, token: result.rows[0] });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const deleteToken = async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM tokens WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Token not found" });
    }
    res.status(200).json({ deletedID: result.rowCount, token: result.rows[0] });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const generateTokenNumber = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT "tokenNo" FROM tokens ORDER BY id DESC LIMIT 1'
    );

    let nextTokenNo;
    if (!result.rows[0] || !result.rows[0].tokenNo) {
      nextTokenNo = "A1";
    } else {
      const currentToken = result.rows[0].tokenNo.toString();
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
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

module.exports = {
  getAllTokens,
  getTokenByNumber,
  createToken,
  updateToken,
  updatePaymentStatus,
  deleteToken,
  generateTokenNumber
};
