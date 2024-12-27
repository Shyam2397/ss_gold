const SkinTestsModel = require('../models/skinTestsModel');
const { AppError } = require('../middleware/errorHandler');

class SkinTestsController {
  async createSkinTest(req, res, next) {
    try {
      const skinTestData = req.body;

      // Validate required fields
      if (!skinTestData.tokenNo) {
        throw new AppError('Token number is required', 400);
      }

      // Check if skin test for this token already exists
      const existingSkinTest = await SkinTestsModel.findByTokenNo(skinTestData.tokenNo);
      if (existingSkinTest) {
        throw new AppError('Skin test for this token already exists', 409);
      }

      const result = await SkinTestsModel.createSkinTest(skinTestData);

      res.status(201).json({ 
        message: "Skin test created successfully",
        skinTestId: result.lastID 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SkinTestsController();
