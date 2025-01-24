const { pool } = require('../config/database');

const createSkinTestsTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS skin_tests (
      tokenNo TEXT PRIMARY KEY,
      date TEXT,
      time TEXT,
      name TEXT,
      weight TEXT,
      sample TEXT,
      highest TEXT,
      average TEXT,
      gold_fineness TEXT,
      karat TEXT,
      silver TEXT,
      copper TEXT,
      zinc TEXT,
      cadmium TEXT,
      nickel TEXT,
      tungsten TEXT,
      iridium TEXT,
      ruthenium TEXT,
      osmium TEXT,
      rhodium TEXT,
      rhenium TEXT,
      indium TEXT,
      titanium TEXT,
      palladium TEXT,
      platinum TEXT,
      others TEXT,
      remarks TEXT,
      code TEXT
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
      tokenNo TEXT PRIMARY KEY,
      date TEXT,
      time TEXT,
      name TEXT,
      weight TEXT,
      sample TEXT,
      highest TEXT,
      average TEXT,
      gold_fineness TEXT,
      karat TEXT,
      silver TEXT,
      copper TEXT,
      zinc TEXT,
      cadmium TEXT,
      nickel TEXT,
      tungsten TEXT,
      iridium TEXT,
      ruthenium TEXT,
      osmium TEXT,
      rhodium TEXT,
      rhenium TEXT,
      indium TEXT,
      titanium TEXT,
      palladium TEXT,
      platinum TEXT,
      others TEXT,
      remarks TEXT,
      code TEXT
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
    console.log('expense_master table created successfully');
  } catch (err) {
    console.error('Error creating expense_master table:', err);
    throw err;
  }
};

const createExpensesTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS expenses (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
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
    console.log('expenses table created successfully');
  } catch (err) {
    console.error('Error creating expenses table:', err);
    throw err;
  }
};

const createPureExchangeTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS pure_exchange (
      tokenNo TEXT PRIMARY KEY,
      date TEXT,
      time TEXT,
      weight TEXT,
      highest TEXT,
      hWeight TEXT,
      average TEXT,
      aWeight TEXT,
      goldFineness TEXT,
      gWeight TEXT,
      exGold TEXT,
      exWeight TEXT
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
      const bcrypt = require('bcrypt');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        "INSERT INTO users (username, password) VALUES ($1, $2)",
        ['admin', hashedPassword]
      );
      console.log(' Admin user created');
    }
  } catch (err) {
    console.error('Error creating users table:', err);
    throw err;
  }
};

const createEntriesTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      phoneNumber VARCHAR(20) UNIQUE NOT NULL,
      place VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await pool.query(createTableSQL);
    console.log(' Entries table created successfully');
  } catch (err) {
    console.error('Error creating entries table:', err);
    throw err;
  }
};

const createTokensTable = async () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS tokens (
      id SERIAL PRIMARY KEY,
      tokenNo TEXT UNIQUE,
      date TEXT,
      time TEXT,
      code TEXT,
      name TEXT,
      test TEXT,
      weight TEXT,
      sample TEXT,
      amount TEXT
    )
  `;
  
  try {
    await pool.query(createTableSQL);
  } catch (err) {
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
    await createTokensTable();
    await createEntriesTable();
    console.log(' All tables initialized successfully');
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
