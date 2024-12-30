const db = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');

const login = (req, res) => {
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
};

module.exports = {
  login
};
