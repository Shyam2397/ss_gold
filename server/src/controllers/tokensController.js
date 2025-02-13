const { pool } = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');

// Add payment status column if it doesn't exist
const initializeTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        token_no VARCHAR(50) UNIQUE NOT NULL,
        date DATE,
        time TIME,
        code VARCHAR(50),
        name VARCHAR(100),
        test VARCHAR(100),
        weight DECIMAL(10, 2),
        sample VARCHAR(100),
        amount DECIMAL(10, 2),
        is_paid INTEGER DEFAULT 0
      );
    `);
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
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT 
        id,
        token_no,
        date,
        time,
        code,
        name,
        test,
        weight,
        sample,
        amount,
        is_paid
      FROM tokens 
      ORDER BY id DESC
    `);
    // Transform to camelCase for frontend
    const transformedRows = result.rows.map(row => ({
      id: row.id,
      tokenNo: row.token_no,
      date: row.date,
      time: row.time,
      code: row.code,
      name: row.name,
      test: row.test,
      weight: row.weight,
      sample: row.sample,
      amount: row.amount,
      isPaid: row.is_paid
    }));
    res.json(transformedRows);
  } catch (err) {
    console.error('Error in getAllTokens:', err);
    return handleDatabaseError(err, res);
  } finally {
    client.release();
  }
};

const getTokenByNumber = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tokens WHERE token_no = $1",
      [req.params.tokenNo]
    );
    // Transform to camelCase for frontend
    const transformedRow = {
      id: result.rows[0].id,
      tokenNo: result.rows[0].token_no,
      date: result.rows[0].date,
      time: result.rows[0].time,
      code: result.rows[0].code,
      name: result.rows[0].name,
      test: result.rows[0].test,
      weight: result.rows[0].weight,
      sample: result.rows[0].sample,
      amount: result.rows[0].amount,
      isPaid: result.rows[0].is_paid
    };
    res.json({ data: transformedRow });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const createToken = async (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO tokens (token_no, date, time, code, name, test, weight, sample, amount, is_paid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0) 
       RETURNING id, token_no, date, time, code, name, test, weight, sample, amount, is_paid`,
      [tokenNo, date, time, code, name, test, weight, sample, amount]
    );
    // Transform to camelCase for frontend
    const transformedRow = {
      id: result.rows[0].id,
      tokenNo: result.rows[0].token_no,
      date: result.rows[0].date,
      time: result.rows[0].time,
      code: result.rows[0].code,
      name: result.rows[0].name,
      test: result.rows[0].test,
      weight: result.rows[0].weight,
      sample: result.rows[0].sample,
      amount: result.rows[0].amount,
      isPaid: result.rows[0].is_paid
    };
    res.status(201).json(transformedRow);
  } catch (err) {
    console.error('Error creating token:', err);
    return handleDatabaseError(err, res);
  } finally {
    client.release();
  }
};

const updateToken = async (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tokens 
       SET token_no = $1, date = $2, time = $3, code = $4, name = $5, 
           test = $6, weight = $7, sample = $8, amount = $9 
       WHERE id = $10 
       RETURNING id, token_no, date, time, code, name, test, weight, sample, amount, is_paid`,
      [tokenNo, date, time, code, name, test, weight, sample, amount, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Token not found" });
    }
    // Transform to camelCase for frontend
    const transformedRow = {
      id: result.rows[0].id,
      tokenNo: result.rows[0].token_no,
      date: result.rows[0].date,
      time: result.rows[0].time,
      code: result.rows[0].code,
      name: result.rows[0].name,
      test: result.rows[0].test,
      weight: result.rows[0].weight,
      sample: result.rows[0].sample,
      amount: result.rows[0].amount,
      isPaid: result.rows[0].is_paid
    };
    res.status(200).json(transformedRow);
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const updatePaymentStatus = async (req, res) => {
  const { isPaid } = req.body;
  try {
    const result = await pool.query(
      "UPDATE tokens SET is_paid = $1 WHERE id = $2 RETURNING *",
      [isPaid ? 1 : 0, req.params.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Token not found" });
    }
    // Transform to camelCase for frontend
    const transformedRow = {
      id: result.rows[0].id,
      tokenNo: result.rows[0].token_no,
      date: result.rows[0].date,
      time: result.rows[0].time,
      code: result.rows[0].code,
      name: result.rows[0].name,
      test: result.rows[0].test,
      weight: result.rows[0].weight,
      sample: result.rows[0].sample,
      amount: result.rows[0].amount,
      isPaid: result.rows[0].is_paid
    };
    res.status(200).json({ updatedID: result.rowCount, token: transformedRow });
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
    // Transform to camelCase for frontend
    const transformedRow = {
      id: result.rows[0].id,
      tokenNo: result.rows[0].token_no,
      date: result.rows[0].date,
      time: result.rows[0].time,
      code: result.rows[0].code,
      name: result.rows[0].name,
      test: result.rows[0].test,
      weight: result.rows[0].weight,
      sample: result.rows[0].sample,
      amount: result.rows[0].amount,
      isPaid: result.rows[0].is_paid
    };
    res.status(200).json({ deletedID: result.rowCount, token: transformedRow });
  } catch (err) {
    return handleDatabaseError(err, res);
  }
};

const generateTokenNumber = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the latest token
    const result = await client.query(
      'SELECT token_no FROM tokens ORDER BY id DESC LIMIT 1'
    );

    let nextTokenNo;
    if (!result.rows[0] || !result.rows[0].token_no) {
      nextTokenNo = "A1";
    } else {
      const currentToken = result.rows[0].token_no.toString();
      const match = currentToken.match(/^([A-Z])(\d+)$/);
      
      if (!match) {
        nextTokenNo = "A1";
      } else {
        const letter = match[1];
        const number = parseInt(match[2]);
        
        if (number >= 999) {
          if (letter === 'Z') {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
              error: "Token number limit reached. Please contact administrator." 
            });
          }
          nextTokenNo = `${String.fromCharCode(letter.charCodeAt(0) + 1)}1`;
        } else {
          nextTokenNo = `${letter}${number + 1}`;
        }
      }
    }

    // Verify the generated token is unique
    const checkUnique = await client.query(
      'SELECT COUNT(*) FROM tokens WHERE token_no = $1',
      [nextTokenNo]
    );

    if (parseInt(checkUnique.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: "Generated token number already exists. Please try again." 
      });
    }

    await client.query('COMMIT');
    res.json({ tokenNo: nextTokenNo });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Token generation error:', err);
    return handleDatabaseError(err, res);
  } finally {
    client.release();
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
