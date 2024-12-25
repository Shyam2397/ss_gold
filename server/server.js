const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("./USERS.db");

// Error handling middleware
const handleDatabaseError = (err, res, customMessage = "Internal server error") => {
  console.error(`Database error: ${err.message}`);
  return res.status(500).json({ error: customMessage });
};

// Function to recreate skin_tests table
const recreateSkinTestsTable = () => {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE skin_tests (
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
            console.error('Error creating table:', err);
            reject(err);
            return;
          }
          console.log('Table recreated successfully');
          resolve();
        });
    });
  });
};

// Initialize database tables
db.serialize(async () => {
  try {
    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

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

    await recreateSkinTestsTable();
    console.log('All tables initialized successfully');
  } catch (err) {
    console.error('Error initializing tables:', err);
  }
});

// Authentication routes
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) return handleDatabaseError(err, res);
      if (row) {
        res.status(200).json({ message: "Login successful" });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  );
});

// Entries routes
app.post("/entries", (req, res) => {
  const { name, phoneNumber, code, place } = req.body;
  db.run(
    "INSERT INTO entries (name, phoneNumber, code, place) VALUES (?, ?, ?, ?)",
    [name, phoneNumber, code, place],
    function (err) {
      if (err) return handleDatabaseError(err, res, "Failed to create entry");
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get("/entries", (req, res) => {
  const { code } = req.query;
  
  if (code) {
    // Get phone number by code
    db.get(
      "SELECT phoneNumber FROM entries WHERE code = ?",
      [code],
      (err, row) => {
        if (err) return handleDatabaseError(err, res, "Failed to retrieve phone number");
        if (!row) return res.status(404).json({ error: "No entry found for the provided code" });
        res.status(200).json({ phoneNumber: row.phoneNumber });
      }
    );
  } else {
    // Get all entries
    db.all("SELECT * FROM entries", [], (err, rows) => {
      if (err) return handleDatabaseError(err, res, "Failed to retrieve entries");
      res.status(200).json(rows);
    });
  }
});

app.get("/entries/:code", (req, res) => {
  const { code } = req.params;
  db.get(
    "SELECT name FROM entries WHERE code = ?",
    [code],
    (err, row) => {
      if (err) return handleDatabaseError(err, res);
      res.json({ name: row ? row.name : "" });
    }
  );
});

app.put("/entries/:id", (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber, code, place } = req.body;

  db.run(
    "UPDATE entries SET name = ?, phoneNumber = ?, code = ?, place = ? WHERE id = ?",
    [name, phoneNumber, code, place, id],
    function (err) {
      if (err) return handleDatabaseError(err, res, "Failed to update entry");
      res.status(200).json({ message: "Entry updated successfully" });
    }
  );
});

app.delete("/entries/:id", (req, res) => {
  db.run("DELETE FROM entries WHERE id = ?", req.params.id, function (err) {
    if (err) return handleDatabaseError(err, res, "Failed to delete entry");
    res.status(200).json({ message: "Entry deleted successfully" });
  });
});

// Token routes
app.get("/tokens", (req, res) => {
  db.all("SELECT * FROM tokens ORDER BY id DESC", [], (err, rows) => {
    if (err) return handleDatabaseError(err, res);
    res.json(rows);
  });
});

app.get("/tokens/:tokenNo", (req, res) => {
  db.get(
    "SELECT * FROM tokens WHERE tokenNo = ?",
    req.params.tokenNo,
    (err, row) => {
      if (err) return handleDatabaseError(err, res);
      res.json({ data: row });
    }
  );
});

app.post("/tokens", (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  db.run(
    "INSERT INTO tokens (tokenNo, date, time, code, name, test, weight, sample, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [tokenNo, date, time, code, name, test, weight, sample, amount],
    function (err) {
      if (err) return handleDatabaseError(err, res);
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/tokens/:id", (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
  db.run(
    "UPDATE tokens SET tokenNo = ?, date = ?, time = ?, code = ?, name = ?, test = ?, weight = ?, sample = ?, amount = ? WHERE id = ?",
    [tokenNo, date, time, code, name, test, weight, sample, amount, req.params.id],
    function (err) {
      if (err) return handleDatabaseError(err, res);
      res.status(200).json({ updatedID: this.changes });
    }
  );
});

app.delete("/tokens/:id", (req, res) => {
  db.run("DELETE FROM tokens WHERE id = ?", [req.params.id], function (err) {
    if (err) return handleDatabaseError(err, res);
    res.status(200).json({ deletedID: this.changes });
  });
});

// Token number generation
app.get("/generateTokenNo", (req, res) => {
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
});

// Skin tests routes
app.get("/skin_tests", (req, res) => {
  db.all("SELECT * FROM skin_tests", [], (err, rows) => {
    if (err) return handleDatabaseError(err, res);
    res.json({ data: rows });
  });
});

app.post("/skin_tests", (req, res) => {
  const data = req.body;
  
  // Check if token exists
  db.get("SELECT tokenNo FROM skin_tests WHERE tokenNo = ?", [data.tokenNo], (err, row) => {
    if (err) return handleDatabaseError(err, res);
    if (row) return res.status(400).json({ error: "Token number already exists" });

    // Process data
    const processedData = Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = String(value || (key === 'weight' || key.includes('_') ? '0' : ''));
      return acc;
    }, {});

    const columns = [
      'tokenNo', 'date', 'time', 'name', 'weight', 'sample',
      'highest', 'average', 'gold_fineness', 'karat', 'silver',
      'copper', 'zinc', 'cadmium', 'nickel', 'tungsten',
      'iridium', 'ruthenium', 'osmium', 'rhodium', 'rhenium',
      'indium', 'titanium', 'palladium', 'platinum',
      'others', 'remarks', 'code'
    ];

    const sql = `INSERT INTO skin_tests (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
    const params = columns.map(col => processedData[col]);

    db.run(sql, params, function (err) {
      if (err) return handleDatabaseError(err, res);
      res.json({ message: "Success", data: processedData, id: this.lastID });
    });
  });
});

app.put("/skin_tests/:tokenNo", (req, res) => {
  const data = req.body;
  const columns = [
    'date', 'time', 'name', 'weight', 'sample', 'highest',
    'average', 'gold_fineness', 'karat', 'silver', 'copper',
    'zinc', 'cadmium', 'nickel', 'tungsten', 'iridium',
    'ruthenium', 'osmium', 'rhodium', 'rhenium', 'indium',
    'titanium', 'palladium', 'platinum', 'others', 'remarks', 'code'
  ];

  const sql = `UPDATE skin_tests SET ${columns.map(col => `${col} = ?`).join(', ')} WHERE tokenNo = ?`;
  const params = [...columns.map(col => data[col]), req.params.tokenNo];

  db.run(sql, params, function (err) {
    if (err) return handleDatabaseError(err, res);
    res.json({ message: "Success", data: data, changes: this.changes });
  });
});

app.delete("/skin_tests/:tokenNo", (req, res) => {
  db.run("DELETE FROM skin_tests WHERE tokenNo = ?", req.params.tokenNo, function (err) {
    if (err) return handleDatabaseError(err, res);
    res.json({ message: "Deleted", changes: this.changes });
  });
});

// Reset skin_tests table endpoint
app.post("/reset_skin_tests", async (req, res) => {
  try {
    await recreateSkinTestsTable();
    res.json({ message: "Table reset successfully" });
  } catch (err) {
    handleDatabaseError(err, res, "Failed to reset table");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
