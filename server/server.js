require('dotenv').config();
const { app, startServer } = require('./src/app');
const { pool } = require('./src/config/database');

const PORT = process.env.PORT;
let server;

const shutdown = async (signal) => {
  try {
    // Close server first
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Close database connections
    await pool.end();

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle different termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('UNHANDLED_REJECTION');
});

// Start the server
startServer()
  .then(serverInstance => {
    server = serverInstance;
  })
  .catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

// Export the app for use in other parts of the application
module.exports = app;