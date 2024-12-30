const handleDatabaseError = (err, res, customMessage = "Internal server error") => {
  return res.status(500).json({ error: customMessage });
};

module.exports = { handleDatabaseError };
