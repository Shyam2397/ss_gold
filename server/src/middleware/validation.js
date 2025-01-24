const validateExpense = (req, res, next) => {
  const { date, expense_type, amount } = req.body;

  if (!date || !expense_type || !amount) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'date, expense_type, and amount are required'
    });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      error: 'Invalid amount',
      detail: 'Amount must be a positive number'
    });
  }

  next();
};

const validateSkinTest = (req, res, next) => {
  const { tokenNo, date, name } = req.body;

  if (!tokenNo || !date || !name) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'tokenNo, date, and name are required'
    });
  }

  next();
};

const validateToken = (req, res, next) => {
  const { tokenNo, date, name } = req.body;

  if (!tokenNo || !date || !name) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'tokenNo, date, and name are required'
    });
  }

  next();
};

const validateEntry = (req, res, next) => {
  const { name, phoneNumber, code, place } = req.body;

  if (!name || !phoneNumber || !code || !place) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'name, phoneNumber, code, and place are required'
    });
  }

  // Basic phone number validation
  if (!/^\d{10}$/.test(phoneNumber)) {
    return res.status(400).json({
      error: 'Invalid phone number',
      detail: 'Phone number must be 10 digits'
    });
  }

  next();
};

const validatePureExchange = (req, res, next) => {
  const { tokenNo, date, weight } = req.body;

  if (!tokenNo || !date || !weight) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'tokenNo, date, and weight are required'
    });
  }

  next();
};

const validateExpenseType = (req, res, next) => {
  const { expense_name } = req.body;

  if (!expense_name) {
    return res.status(400).json({
      error: 'Missing required field',
      detail: 'expense_name is required'
    });
  }

  if (expense_name.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid expense name',
      detail: 'Expense name cannot be empty'
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  // Check if fields are present
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      detail: 'Username and password are required'
    });
  }

  // Validate username format
  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Invalid username',
      detail: 'Username must be at least 3 characters long'
    });
  }

  // Validate password strength
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Invalid password',
      detail: 'Password must be at least 6 characters long'
    });
  }

  next();
};

module.exports = {
  validateExpense,
  validateSkinTest,
  validateToken,
  validateEntry,
  validatePureExchange,
  validateExpenseType,
  validateLogin
};
