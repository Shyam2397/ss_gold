const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database("./USERS.db");

// Create the users and entries tables if they do not exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      code TEXT NOT NULL,
      place TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenNo INTEGER UNIQUE,
      date TEXT,
      time TEXT,
      code TEXT,
      name TEXT,
      test TEXT,
      weight REAL,
      sample TEXT,
      amount INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tokenNo INTEGER UNIQUE,
      date TEXT,
      time TEXT,
      code TEXT,
      name TEXT,
      test TEXT,
      weight REAL,
      sample TEXT,
      amount INTEGER
    )
  `);

  db.run(`CREATE TABLE IF NOT EXISTS skin_tests (
    tokenNo INTEGER PRIMARY KEY,
    date TEXT,
    time TEXT,
    name TEXT,
    weight REAL,
    sample TEXT,
    highest REAL,
    average REAL,
    gold_fineness REAL,
    karat REAL,
    silver REAL,
    copper REAL,
    zinc REAL,
    cadmium REAL,
    nickel REAL,
    tungsten REAL,
    iridium REAL,
    ruthenium REAL,
    osmium REAL,
    rhodium REAL,
    rhenium REAL,
    indium REAL,
    titanium REAL,
    palladium REAL,
    platinum REAL,
    others TEXT,
    remarks TEXT,
    code TEXT
)`);
});

// Login page
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (row) {
        res.status(200).json({ message: "Login successful" });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  );
});

// New Entries
app.post("/entries", (req, res) => {
  const { name, phoneNumber, code, place } = req.body;

  db.run(
    "INSERT INTO entries (name, phoneNumber, code, place) VALUES (?, ?, ?, ?)",
    [name, phoneNumber, code, place],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create entry" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.get("/entries", (req, res) => {
  db.all("SELECT * FROM entries", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Failed to retrieve entries" });
    }
    res.status(200).json(rows);
  });
});

app.put("/entries/:id", (req, res) => {
  const { id } = req.params;
  const { name, phoneNumber, code, place } = req.body;

  db.run(
    "UPDATE entries SET name = ?, phoneNumber = ?, code = ?, place = ? WHERE id = ?",
    [name, phoneNumber, code, place, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to update entry" });
      }
      res.status(200).json({ message: "Entry updated successfully" });
    }
  );
});

app.delete("/entries/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM entries WHERE id = ?", id, function (err) {
    if (err) {
      return res.status(500).json({ error: "Failed to delete entry" });
    }
    res.status(200).json({ message: "Entry deleted successfully" });
  });
});

// CRUD for Token
app.get("/tokens", (req, res) => {
  db.all("SELECT * FROM tokens ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

app.post("/tokens", (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } =
    req.body;

  db.run(
    "INSERT INTO tokens (tokenNo, date, time, code, name, test, weight, sample, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [tokenNo, date, time, code, name, test, weight, sample, amount],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

app.put("/tokens/:id", (req, res) => {
  const { tokenNo, date, time, code, name, test, weight, sample, amount } =
    req.body;

  db.run(
    "UPDATE tokens SET tokenNo = ?, date = ?, time = ?, code = ?, name = ?, test = ?, weight = ?, sample = ?, amount = ? WHERE id = ?",
    [
      tokenNo,
      date,
      time,
      code,
      name,
      test,
      weight,
      sample,
      amount,
      req.params.id,
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(200).json({ updatedID: this.changes });
    }
  );
});

app.delete("/tokens/:id", (req, res) => {
  db.run("DELETE FROM tokens WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.status(200).json({ deletedID: this.changes });
  });
});

// Generate new token number
app.get("/generateTokenNo", (req, res) => {
  db.get("SELECT MAX(tokenNo) AS maxTokenNo FROM tokens", [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    const nextTokenNo = (row.maxTokenNo || 0) + 1;
    res.json({ tokenNo: nextTokenNo });
  });
});

// Fetch name by code
app.get("/entries/:code", (req, res) => {
  const { code } = req.params;

  db.get("SELECT name FROM entries WHERE code = ?", [code], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ name: row ? row.name : "" });
  });
});

// CRUD operations for skin tests

app.get("/skin_tests", (req, res) => {
  const sql = "SELECT * FROM skin_tests";
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

app.post("/skin_tests", (req, res) => {
  const data = req.body;
  const checkSql = "SELECT * FROM skin_tests WHERE tokenNo = ?";
  db.get(checkSql, [data.tokenNo], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(400).json({ error: err.message });
      return;
    }
    if (row) {
      res.status(400).json({ error: "Token number already exists" });
      return;
    }
    const sql = `
      INSERT INTO skin_tests (tokenNo, date, time, name, weight, sample, highest, average, gold_fineness, karat, silver, copper, zinc, cadmium, nickel, tungsten, iridium, ruthenium, osmium, rhodium, rhenium, indium, titanium, palladium, platinum, others, remarks,code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `;
    const params = [
      data.tokenNo,
      data.date,
      data.time,
      data.name,
      data.weight,
      data.sample,
      data.highest,
      data.average,
      data.gold_fineness,
      data.karat,
      data.silver,
      data.copper,
      data.zinc,
      data.cadmium,
      data.nickel,
      data.tungsten,
      data.iridium,
      data.ruthenium,
      data.osmium,
      data.rhodium,
      data.rhenium,
      data.indium,
      data.titanium,
      data.palladium,
      data.platinum,
      data.others,
      data.remarks,
      data.code,
    ];
    db.run(sql, params, function (err) {
      if (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ message: "Success", data: data, id: this.lastID });
    });
  });
});

app.put("/skin_tests/:tokenNo", (req, res) => {
  const data = req.body;
  const sql = `
  UPDATE skin_tests SET
      date = ?, time = ?, name = ?, weight = ?, sample = ?, highest = ?, average = ?, gold_fineness = ?, karat = ?, silver = ?, copper = ?, zinc = ?, cadmium = ?, nickel = ?, tungsten = ?, iridium = ?, ruthenium = ?, osmium = ?, rhodium = ?, rhenium = ?, indium = ?, titanium = ?, palladium = ?, platinum = ?, others = ?, remarks = ?,code=?
  WHERE tokenNo = ?
  `;
  const params = [
    data.date,
    data.time,
    data.name,
    data.weight,
    data.sample,
    data.highest,
    data.average,
    data.gold_fineness,
    data.karat,
    data.silver,
    data.copper,
    data.zinc,
    data.cadmium,
    data.nickel,
    data.tungsten,
    data.iridium,
    data.ruthenium,
    data.osmium,
    data.rhodium,
    data.rhenium,
    data.indium,
    data.titanium,
    data.palladium,
    data.platinum,
    data.others,
    data.remarks,
    data.code,
    req.params.tokenNo,
  ];
  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Success", data: data, changes: this.changes });
  });
});

app.delete("/skin_tests/:tokenNo", (req, res) => {
  const sql = "DELETE FROM skin_tests WHERE tokenNo = ?";
  db.run(sql, req.params.tokenNo, function (err) {
    if (err) {
      console.error(err.message);
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ message: "Deleted", changes: this.changes });
  });
});

// Endpoint to get token data
app.get("/tokens/:tokenNo", (req, res) => {
  const sql = "SELECT * FROM tokens WHERE tokenNo = ?";
  db.get(sql, req.params.tokenNo, (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(400).json({ error: err.message });
      return;
    }
    res.json({ data: row });
  });
});

// Endpoint to fetch a phone number based on code
app.get("/entries", (req, res) => {
  const { code } = req.query; // Extract the code from the query parameters

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  db.get(
    "SELECT phone_number FROM entries WHERE code = ?",
    [code],
    (err, row) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Failed to retrieve phone number" });
      }
      if (!row) {
        return res
          .status(404)
          .json({ error: "No entry found for the provided code" });
      }
      res.status(200).json({ phone_number: row.phone_number }); // Return the phone number
    }
  );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
