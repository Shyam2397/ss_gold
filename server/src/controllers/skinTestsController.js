const { pool } = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

const DATA_DIR = path.join(__dirname, '../../../data');
const EXCEL_FILE = path.join(DATA_DIR, 'skin_tests.xlsx');
const WORKER_FILE = path.join(__dirname, '../workers/excelWorker.js');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Worker management with error handling
let worker = null;
let isWorkerBusy = false;

const createWorker = () => {
  try {
    const newWorker = new Worker(WORKER_FILE);
    
    newWorker.on('error', (error) => {
      console.error('Worker error:', error);
      if (worker === newWorker) {
        worker = null;
        isWorkerBusy = false;
      }
    });

    newWorker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      if (worker === newWorker) {
        worker = null;
        isWorkerBusy = false;
      }
    });

    return newWorker;
  } catch (error) {
    console.error('Failed to create worker:', error);
    return null;
  }
};

const getWorker = () => {
  if (!worker && !isWorkerBusy) {
    worker = createWorker();
  }
  return worker;
};

const executeWorkerTask = (type, data = null) => {
  return new Promise((resolve, reject) => {
    const currentWorker = getWorker();
    
    if (!currentWorker) {
      return reject(new Error('Worker initialization failed'));
    }

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Worker operation timed out'));
    }, 30000); // 30 second timeout

    const cleanup = () => {
      clearTimeout(timeout);
      currentWorker.removeListener('message', handleMessage);
      currentWorker.removeListener('error', handleError);
      isWorkerBusy = false;
    };

    const handleMessage = (message) => {
      if (message.type === `${type}_SUCCESS`) {
        cleanup();
        resolve(message.data);
      } else if (message.type === 'ERROR') {
        cleanup();
        reject(new Error(message.error));
      }
    };

    const handleError = (error) => {
      cleanup();
      reject(error);
    };

    currentWorker.on('message', handleMessage);
    currentWorker.on('error', handleError);
    
    isWorkerBusy = true;
    currentWorker.postMessage({ 
      type, 
      data, 
      filePath: EXCEL_FILE 
    });
  });
};

// Helper functions using the new worker execution
const readExcelFile = () => executeWorkerTask('READ');
const writeExcelFile = (data) => executeWorkerTask('WRITE', data);

// Initialize Excel file if it doesn't exist
if (!fs.existsSync(EXCEL_FILE)) {
  const initialData = [
    {
      tokenNo: null,
      date: null,
      time: null,
      name: null,
      weight: null,
      sample: null,
      highest: null,
      average: null,
      gold_fineness: null,
      karat: null,
      silver: null,
      copper: null,
      zinc: null,
      cadmium: null,
      nickel: null,
      tungsten: null,
      iridium: null,
      ruthenium: null,
      osmium: null,
      rhodium: null,
      rhenium: null,
      indium: null,
      titanium: null,
      palladium: null,
      platinum: null,
      others: null,
      remarks: null,
      code: null,
      phoneNumber: null
    }
  ];
  writeExcelFile(initialData).catch(err => {
    console.error('Error initializing Excel file:', err);
  });
}

const getAllSkinTests = async (req, res) => {
    try {
        const skinTests = await readExcelFile();
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
        const existingData = await readExcelFile();
        
        // Check if token number already exists
        if (existingData.some(row => row.tokenNo === data.tokenNo)) {
            return res.status(400).json({ error: "Token number already exists" });
        }

        const processedData = Object.entries(data).reduce((acc, [key, value]) => {
            acc[key] = String(value || (key === 'weight' || key.includes('_') ? '0' : ''));
            return acc;
        }, {});

        existingData.push(processedData);
        await writeExcelFile(existingData);

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
        const existingData = await readExcelFile();
        
        const index = existingData.findIndex(row => row.tokenNo === tokenNo);
        if (index === -1) {
            return res.status(404).json({ error: "Skin test not found" });
        }

        existingData[index] = { ...existingData[index], ...data };
        await writeExcelFile(existingData);

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
        const existingData = await readExcelFile();
        
        const index = existingData.findIndex(row => row.tokenNo === tokenNo);
        if (index === -1) {
            return res.status(404).json({ error: "Skin test not found" });
        }

        const deletedRow = existingData[index];
        existingData.splice(index, 1);
        await writeExcelFile(existingData);

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
        await writeExcelFile([]);
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
