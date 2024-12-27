const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class TokensModel {
  async createToken(tokenData) {
    const { 
      tokenNo, date, time, code, name, 
      test, weight, sample, amount 
    } = tokenData;

    try {
      const result = await db.run(
        "INSERT INTO tokens (tokenNo, date, time, code, name, test, weight, sample, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [tokenNo, date, time, code, name, test, weight, sample, amount]
      );
      return result;
    } catch (error) {
      throw new AppError('Error creating token', 500);
    }
  }

  async findByTokenNo(tokenNo) {
    try {
      const token = await db.get(
        "SELECT * FROM tokens WHERE tokenNo = ?", 
        [tokenNo]
      );
      return token;
    } catch (error) {
      throw new AppError('Error retrieving token', 500);
    }
  }
}

module.exports = new TokensModel();
