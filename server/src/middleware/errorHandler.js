const handleDatabaseError = (err, res, customMessage = "Internal server error") => {
  console.error('Database error:', err);

  // PostgreSQL error codes
  switch (err.code) {
    case '23505': // unique_violation
      return res.status(409).json({
        error: 'Duplicate entry found',
        detail: err.detail
      });

    case '23503': // foreign_key_violation
      return res.status(409).json({
        error: 'Referenced record not found',
        detail: err.detail
      });

    case '23502': // not_null_violation
      return res.status(400).json({
        error: 'Required field missing',
        detail: err.detail
      });

    case '22P02': // invalid_text_representation
      return res.status(400).json({
        error: 'Invalid data format',
        detail: err.detail
      });

    case '28P01': // invalid_password
      return res.status(401).json({
        error: 'Authentication failed',
        detail: 'Invalid credentials'
      });

    case '42P01': // undefined_table
      return res.status(500).json({
        error: 'Database configuration error',
        detail: 'Table not found'
      });

    case '42703': // undefined_column
      return res.status(400).json({
        error: 'Invalid field reference',
        detail: err.detail
      });

    case '08006': // connection_failure
    case '08001': // sqlclient_unable_to_establish_sqlconnection
      return res.status(503).json({
        error: 'Database connection error',
        detail: 'Unable to connect to database'
      });

    default:
      // Log the full error for debugging but send a sanitized response
      return res.status(500).json({
        error: customMessage,
        detail: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
  }
};

module.exports = { handleDatabaseError };
