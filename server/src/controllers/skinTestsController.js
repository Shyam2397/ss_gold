const { pool } = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');
const { readExcelData, writeExcelData } = require('../utils/excelUtils');

const getAllSkinTests = async (req, res) => {
    try {
        const skinTests = await readExcelData();
        const processedRows = await Promise.all(skinTests.map(async (row) => {
            try {
                const entryResult = await pool.query(
                    "SELECT phoneNumber FROM entries WHERE code = $1",
                    [row.code]
                );
                return { ...row, phoneNumber: entryResult.rows[0]?.phoneNumber || null };
            } catch (err) {
                return { ...row, phoneNumber: null };
            }
        }));
        res.json({ data: processedRows });
    } catch (error) {
        console.error('Error in getAllSkinTests:', error);
        res.status(500).json({ error: 'Failed to retrieve skin tests', details: error.message });
    }
};

const createSkinTest = async (req, res) => {
    try {
        const data = req.body;
        const existingData = await readExcelData();
        
        // Check if token number already exists
        if (existingData.some(row => row.tokenNo === data.tokenNo)) {
            return res.status(400).json({ error: "Token number already exists" });
        }

        const processedData = Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = String(value || (key === 'weight' || key.includes('_') ? '0' : ''));
            return acc;
        }, {});

        existingData.push(processedData);
        await writeExcelData(existingData);

        res.json({ message: "Success", data: processedData });
    } catch (error) {
        console.error('Error in createSkinTest:', error);
        res.status(500).json({ 
            error: 'Failed to create skin test',
            details: error.message 
        });
    }
};

const updateSkinTest = async (req, res) => {
    try {
        const data = req.body;
        const { tokenNo } = req.params;
        const existingData = await readExcelData();
        
        const index = existingData.findIndex(row => row.tokenNo === tokenNo);
        if (index === -1) {
            return res.status(404).json({ error: "Skin test not found" });
        }

        existingData[index] = { ...existingData[index], ...data };
        await writeExcelData(existingData);

        res.json({ message: "Success", data: existingData[index] });
    } catch (error) {
        console.error('Error in updateSkinTest:', error);
        res.status(500).json({ 
            error: 'Failed to update skin test',
            details: error.message 
        });
    }
};

const deleteSkinTest = async (req, res) => {
    try {
        const { tokenNo } = req.params;
        const existingData = await readExcelData();
        
        const index = existingData.findIndex(row => row.tokenNo === tokenNo);
        if (index === -1) {
            return res.status(404).json({ error: "Skin test not found" });
        }

        const deletedRow = existingData[index];
        existingData.splice(index, 1);
        await writeExcelData(existingData);

        res.json({ message: "Deleted", data: deletedRow });
    } catch (error) {
        console.error('Error in deleteSkinTest:', error);
        res.status(500).json({ 
            error: 'Failed to delete skin test',
            details: error.message 
        });
    }
};

// Keep the original database-based implementation
const getPhoneNumberByCode = async (req, res) => {
    const { code } = req.params;
  
    try {
      const result = await pool.query(
        "SELECT phoneNumber FROM entries WHERE code = $1",
        [code]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Code not found" });
      }
      
      res.json({ phoneNumber: result.rows[0].phoneNumber });
    } catch (err) {
      return handleDatabaseError(err, res, "Failed to retrieve phone number");
    }
};

const resetSkinTests = async (req, res) => {
    try {
        await writeExcelData([]);
        res.json({ message: "Skin tests have been reset" });
    } catch (error) {
        console.error('Error in resetSkinTests:', error);
        res.status(500).json({ error: 'Failed to reset skin tests' });
    }
};

module.exports = {
    getAllSkinTests,
    createSkinTest,
    updateSkinTest,
    deleteSkinTest,
    getPhoneNumberByCode,
    resetSkinTests
};
