const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeTables } = require('./models/tables');

// Import routes
const authRoutes = require('./routes/authRoutes');
const entriesRoutes = require('./routes/entriesRoutes');
const tokensRoutes = require('./routes/tokensRoutes');
const skinTestsRoutes = require('./routes/skinTestsRoutes');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database tables
initializeTables();

// Routes
app.use('/auth', authRoutes);
app.use('/entries', entriesRoutes);
app.use('/tokens', tokensRoutes);
app.use('/skin_tests', skinTestsRoutes);

app.listen(port, () => {
  // Server is running
});

module.exports = app;
