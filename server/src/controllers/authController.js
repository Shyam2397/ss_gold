const UserModel = require('../models/userModel');
const { AppError } = require('../middleware/errorHandler');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        throw new AppError('Username and password are required', 400);
      }

      // Check credentials
      const user = await UserModel.findByCredentials(username, password);

      if (user) {
        res.status(200).json({ message: "Login successful" });
      } else {
        throw new AppError('Invalid credentials', 401);
      }
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        throw new AppError('Username and password are required', 400);
      }

      // Create user
      const result = await UserModel.createUser(username, password);

      res.status(201).json({ 
        message: "User registered successfully",
        userId: result.lastID 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
