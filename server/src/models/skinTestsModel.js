const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class SkinTestsModel {
  async createSkinTest(skinTestData) {
    try {
      // Dynamically extract all fields from the input data
      const columns = Object.keys(skinTestData).join(', ');
      const placeholders = Object.keys(skinTestData).map(() => '?').join(', ');
      const values = Object.values(skinTestData);

      const query = `
        INSERT INTO skin_tests (${columns}) 
        VALUES (${placeholders})
      `;

      const result = await db.run(query, values);
      return result;
    } catch (error) {
      throw new AppError('Error creating skin test', 500);
    }
  }

  async findByTokenNo(tokenNo) {
    try {
      const skinTest = await db.get(
        "SELECT * FROM skin_tests WHERE tokenNo = ?", 
        [tokenNo]
      );
      return skinTest;
    } catch (error) {
      throw new AppError('Error retrieving skin test', 500);
    }
  }
}

module.exports = new SkinTestsModel();
