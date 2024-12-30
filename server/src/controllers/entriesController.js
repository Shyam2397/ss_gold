const db = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');

const getAllEntries = (req, res) => {
  const { code, phoneNumber } = req.query;
  
  if (code) {
    db.get("SELECT * FROM entries WHERE code = ?", [code], (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!row) {
        return res.status(404).json({ error: "No entries found" });
      }
      
      res.status(200).json(row);
    });
  } else if (phoneNumber) {
    db.get("SELECT * FROM entries WHERE phoneNumber = ?", [phoneNumber], (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      
      if (!row) {
        return res.status(404).json({ error: "No entries found" });
      }
      
      res.status(200).json(row);
    });
  } else {
    db.all("SELECT * FROM entries", [], (err, rows) => {
      if (err) return handleDatabaseError(err, res);
      res.json(rows);
    });
  }
};

const getEntryByCode = (req, res) => {
  const { code } = req.params;
  db.get(
    "SELECT name FROM entries WHERE code = ?",
    [code],
    (err, row) => {
      if (err) return handleDatabaseError(err, res);
      res.json({ name: row ? row.name : "" });
    }
  );
};

const createEntry = (req, res) => {
  const { name, phoneNumber, code, place } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  db.run(
    "INSERT INTO entries (name, phoneNumber, code, place) VALUES (?, ?, ?, ?)",
    [name, phoneNumber, code, place],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to create entry", details: err.message });
      }
      res.status(201).json({ 
        id: this.lastID, 
        name, 
        phoneNumber, 
        code, 
        place 
      });
    }
  );
};

const updateEntry = (req, res) => {
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
};

const deleteEntry = (req, res) => {
  db.run("DELETE FROM entries WHERE id = ?", req.params.id, function (err) {
    if (err) return handleDatabaseError(err, res, "Failed to delete entry");
    res.status(200).json({ message: "Entry deleted successfully" });
  });
};

module.exports = {
  getAllEntries,
  getEntryByCode,
  createEntry,
  updateEntry,
  deleteEntry
};
