// The first-install journey: default admin -> forced password change ->
// unrestricted access everywhere -> staff added -> permissions start to apply.
import { createRequire } from 'node:module';
import { pool } from '../server/src/config/database.js';

const require = createRequire(import.meta.url);
const ROOT = 'C:/Users/shyam/Downloads/Projects/ss_gold/server';
require(ROOT + '/node_modules/dotenv').config({ path: ROOT + '/.env' });

const { app } = require(ROOT + '/src/app');
// Routes are attached inside startServer(), so attach the two we exercise here
app.use('/auth', require(ROOT + '/src/routes/authRoutes'));
app.use('/users', require(ROOT + '/src/routes/userRoutes'));
const bcrypt = require(ROOT + '/node_modules/bcryptjs');
const { MENU_DEFINITIONS, canAccessPath, hasPermission } = await import(
  '../client/src/utils/permissions.js'
);

const PORT = 5098;
const BASE = `http://127.0.0.1:${PORT}`;
const created = [];

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

const call = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
};

const ROUTED = MENU_DEFINITIONS.filter((m) => m.path);
const visibleMenus = (user) => ROUTED.filter((m) => canAccessPath(user, m.path));

/** Recreate exactly what a fresh install leaves in the users table. */
const seedFreshInstall = async () => {
  const hash = await bcrypt.hash('ADMIN123', 10);
  const r = await pool.query(
    `INSERT INTO users (username, password, full_name, role, permissions, is_active, must_change_password)
     VALUES ('FIRSTADMIN', $1, 'Administrator', 'admin', '[]', TRUE, TRUE) RETURNING id`,
    [hash]
  );
  created.push(r.rows[0].id);
  return r.rows[0].id;
};

(async () => {
  const server = app.listen(PORT);
  await new Promise((r) => server.once('listening', r));

  try {
    // ---------- step 1: first sign in on the shipped default password
    await seedFreshInstall();

    const firstLogin = await call('/auth/login', {
      method: 'POST',
      body: { username: 'FIRSTADMIN', password: 'ADMIN123' },
    });
    ok('first sign in with the default password works', firstLogin.status === 200, firstLogin.data.error);

    const lockedUser = firstLogin.data.user;
    ok('account is flagged for a forced password change', lockedUser.mustChangePassword === true);
    ok('the app stays locked until the password is changed', Boolean(lockedUser.mustChangePassword));

    // the role is already admin even while the screen is locked
    ok('locked account already carries the admin role', lockedUser.role === 'admin', lockedUser.role);

    // ---------- step 2: set a new password (current password omitted)
    const changed = await call('/auth/change-password', {
      method: 'POST',
      token: firstLogin.data.token,
      body: { newPassword: 'NewAdmin123', confirmPassword: 'NewAdmin123' },
    });
    ok('password can be changed without the old one', changed.status === 200, changed.data.error);
    ok('the forced-change flag is cleared', changed.data.user?.mustChangePassword === false);

    // ---------- step 3: full access, with no restrictions anywhere
    const afterUser = changed.data.user;
    ok('administrator role survives the password change', afterUser.role === 'admin', afterUser.role);
    ok('administrator keeps an empty permission list', JSON.stringify(afterUser.permissions) === '[]');
    ok('account is active', afterUser.isActive === true);

    ok(
      'administrator can open every screen in the app',
      visibleMenus(afterUser).length === ROUTED.length,
      `${visibleMenus(afterUser).length}/${ROUTED.length}`
    );
    ok(
      'no menu needs to be granted to reach it',
      ROUTED.every((m) => hasPermission(afterUser, m.key))
    );
    ok('My Account is reachable', canAccessPath(afterUser, '/user'));
    ok('Settings is reachable', canAccessPath(afterUser, '/settings'));
    ok('User Management is reachable', hasPermission(afterUser, 'user-management'));

    // the same holds after a fresh sign in with the new password
    const relogin = await call('/auth/login', {
      method: 'POST',
      body: { username: 'FIRSTADMIN', password: 'NewAdmin123' },
    });
    ok('sign in with the new password works', relogin.status === 200, relogin.data.error);
    ok('no second password change is demanded', relogin.data.user.mustChangePassword === false);
    ok(
      'full access survives signing in again',
      visibleMenus(relogin.data.user).length === ROUTED.length,
      `${visibleMenus(relogin.data.user).length}/${ROUTED.length}`
    );

    // ---------- step 4: now a staff member is added, and permissions apply
    const adminToken = relogin.data.token;
    const staff = await call('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        username: 'FIRSTSTAFF',
        password: 'Staff1234',
        fullName: 'Counter Staff',
        role: 'staff',
        permissions: ['dashboard', 'token'],
      },
    });
    ok('administrator adds the first staff account', staff.status === 201, staff.data.error);
    // track API-created rows by id so cleanup never has to guess a pattern
    if (staff.data.user?.id) created.push(staff.data.user.id);

    const staffLogin = await call('/auth/login', {
      method: 'POST',
      body: { username: 'FIRSTSTAFF', password: 'Staff1234' },
    });
    const staffUser = staffLogin.data.user;
    ok(
      'staff is limited to the granted menus',
      JSON.stringify(visibleMenus(staffUser).map((m) => m.key)) === '["dashboard","token"]',
      JSON.stringify(visibleMenus(staffUser).map((m) => m.key))
    );
    ok('staff cannot reach user management', (await call('/users', { token: staffLogin.data.token })).status === 403);

    // the administrator is still unrestricted after all that
    const adminAgain = await call('/auth/me', { token: adminToken });
    ok(
      'administrator is still unrestricted after adding staff',
      visibleMenus(adminAgain.data.user).length === ROUTED.length,
      `${visibleMenus(adminAgain.data.user).length}/${ROUTED.length}`
    );
  } catch (err) {
    console.error('ERR', err);
    fail++;
  } finally {
    for (const id of created) if (id) await pool.query('DELETE FROM users WHERE id = $1', [id]);
    server.close();
    await pool.end();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
