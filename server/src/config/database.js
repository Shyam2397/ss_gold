const { Pool } = require('pg');

const defaultConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gold_testing',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  // Increase connection timeout and add retry settings
  connectionTimeoutMillis: 30000, // 30 seconds
  idleTimeoutMillis: 60000, // 1 minute
  max: 10, // Reduce max connections
  min: 1, // Minimum connections
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  // Enable automatic reconnection
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
};

const pool = new Pool(defaultConfig);

// Connection management
let isConnected = false;
const maxRetries = 5;
const retryInterval = 5000;

async function ensureConnection() {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      if (!isConnected) {
        const client = await pool.connect();
        client.release();
        isConnected = true;
        console.log('Database connection established');
        return true;
      }
      return true;
    } catch (err) {
      retries++;
      console.error(`Connection attempt ${retries} failed:`, err.message);
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
  throw new Error('Failed to connect to database after multiple attempts');
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  isConnected = false;
});

module.exports = {
  pool,
  ensureConnection
};
