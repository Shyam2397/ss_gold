const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class EntriesModel {
  async findByCode(code) {
    try {
      const entry = await db.get(
        "SELECT * FROM entries WHERE code = ?", 
        [code]
      );
      return entry;
    } catch (error) {
      throw new AppError('Error retrieving entry', 500);
    }
  }

  async findByPhoneNumber(phoneNumber) {
    try {
      const entry = await db.get(
        "SELECT * FROM entries WHERE phoneNumber = ?", 
        [phoneNumber]
      );
      return entry;
    } catch (error) {
      throw new AppError('Error retrieving entry', 500);
    }
  }

  async createEntry(name, phoneNumber, code, place) {
    try {
      const result = await db.run(
        "INSERT INTO entries (name, phoneNumber, code, place) VALUES (?, ?, ?, ?)", 
        [name, phoneNumber, code, place]
      );
      return result;
    } catch (error) {
      throw new AppError('Error creating entry', 500);
    }
  }
}

module.exports = new EntriesModel();
