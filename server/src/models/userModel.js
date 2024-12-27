const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class UserModel {
  async findByCredentials(username, password) {
    try {
      const user = await db.get(
        "SELECT * FROM users WHERE username = ? AND password = ?", 
        [username, password]
      );
      return user;
    } catch (error) {
      throw new AppError('Database error during login', 500);
    }
  }

  async createUser(username, password) {
    try {
      const result = await db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)", 
        [username, password]
      );
      return result;
    } catch (error) {
      throw new AppError('Error creating user', 500);
    }
  }
}

module.exports = new UserModel();
