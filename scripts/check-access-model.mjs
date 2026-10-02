// Verifies the intended rollout: the first-install administrator sees everything,
// and permissions only start mattering for staff added afterwards.
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

const PORT = 5097;
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

const insert = async (username, role, permissions) => {
  const hash = await bcrypt.hash('TempPass1', 10);
  const r = await pool.query(
    `INSERT INTO users (username, password, full_name, role, permissions, is_active, must_change_password)
     VALUES ($1,$2,$3,$4,$5,TRUE,FALSE) RETURNING id`,
    [username, hash, username, role, JSON.stringify(permissions)]
  );
  created.push(r.rows[0].id);
  return r.rows[0].id;
};

const visibleMenus = (user) => MENU_DEFINITIONS.filter((m) => canAccessPath(user, m.path));

(async () => {
  const server = app.listen(PORT);
  await new Promise((r) => server.once('listening', r));

  try {
    // --- the account created on a fresh install really is an unrestricted admin
    const seed = await pool.query(
      "SELECT username, role, permissions, is_active FROM users WHERE username = 'ADMIN'"
    );
    const row = seed.rows[0];
    ok('first-install account exists', Boolean(row), row?.username);
    ok('first-install account has the admin role', row?.role === 'admin', row?.role);
    ok('first-install account stores no permission list', row?.permissions === '[]', row?.permissions);

    // Step 1: administrator alone on a fresh install
    const adminId = await insert('FLOW_ADMIN', 'admin', []);
    const adminLogin = await call('/auth/login', {
      method: 'POST',
      body: { username: 'FLOW_ADMIN', password: 'TempPass1' },
    });
    ok('administrator signs in', adminLogin.status === 200);
    const adminToken = adminLogin.data.token;
    const adminUser = adminLogin.data.user;

    ok('administrator gets an empty permission list', JSON.stringify(adminUser.permissions) === '[]');
    ok(
      'administrator can open every menu',
      visibleMenus(adminUser).length === MENU_DEFINITIONS.filter((m) => m.path).length,
      `${visibleMenus(adminUser).length}/${MENU_DEFINITIONS.filter((m) => m.path).length}`
    );

    // Step 2: administrator adds the first staff member
    const created1 = await call('/users', {
      method: 'POST',
      token: adminToken,
      body: {
        username: 'FLOW_STAFF',
        password: 'Staff1234',
        fullName: 'Counter Staff',
        role: 'staff',
        permissions: ['dashboard', 'token'],
      },
    });
    ok('administrator adds a staff account', created1.status === 201, created1.data.error);
    if (created1.data.user?.id) created.push(created1.data.user.id);
    const staffLogin = await call('/auth/login', {
      method: 'POST',
      body: { username: 'FLOW_STAFF', password: 'Staff1234' },
    });
    ok('staff signs in', staffLogin.status === 200);
    const staffUser = staffLogin.data.user;

    ok(
      'staff sees only the granted menus',
      JSON.stringify(visibleMenus(staffUser).map((m) => m.key)) === '["dashboard","token"]',
      JSON.stringify(visibleMenus(staffUser).map((m) => m.key))
    );
    ok('staff is blocked from the admin-only Users tab', !hasPermission(staffUser, 'user-management'));
    ok('staff cannot reach user management', (await call('/users', { token: staffLogin.data.token })).status === 403);

    // Step 3: permissions widened for staff, administrator untouched
    await call('/users/' + created1.data.user.id, {
      method: 'PUT',
      token: adminToken,
      body: { permissions: ['dashboard', 'token', 'cashbook'] },
    });
    const widened = await call('/auth/login', {
      method: 'POST',
      body: { username: 'FLOW_STAFF', password: 'Staff1234' },
    });
    ok(
      'widened permissions take effect for staff',
      JSON.stringify(visibleMenus(widened.data.user).map((m) => m.key)) === '["dashboard","token","cashbook"]',
      JSON.stringify(visibleMenus(widened.data.user).map((m) => m.key))
    );

    const adminStill = await call('/auth/me', { token: adminToken });
    ok(
      'administrator still sees every menu after staff permissions change',
      visibleMenus(adminStill.data.user).length === MENU_DEFINITIONS.filter((m) => m.path).length
    );

    // Step 4: promoting staff to administrator restores full access immediately
    await call('/users/' + created1.data.user.id, {
      method: 'PUT',
      token: adminToken,
      body: { role: 'admin' },
    });
    const promoted = await call('/auth/login', {
      method: 'POST',
      body: { username: 'FLOW_STAFF', password: 'Staff1234' },
    });
    ok(
      'promoted account regains full access',
      visibleMenus(promoted.data.user).length === MENU_DEFINITIONS.filter((m) => m.path).length,
      `${visibleMenus(promoted.data.user).length} menus`
    );
    ok('promoted account keeps an empty permission list', JSON.stringify(promoted.data.user.permissions) === '[]');
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
