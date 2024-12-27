const EntriesModel = require('../models/entriesModel');
const { AppError } = require('../middleware/errorHandler');

class EntriesController {
  async getEntry(req, res, next) {
    try {
      const { code, phoneNumber } = req.query;

      let entry;
      if (code) {
        entry = await EntriesModel.findByCode(code);
      } else if (phoneNumber) {
        entry = await EntriesModel.findByPhoneNumber(phoneNumber);
      } else {
        throw new AppError('Either code or phoneNumber must be provided', 400);
      }

      if (!entry) {
        throw new AppError('No entries found', 404);
      }

      res.status(200).json(entry);
    } catch (error) {
      next(error);
    }
  }

  async createEntry(req, res, next) {
    try {
      const { name, phoneNumber, code, place } = req.body;

      // Validate input
      if (!name || !phoneNumber || !code || !place) {
        throw new AppError('All fields (name, phoneNumber, code, place) are required', 400);
      }

      const result = await EntriesModel.createEntry(name, phoneNumber, code, place);

      res.status(201).json({ 
        message: "Entry created successfully",
        entryId: result.lastID 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EntriesController();
