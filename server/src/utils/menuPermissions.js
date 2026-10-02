/**
 * Single source of truth for the menus that can be granted to a user.
 * The client renders the same list in the permission matrix, so a menu that is
 * not registered here can never be granted.
 */
const MENU_KEYS = [
  { key: 'dashboard', label: 'Dashboard', group: 'Main' },
  { key: 'entries', label: 'New Entries', group: 'Main' },
  { key: 'token', label: 'Token', group: 'Main' },
  { key: 'skin-testing', label: 'Skin Testing', group: 'Main' },
  { key: 'photo-testing', label: 'Photo Testing', group: 'Main' },
  { key: 'pure-exchange', label: 'Pure Exchange', group: 'Main' },
  { key: 'customer-data', label: 'Customer Data', group: 'Data' },
  { key: 'token-data', label: 'Token Data', group: 'Data' },
  { key: 'skintest-data', label: 'Skin Test Data', group: 'Data' },
  { key: 'exchange-data', label: 'Exchange Data', group: 'Data' },
  { key: 'unpaid-customers', label: 'Unpaid Customers', group: 'Data' },
  { key: 'cashbook', label: 'Cash Book', group: 'Expenses' },
  { key: 'expenses-add', label: 'Add Expense', group: 'Expenses' },
  { key: 'cash-adjustments', label: 'Cash Adjustments', group: 'Expenses' },
  { key: 'settings', label: 'Settings', group: 'System' },
  { key: 'user-management', label: 'User Management', group: 'System' }
];

const VALID_KEYS = new Set(MENU_KEYS.map((item) => item.key));

const isValidPermissionKey = (key) => VALID_KEYS.has(key);

const sanitizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  return [...new Set(permissions.filter((key) => isValidPermissionKey(key)))];
};

/**
 * Reads the JSON list back out of the users.permissions TEXT column. Unknown or
 * malformed entries are dropped so a bad row can never widen access.
 */
const parseStoredPermissions = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return sanitizePermissions(raw);
  try {
    return sanitizePermissions(JSON.parse(raw));
  } catch {
    return [];
  }
};

module.exports = {
  MENU_KEYS,
  VALID_KEYS,
  isValidPermissionKey,
  sanitizePermissions,
  parseStoredPermissions
};