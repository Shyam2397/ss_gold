const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeTables } = require('./models/tables');
const { pool } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const entriesRoutes = require('./routes/entriesRoutes');
const tokensRoutes = require('./routes/tokensRoutes');
const skinTestsRoutes = require('./routes/skinTestsRoutes');
const expenseMasterRoutes = require('./routes/expenseMaster');
const expensesRoutes = require('./routes/expensesRoutes');
const pureExchangeRoutes = require('./routes/pureExchangeRoutes');

const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'unhealthy',
      database: 'disconnected',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Database connection error'
    });
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Successfully connected to PostgreSQL database');

    // Initialize database tables
    await initializeTables();
    console.log('Database tables initialized successfully');

    // Routes
    app.use('/auth', authRoutes);
    app.use('/entries', entriesRoutes);
    app.use('/tokens', tokensRoutes);
    app.use('/skin-tests', skinTestsRoutes);
    app.use('/api/expense-master', expenseMasterRoutes);
    app.use('/api/expenses', expensesRoutes);
    app.use('/pure-exchange', pureExchangeRoutes);

    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Health check available at http://localhost:${port}/health`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development mode: Detailed error messages enabled`);
      }
    });

    return server;
  } catch (error) {
    console.error('Error starting server:', error);
    throw error;
  }
};

// Start the server
if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, startServer };
