// Standalone check of the client permission rules (plain JS copy of the module).
import {
  MENU_DEFINITIONS,
  PATH_PERMISSION,
  canAccessPath,
  filterByPermission,
  firstAccessiblePath,
  hasPermission,
  isAdmin,
  normalizePermissions,
  permissionGroups,
} from '../client/src/utils/permissions.js';

let pass = 0;
let fail = 0;
const ok = (label, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`PASS  ${label}${extra ? '  ->  ' + extra : ''}`);
  } else {
    fail++;
    console.log(`FAIL  ${label}${extra ? '  ->  ' + extra : ''}`);
  }
};

const admin = { id: 1, username: 'ADMIN', role: 'admin', permissions: [] };
const noAccess = { id: 2, username: 'nobody', role: 'staff', permissions: [] };
const limited = {
  id: 3,
  username: 'clerk',
  role: 'staff',
  permissions: ['dashboard', 'token', 'settings'],
};

// ---- every menu key is registered, no duplicates ----------------------------
const keys = MENU_DEFINITIONS.map((m) => m.key);
ok('16 menu keys registered', keys.length === 16, `count=${keys.length}`);
ok('no duplicate keys', new Set(keys).size === keys.length);

// ---- admin ----------------------------------------------------------------
ok('admin detected', isAdmin(admin));
ok('admin has every menu', MENU_DEFINITIONS.every((m) => hasPermission(admin, m.key)));
ok('admin reaches every route', ['/dashboard', '/settings', '/user', '/cashbook'].every((p) => canAccessPath(admin, p)));
ok('admin with empty list still gets everything (implicit)', admin.permissions.length === 0);

// ---- no access ------------------------------------------------------------
ok('no-access user reaches nothing', MENU_DEFINITIONS.filter((m) => m.path).every((m) => !canAccessPath(noAccess, m.path)));
ok('no-access user still reaches My Account', canAccessPath(noAccess, '/user'));
ok('no-access staff lands on My Account', firstAccessiblePath(noAccess) === '/user', firstAccessiblePath(noAccess));

// ---- limited staff --------------------------------------------------------
ok('granted menu allowed', canAccessPath(limited, '/token'));
ok('ung-granted menu blocked', !canAccessPath(limited, '/cashbook'));
ok('settings allowed when only settings granted', canAccessPath(limited, '/settings'));
ok('My Account always allowed', canAccessPath(limited, '/user'));
ok('first permitted page is the first granted menu', firstAccessiblePath(limited) === '/dashboard', firstAccessiblePath(limited));

// the regression that motivated the fix
ok('settings maps to the settings key, not user-management',
  PATH_PERMISSION.get('/settings') === 'settings', PATH_PERMISSION.get('/settings'));
ok('user-management is not a route', !PATH_PERMISSION.has('/user-management'));
ok('staff granted settings is NOT given user-management', !hasPermission(limited, 'user-management'));

// ---- unlisted routes stay open so new pages are not bricked ---------------
ok('unknown route defaults to allowed', canAccessPath(noAccess, '/brand-new-page'));

// ---- filtering ------------------------------------------------------------
const items = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Token', path: '/token' },
  { label: 'Cash Book', path: '/cashbook' },
  { label: 'Settings', path: '/settings' },
];
ok('filter keeps only granted menus',
  JSON.stringify(filterByPermission(limited, items).map((i) => i.path)) === '["/dashboard","/token","/settings"]',
  JSON.stringify(filterByPermission(limited, items).map((i) => i.path)));
ok('filter for admin keeps everything', filterByPermission(admin, items).length === items.length);
ok('filter for no-access keeps nothing', filterByPermission(noAccess, items).length === 0);

// ---- normalisation --------------------------------------------------------
ok('admin permissions normalised away', JSON.stringify(normalizePermissions('admin', ['token'])) === '[]');
ok('unknown keys dropped', JSON.stringify(normalizePermissions('staff', ['token', 'hack'])) === '["token"]');
ok('duplicates removed', JSON.stringify(normalizePermissions('staff', ['token', 'token'])) === '["token"]');
ok('non-array is safe', JSON.stringify(normalizePermissions('staff', null)) === '[]');

// ---- grouping for the matrix ---------------------------------------------
const groups = permissionGroups();
ok('matrix grouped into 4 sections', groups.length === 4, groups.map((g) => g.group).join(','));
ok('every key appears exactly once in the matrix',
  groups.flatMap((g) => g.items).length === keys.length);

// ---- signed out ------------------------------------------------------------
ok('signed out user is denied', canAccessPath(null, '/dashboard') === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
