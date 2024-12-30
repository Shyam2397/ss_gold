const db = require('../config/database');

const checkDatabaseConnection = () => {
  return new Promise((resolve, reject) => {
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
};

const listUsers = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT username FROM users", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = {
  checkDatabaseConnection,
  listUsers
};
