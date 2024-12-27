const db = require('../config/database');

const initializeTables = async () => {
  try {
    // Users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Entries table
    await db.run(`
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        code TEXT NOT NULL,
        place TEXT NOT NULL
      )
    `);

    // Tokens table
    await db.run(`
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

    // Skin tests table
    await db.run(`
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
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database tables:', error);
  }
};

module.exports = { initializeTables };
