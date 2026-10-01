const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

// Credentials shipped with a fresh installation. The account is flagged with
// must_change_password = TRUE so the app forces a new password after first login.
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'ADMIN';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'ADMIN123';

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
      karat DECIMAL(4,2),
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
      karat DECIMAL(4,2),
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
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      password_changed_at TIMESTAMP DEFAULT NULL,
      last_login_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(createTableSQL);

    // Migrations for installs created before the default-password flow existed
    await pool.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE'
    );
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT NULL');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NULL');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    const adminCheck = await pool.query(
      'SELECT id, password, must_change_password FROM users WHERE username = $1',
      [DEFAULT_ADMIN_USERNAME]
    );

    // If the default account doesn't exist, create it with a forced password change
    if (adminCheck.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);

      await pool.query(
        'INSERT INTO users (username, password, must_change_password) VALUES ($1, $2, TRUE)',
        [DEFAULT_ADMIN_USERNAME, hashedPassword]
      );

      console.log(
        `Created default account "${DEFAULT_ADMIN_USERNAME}" with password "${DEFAULT_ADMIN_PASSWORD}". ` +
          'A password change is required on first login.'
      );
      return;
    }

    // Existing installs: flag the account when it still runs on the shipped default password
    const admin = adminCheck.rows[0];
    if (admin.must_change_password) return;

    const stillUsingDefaultPassword = await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, admin.password);
    if (stillUsingDefaultPassword) {
      await pool.query('UPDATE users SET must_change_password = TRUE WHERE id = $1', [admin.id]);
      console.log(
        `Account "${DEFAULT_ADMIN_USERNAME}" still uses the default password. ` +
          'A password change is required on next login.'
      );
    }
  } catch (err) {
    if (err.code !== '23505' || !err.detail?.includes(`(username)=(${DEFAULT_ADMIN_USERNAME})`)) {
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

const createCompanyDetailsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS company_details (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      name VARCHAR(150) NOT NULL,
      tagline VARCHAR(255),
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(100),
      pincode VARCHAR(10),
      phone VARCHAR(20),
      alternate_phone VARCHAR(20),
      email VARCHAR(150),
      website VARCHAR(150),
      gstin VARCHAR(50),
      logo TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(createTableSQL);
    // Migrations for tables created before newer schema versions
    await pool.query('ALTER TABLE company_details ADD COLUMN IF NOT EXISTS logo TEXT');
    await pool.query('ALTER TABLE company_details DROP COLUMN IF EXISTS footer_message');
  } catch (err) {
    console.error('Error creating company_details table:', err);
    throw err;
  }
};

const createCashAdjustmentsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS cash_adjustments (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      time TIME NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('addition', 'deduction')),
      reason TEXT NOT NULL,
      reference_number VARCHAR(50),
      entered_by VARCHAR(100) NOT NULL,
      remarks TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  try {
    await pool.query(createTableSQL);
  } catch (err) {
    console.error('Error creating cash_adjustments table:', err);
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
    await createCashAdjustmentsTable();
    await createCompanyDetailsTable();
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
  createCashAdjustmentsTable,
  createCompanyDetailsTable,
  createUsersTable,
  initializeTables
};
