const pool = require('../config/database');

const checkDatabaseConnection = async () => {
  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')"
    );
    return result.rows[0].exists;
  } catch (err) {
    throw err;
  }
};

const listUsers = async () => {
  try {
    const result = await pool.query("SELECT username FROM users");
    return result.rows;
  } catch (err) {
    throw err;
  }
};

const checkTableExists = async (tableName) => {
  try {
    const result = await pool.query(
      'SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)',
      [tableName]
    );
    return result.rows[0].exists;
  } catch (err) {
    throw err;
  }
};

const getTableInfo = async (tableName) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);
    return result.rows;
  } catch (err) {
    throw err;
  }
};

const runMigration = async (migrationQuery, params = []) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(migrationQuery, params);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const healthCheck = async () => {
  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - start;
    
    const connectionCount = await pool.query(`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      connections: connectionCount.rows[0].count,
      maxConnections: pool.totalCount,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    throw err;
  }
};

module.exports = {
  checkDatabaseConnection,
  listUsers,
  checkTableExists,
  getTableInfo,
  runMigration,
  healthCheck
};
