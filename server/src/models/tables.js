const { pool } = require('../config/database');

const createTokensTable = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      DROP SEQUENCE IF EXISTS tokens_id_seq CASCADE;
      DROP TABLE IF EXISTS tokens CASCADE;
    `);

    const createTableSQL = `
      CREATE TABLE tokens (
        id SERIAL PRIMARY KEY,
        token_no VARCHAR(10) UNIQUE NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        code VARCHAR(50),
        name VARCHAR(100),
        test VARCHAR(100),
        weight DECIMAL(10,3),
        sample VARCHAR(100),
        amount DECIMAL(10,2),
        is_paid INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await client.query(createTableSQL);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const createSkinTestsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS skin_tests (
      token_no VARCHAR(10) PRIMARY KEY UNIQUE,
      date DATE NOT NULL,
      time TIME NOT NULL,
      name VARCHAR(100),
      weight DECIMAL(10,3),
      sample VARCHAR(100),
      highest DECIMAL(5,2),
      average DECIMAL(5,2),
      gold_fineness DECIMAL(5,2),
      karat DECIMAL(4,1),
      silver DECIMAL(5,2),
      copper DECIMAL(5,2),
      zinc DECIMAL(5,2),
      cadmium DECIMAL(5,2),
      nickel DECIMAL(5,2),
      tungsten DECIMAL(5,2),
      iridium DECIMAL(5,2),
      ruthenium DECIMAL(5,2),
      osmium DECIMAL(5,2),
      rhodium DECIMAL(5,2),
      rhenium DECIMAL(5,2),
      indium DECIMAL(5,2),
      titanium DECIMAL(5,2),
      palladium DECIMAL(5,2),
      platinum DECIMAL(5,2),
      others DECIMAL(5,2),
      remarks TEXT,
      code VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_no) REFERENCES tokens(token_no) ON DELETE CASCADE
    )
  `;
  
  try {
    await pool.query(createTableSQL);
  } catch (err) {
    throw err;
  }
};

const resetSkinTestsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS skin_tests (
      token_no VARCHAR(10) PRIMARY KEY UNIQUE,
      date DATE NOT NULL,
      time TIME NOT NULL,
      name VARCHAR(100),
      weight DECIMAL(10,3),
      sample VARCHAR(100),
      highest DECIMAL(5,2),
      average DECIMAL(5,2),
      gold_fineness DECIMAL(5,2),
      karat DECIMAL(4,1),
      silver DECIMAL(5,2),
      copper DECIMAL(5,2),
      zinc DECIMAL(5,2),
      cadmium DECIMAL(5,2),
      nickel DECIMAL(5,2),
      tungsten DECIMAL(5,2),
      iridium DECIMAL(5,2),
      ruthenium DECIMAL(5,2),
      osmium DECIMAL(5,2),
      rhodium DECIMAL(5,2),
      rhenium DECIMAL(5,2),
      indium DECIMAL(5,2),
      titanium DECIMAL(5,2),
      palladium DECIMAL(5,2),
      platinum DECIMAL(5,2),
      others DECIMAL(5,2),
      remarks TEXT,
      code VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_no) REFERENCES tokens(token_no) ON DELETE CASCADE
    )
  `;
  
  try {
    await pool.query('DROP TABLE IF EXISTS skin_tests');
    await pool.query(createTableSQL);
  } catch (err) {
    throw err;
  }
};

const createExpenseMasterTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS expense_master (
      id SERIAL PRIMARY KEY,
      expense_name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(createTableSQL);
  } catch (err) {
    console.error('Error creating expense_master table:', err);
    throw err;
  }
};

const createExpensesTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      expense_type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      paid_to TEXT,
      pay_mode TEXT,
      remarks TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(createTableSQL);
  } catch (err) {
    console.error('Error creating expenses table:', err);
    throw err;
  }
};

const createPureExchangeTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS pure_exchange (
      token_no VARCHAR(10) PRIMARY KEY,
      date DATE NOT NULL,
      time TIME NOT NULL,
      weight DECIMAL(10,3),
      highest DECIMAL(5,2),
      hWeight DECIMAL(10,3),
      average DECIMAL(5,2),
      aWeight DECIMAL(10,3),
      goldFineness DECIMAL(5,2),
      gWeight DECIMAL(10,3),
      exGold DECIMAL(10,3),
      exWeight DECIMAL(10,3),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (token_no) REFERENCES tokens(token_no) ON DELETE CASCADE
    )
  `;
  
  try {
    await pool.query(createTableSQL);
  } catch (err) {
    throw err;
  }
};

const createUsersTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await pool.query(createTableSQL);
    
    // Check if admin user exists
    const adminCheck = await pool.query(
      "SELECT * FROM users WHERE username = 'admin'"
    );
    
    // If admin doesn't exist, create it
    if (adminCheck.rows.length === 0) {
      let hashedPassword;
      try {
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash('admin123', salt);
      } catch (bcryptErr) {
        console.warn('Warning: bcrypt not available, using plain password');
        hashedPassword = 'admin123'; // Fallback to plain password if bcrypt fails
      }
      
      await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        ['admin', hashedPassword]
      );
    }
  } catch (err) {
    if (err.code !== '23505' || !err.detail.includes('(username)=(admin)')) {
      console.error('Error creating users table:', err);
      throw err;
    }
  }
};

const createEntriesTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(20) UNIQUE NOT NULL,
      place VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await pool.query(createTableSQL);
  } catch (err) {
    console.error('Error creating entries table:', err);
    throw err;
  }
};

const initializeTables = async () => {
  try {
    await createUsersTable();
    await createSkinTestsTable();
    await createExpenseMasterTable();
    await createExpensesTable();
    await createPureExchangeTable();
    await createEntriesTable();
  } catch (err) {
    console.error('Error initializing tables:', err);
    throw err;
  }
};

module.exports = {
  createSkinTestsTable,
  resetSkinTestsTable,
  createExpenseMasterTable,
  createExpensesTable,
  createPureExchangeTable,
  createTokensTable,
  createEntriesTable,
  createUsersTable,
  initializeTables
};
