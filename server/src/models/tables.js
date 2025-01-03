const db = require('../config/database');

const createSkinTestsTable = () => {
  return new Promise((resolve, reject) => {
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
    
    db.run(createTableSQL, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

const resetSkinTestsTable = () => {
  return new Promise((resolve, reject) => {
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
    db.serialize(() => {
      db.run("DROP TABLE IF EXISTS skin_tests")
        .run(createTableSQL, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
    });
  });
};

const createExpenseMasterTable = () => {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS expense_master (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expense_name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('Error creating expense_master table:', err);
        reject(err);
      } else {
        console.log('expense_master table created successfully');
        resolve();
      }
    });
  });
};

const createExpensesTable = () => {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        expense_type TEXT NOT NULL,
        amount REAL NOT NULL,
        paid_to TEXT,
        pay_mode TEXT,
        remarks TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('Error creating expenses table:', err);
        reject(err);
      } else {
        console.log('expenses table created successfully');
        resolve();
      }
    });
  });
};

const initializeTables = async () => {
  try {
    await createSkinTestsTable();
    await createExpenseMasterTable();
    await createExpensesTable();
    console.log('All tables initialized successfully');

    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Create default admin user if no users exist
    db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
      if (!err && row.count === 0) {
        db.run(
          "INSERT INTO users (username, password) VALUES (?, ?)",
          ["admin", "admin123"],
          (err) => {
            if (err) {
              console.error("Failed to create default admin user:", err);
            }
          }
        );
      }
    });

    // Create entries table
    db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        code TEXT NOT NULL,
        place TEXT NOT NULL
      )
    `);

    // Create tokens table
    db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    `);
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
};

module.exports = {
  createSkinTestsTable,
  resetSkinTestsTable,
  createExpenseMasterTable,
  createExpensesTable,
  initializeTables
};
