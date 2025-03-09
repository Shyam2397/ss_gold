const { pool, ensureConnection } = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');

const getAllEntries = async (req, res) => {
  let client;
  try {
    // Ensure database connection before proceeding
    await ensureConnection();
    
    client = await pool.connect();
    const { code, phoneNumber } = req.query;
    let query = "SELECT id, code, name, phone_number as \"phoneNumber\", place, created_at, updated_at FROM entries ORDER BY created_at DESC";
    let params = [];

    if (code) {
      query = "SELECT id, code, name, phone_number as \"phoneNumber\", place, created_at, updated_at FROM entries WHERE code = $1";
      params = [code];
    } else if (phoneNumber) {
      query = "SELECT id, code, name, phone_number as \"phoneNumber\", place, created_at, updated_at FROM entries WHERE phone_number = $1";
      params = [phoneNumber];
    }

    const result = await client.query(query, params);

    if ((code || phoneNumber) && result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No entries found"
      });
    }

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error in getAllEntries:', err);
    res.status(503).json({
      error: 'Database connection error',
      message: 'Service temporarily unavailable. Please try again later.'
    });
  } finally {
    if (client) {
      client.release(true); // Force release the client
    }
  }
};

const getEntryByCode = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { code } = req.params;
    const result = await client.query(
      "SELECT id, code, name, phone_number as \"phoneNumber\", place, created_at, updated_at FROM entries WHERE code = $1",
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Entry not found"
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error in getEntryByCode:', err);
    res.status(500).json({
      error: 'Database connection error',
      message: 'Unable to fetch entry. Please try again later.'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const createEntry = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { code, name, phoneNumber, place } = req.body;

    if (!code || !name || !phoneNumber || !place) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    const phoneRegex = /^\+?\d{10,12}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format. Please enter 10-12 digits with optional + prefix"
      });
    }

    const codeCheck = await client.query(
      "SELECT * FROM entries WHERE code = $1",
      [code]
    );

    if (codeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Customer code already exists"
      });
    }

    const phoneCheck = await client.query(
      "SELECT * FROM entries WHERE phone_number = $1",
      [phoneNumber]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Phone number already exists"
      });
    }

    const result = await client.query(
      "INSERT INTO entries (code, name, phone_number, place) VALUES ($1, $2, $3, $4) RETURNING id, code, name, phone_number as \"phoneNumber\", place, created_at, updated_at",
      [code, name, phoneNumber, place]
    );

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error in createEntry:', err);
    res.status(500).json({
      error: 'Database connection error',
      message: 'Unable to create entry. Please try again later.'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const updateEntry = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.params;
    const { code, name, phoneNumber, place } = req.body;

    if (!code || !name || !phoneNumber || !place) {
      return res.status(400).json({
        success: false,
        error: "All fields are required"
      });
    }

    const phoneRegex = /^\+?\d{10,12}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone number format. Please enter 10-12 digits with optional + prefix"
      });
    }

    const entryCheck = await client.query(
      "SELECT * FROM entries WHERE id = $1",
      [id]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Entry not found"
      });
    }

    const codeCheck = await client.query(
      "SELECT * FROM entries WHERE code = $1 AND id != $2",
      [code, id]
    );

    if (codeCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Customer code already exists"
      });
    }

    const phoneCheck = await client.query(
      "SELECT * FROM entries WHERE phone_number = $1 AND id != $2",
      [phoneNumber, id]
    );

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Phone number already exists"
      });
    }

    const result = await client.query(
      `UPDATE entries 
       SET code = $1, name = $2, phone_number = $3, place = $4 
       WHERE id = $5 
       RETURNING id, code, name, phone_number as "phoneNumber", place, created_at, updated_at`,
      [code, name, phoneNumber, place, id]
    );

    res.status(200).json({
      success: true,
      message: "Entry updated successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error in updateEntry:', err);
    res.status(500).json({
      error: 'Database connection error',
      message: 'Unable to update entry. Please try again later.'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const deleteEntry = async (req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { id } = req.params;

    const entryCheck = await client.query(
      "SELECT * FROM entries WHERE id = $1",
      [id]
    );

    if (entryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Entry not found"
      });
    }

    await client.query("DELETE FROM entries WHERE id = $1", [id]);

    res.status(200).json({
      success: true,
      message: "Entry deleted successfully"
    });
  } catch (err) {
    console.error('Error in deleteEntry:', err);
    res.status(500).json({
      error: 'Database connection error',
      message: 'Unable to delete entry. Please try again later.'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

module.exports = {
  getAllEntries,
  getEntryByCode,
  createEntry,
  updateEntry,
  deleteEntry
};
