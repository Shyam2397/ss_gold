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
  const { date, name } = req.body;
  const isUpdate = req.method === 'PUT';
  
  // For update operations, tokenNo comes from URL params
  if (!isUpdate && !req.body.tokenNo) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'tokenNo is required for creating new skin tests'
    });
  }

  if (!date || !name) {
    return res.status(400).json({
      error: 'Missing required fields',
      detail: 'date and name are required'
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

const PASSWORD_MIN_LENGTH = 6;
// Resized avatars are stored inline as data URLs; 400 KB of base64 is roughly 300 KB of image
const MAX_PROFILE_IMAGE_LENGTH = 400 * 1024;

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
  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      success: false,
      error: 'Invalid password',
      detail: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    });
  }

  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      detail: 'New password and confirm password are required'
    });
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      success: false,
      error: 'Invalid password',
      detail: `New password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    });
  }

  if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: 'Weak password',
      detail: 'New password must contain at least one letter and one number'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: 'Passwords do not match',
      detail: 'New password and confirm password must match'
    });
  }

  if (currentPassword && currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Password unchanged',
      code: 'PASSWORD_UNCHANGED',
      detail: 'New password must be different from the current password'
    });
  }

  next();
};

const validateCreateUser = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      detail: 'Username and password are required'
    });
  }

  if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid username',
      detail: 'Username must be 3-50 characters using letters, numbers, dot, dash or underscore'
    });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      success: false,
      error: 'Invalid password',
      detail: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    });
  }

  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return res.status(400).json({
      success: false,
      error: 'Weak password',
      detail: 'Password must contain at least one letter and one number'
    });
  }

  if (req.body.permissions !== undefined && !Array.isArray(req.body.permissions)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid permissions',
      detail: 'Permissions must be a list of menu keys'
    });
  }

  next();
};

const validateUpdateUser = (req, res, next) => {
  const { role, permissions, isActive } = req.body;

  if (role !== undefined && !['admin', 'staff'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role',
      detail: 'Role must be either admin or staff'
    });
  }

  if (permissions !== undefined && !Array.isArray(permissions)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid permissions',
      detail: 'Permissions must be a list of menu keys'
    });
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'Invalid status',
      detail: 'isActive must be true or false'
    });
  }

  next();
};

const validateResetPassword = (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      detail: 'New password is required'
    });
  }

  if (newPassword.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      success: false,
      error: 'Invalid password',
      detail: `New password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    });
  }

  if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: 'Weak password',
      detail: 'Password must contain at least one letter and one number'
    });
  }

  next();
};

const validateProfile = (req, res, next) => {
  const { fullName = '', profileImage = null } = req.body;

  if (typeof fullName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid name',
      detail: 'Full name must be text'
    });
  }

  if (fullName.length > 150) {
    return res.status(400).json({
      success: false,
      error: 'Name too long',
      detail: 'Full name must be 150 characters or fewer'
    });
  }

  // Photos are stored as data URLs, so cap the payload well below the row limit
  if (profileImage !== null && profileImage !== undefined) {
    if (typeof profileImage !== 'string' || !profileImage.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid photo',
        detail: 'Photo must be an image data URL'
      });
    }

    if (profileImage.length > MAX_PROFILE_IMAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: 'Photo too large',
        detail: 'Photo must be smaller than 400 KB after resizing'
      });
    }
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
  validateLogin,
  validateChangePassword,
  validateCreateUser,
  validateUpdateUser,
  validateResetPassword,
  validateProfile,
  PASSWORD_MIN_LENGTH,
  MAX_PROFILE_IMAGE_LENGTH
};
