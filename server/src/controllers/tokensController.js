const TokensModel = require('../models/tokensModel');
const { AppError } = require('../middleware/errorHandler');

class TokensController {
  async createToken(req, res, next) {
    try {
      const tokenData = req.body;

      // Validate required fields
      const requiredFields = ['tokenNo', 'date', 'time', 'code', 'name'];
      const missingFields = requiredFields.filter(field => !tokenData[field]);

      if (missingFields.length > 0) {
        throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400);
      }

      // Check if token already exists
      const existingToken = await TokensModel.findByTokenNo(tokenData.tokenNo);
      if (existingToken) {
        throw new AppError('Token already exists', 409);
      }

      const result = await TokensModel.createToken(tokenData);

      res.status(201).json({ 
        message: "Token created successfully",
        tokenId: result.lastID 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TokensController();
