/**
 * Single source of truth for menu permissions on the client.
 *
 * The keys here must stay identical to MENU_KEYS in
 * server/src/utils/menuPermissions.js - the server silently drops any key it
 * does not recognise, so a typo would show up as a checkbox that never sticks.
 */

export const ADMIN_ROLE = 'admin';
export const STAFF_ROLE = 'staff';

export const MENU_DEFINITIONS = [
  { key: 'dashboard', label: 'Dashboard', group: 'Main', path: '/dashboard' },
  { key: 'entries', label: 'New Entries', group: 'Main', path: '/entries' },
  { key: 'token', label: 'Token', group: 'Main', path: '/token' },
  { key: 'skin-testing', label: 'Skin Testing', group: 'Main', path: '/skin-testing' },
  { key: 'photo-testing', label: 'Photo Testing', group: 'Main', path: '/photo-testing' },
  { key: 'pure-exchange', label: 'Pure Exchange', group: 'Main', path: '/pure-exchange' },
  { key: 'customer-data', label: 'Customer Data', group: 'Data', path: '/customer-data' },
  { key: 'token-data', label: 'Token Data', group: 'Data', path: '/token-data' },
  { key: 'skintest-data', label: 'Skin Test Data', group: 'Data', path: '/skintest-data' },
  { key: 'exchange-data', label: 'Exchange Data', group: 'Data', path: '/exchange-data' },
  { key: 'unpaid-customers', label: 'Unpaid Customers', group: 'Data', path: '/unpaid-customers' },
  { key: 'cashbook', label: 'Cash Book', group: 'Expenses', path: '/cashbook' },
  { key: 'expenses-add', label: 'Add Expense', group: 'Expenses', path: '/expenses/add' },
  { key: 'cash-adjustments', label: 'Cash Adjustments', group: 'Expenses', path: '/cash-adjustments' },
  { key: 'settings', label: 'Settings', group: 'System', path: '/settings' },
  // Not a route of its own - it is the Users tab inside Settings
  { key: 'user-management', label: 'User Management', group: 'System', path: null },
];

export const MENU_GROUPS = ['Main', 'Data', 'Expenses', 'System'];

/** Paths that are never gated - every signed in user must reach them. */
export const UNGATED_PATHS = ['/user'];

/**
 * A path can be guarded by more than one key - `/settings` is reached by the
 * `settings` key, and the Users tab inside it by `user-management`. Only the
 * first (navigating) key gates the route itself, so keep it when building the
 * lookup rather than letting a later entry overwrite it.
 */
export const PATH_PERMISSION = MENU_DEFINITIONS.reduce((map, item) => {
  if (item.path && !map.has(item.path)) {
    map.set(item.path, item.key);
  }
  return map;
}, new Map());

export const isAdmin = (user) => Boolean(user) && user.role === ADMIN_ROLE;

/**
 * True when the user may open `key`. Administrators implicitly hold every menu,
 * which is why the server sends them an empty permission list.
 */
export const hasPermission = (user, key) => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (!key) return false;
  return Array.isArray(user.permissions) && user.permissions.includes(key);
};

export const permissionForPath = (path) => PATH_PERMISSION.get(path) || null;

/**
 * True when the user may open `path`. Unlisted paths are treated as allowed so
 * a route added later is not accidentally bricked for everyone.
 */
export const canAccessPath = (user, path) => {
  if (!user || !path) return false;
  if (UNGATED_PATHS.includes(path)) return true;

  const key = permissionForPath(path);
  if (!key) return true;

  return hasPermission(user, key);
};

export const filterByPermission = (user, items) =>
  (items || []).filter((item) => canAccessPath(user, item.path));

/** First menu the user is allowed to land on, used to redirect blocked routes. */
export const firstAccessiblePath = (user) => {
  const allowed = MENU_DEFINITIONS.find(
    (item) => item.path && canAccessPath(user, item.path)
  );
  return allowed ? allowed.path : '/user';
};

/** Grouped view of the matrix, ready to render the "All / None" checkboxes. */
export const permissionGroups = () =>
  MENU_GROUPS.map((group) => ({
    group,
    items: MENU_DEFINITIONS.filter((item) => item.group === group),
  })).filter((entry) => entry.items.length > 0);

/** Union of the granted keys for a role/permission pair, used by the edit form. */
export const normalizePermissions = (role, permissions) => {
  if (role === ADMIN_ROLE) return [];
  if (!Array.isArray(permissions)) return [];
  const known = new Set(MENU_DEFINITIONS.map((item) => item.key));
  return [...new Set(permissions.filter((key) => known.has(key)))];
};

export const displayName = (user) => user?.fullName?.trim() || user?.username || 'User';
