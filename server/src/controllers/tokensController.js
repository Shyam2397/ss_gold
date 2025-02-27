const { pool } = require('../config/database');
const { handleDatabaseError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

const DATA_DIR = path.join(__dirname, '../../../data');
const EXCEL_FILE = path.join(DATA_DIR, 'tokens.xlsx');
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
      id: null,
      token_no: null,
      date: null,
      time: null,
      code: null,
      name: null,
      test: null,
      weight: null,
      sample: null,
      amount: null,
      is_paid: null
    }
  ];
  writeExcelFile(initialData).catch(err => {
    console.error('Error initializing Excel file:', err);
  });
}

// Add payment status column if it doesn't exist
const initializeTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        token_no VARCHAR(50) UNIQUE NOT NULL,
        date DATE,
        time TIME,
        code VARCHAR(50),
        name VARCHAR(100),
        test VARCHAR(100),
        weight DECIMAL(10, 2),
        sample VARCHAR(100),
        amount DECIMAL(10, 2),
        is_paid INTEGER DEFAULT 0
      );
    `);
  } catch (err) {
    console.error('Error initializing tokens table:', err);
    throw err;
  }
};

// Initialize table but don't block module loading
(async () => {
  try {
    await initializeTable();
  } catch (err) {
    console.error('Failed to initialize tokens table:', err);
    // Don't throw here, let the application continue
  }
})();

const getAllTokens = async (req, res) => {
  try {
    const data = await readExcelFile();
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from worker');
    }

    const transformedData = data.map(row => ({
      id: row.id,
      tokenNo: row.token_no || row.tokenNo,
      date: row.date,
      time: row.time,
      code: row.code,
      name: row.name,
      test: row.test,
      weight: row.weight,
      sample: row.sample,
      amount: row.amount,
      isPaid: row.is_paid || row.isPaid || 0
    })).sort((a, b) => b.id - a.id); // Sort by id descending

    res.json(transformedData);
  } catch (err) {
    console.error('Error in getAllTokens:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTokenByNumber = async (req, res) => {
  try {
    const data = await readExcelFile();
    const token = data.find(row => 
      (row.token_no || row.tokenNo) === req.params.tokenNo
    );
    
    if (!token) {
      return res.status(404).json({ 
        success: false, 
        message: 'Token not found' 
      });
    }

    const transformedRow = {
      id: token.id,
      tokenNo: token.token_no || token.tokenNo,
      date: token.date,
      time: token.time,
      code: token.code,
      name: token.name,
      test: token.test,
      weight: token.weight,
      sample: token.sample,
      amount: token.amount,
      isPaid: token.is_paid || token.isPaid || 0
    };

    res.json({ success: true, data: transformedRow });
  } catch (err) {
    console.error('Error in getTokenByNumber:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createToken = async (req, res) => {
  try {
    const data = await readExcelFile();
    const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
    
    // Check for duplicate token number
    if (data.some(t => (t.token_no || t.tokenNo) === tokenNo)) {
      return res.status(400).json({ 
        success: false, 
        error: "Token number already exists" 
      });
    }

    const newToken = {
      id: data.length > 0 ? Math.max(...data.map(t => t.id)) + 1 : 1,
      token_no: tokenNo,
      date,
      time,
      code,
      name,
      test,
      weight,
      sample,
      amount,
      is_paid: 0
    };

    data.push(newToken);
    await writeExcelFile(data);

    const transformedRow = {
      id: newToken.id,
      tokenNo: newToken.token_no,
      date: newToken.date,
      time: newToken.time,
      code: newToken.code,
      name: newToken.name,
      test: newToken.test,
      weight: newToken.weight,
      sample: newToken.sample,
      amount: newToken.amount,
      isPaid: newToken.is_paid
    };

    res.status(201).json(transformedRow);
  } catch (err) {
    console.error('Error in createToken:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateToken = async (req, res) => {
  try {
    const data = await readExcelFile();
    const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
    const id = parseInt(req.params.id);

    const tokenIndex = data.findIndex(t => t.id === id);
    if (tokenIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: "Token not found" 
      });
    }

    // Check for duplicate token number
    if (data.some(t => (t.token_no || t.tokenNo) === tokenNo && t.id !== id)) {
      return res.status(400).json({ 
        success: false, 
        error: "Token number already exists" 
      });
    }

    data[tokenIndex] = {
      ...data[tokenIndex],
      token_no: tokenNo,
      date,
      time,
      code,
      name,
      test,
      weight,
      sample,
      amount
    };

    await writeExcelFile(data);

    const transformedRow = {
      id: data[tokenIndex].id,
      tokenNo: data[tokenIndex].token_no,
      date: data[tokenIndex].date,
      time: data[tokenIndex].time,
      code: data[tokenIndex].code,
      name: data[tokenIndex].name,
      test: data[tokenIndex].test,
      weight: data[tokenIndex].weight,
      sample: data[tokenIndex].sample,
      amount: data[tokenIndex].amount,
      isPaid: data[tokenIndex].is_paid || data[tokenIndex].isPaid || 0
    };

    res.status(200).json({ success: true, data: transformedRow });
  } catch (err) {
    console.error('Error in updateToken:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const data = await readExcelFile();
    const { isPaid } = req.body;
    const id = parseInt(req.params.id);

    const tokenIndex = data.findIndex(t => t.id === id);
    if (tokenIndex === -1) {
      return res.status(404).json({ error: "Token not found" });
    }

    data[tokenIndex].is_paid = isPaid ? 1 : 0;
    await writeExcelFile(data);

    const transformedRow = {
      id: data[tokenIndex].id,
      tokenNo: data[tokenIndex].token_no,
      date: data[tokenIndex].date,
      time: data[tokenIndex].time,
      code: data[tokenIndex].code,
      name: data[tokenIndex].name,
      test: data[tokenIndex].test,
      weight: data[tokenIndex].weight,
      sample: data[tokenIndex].sample,
      amount: data[tokenIndex].amount,
      isPaid: data[tokenIndex].is_paid
    };

    res.status(200).json({ updatedID: 1, token: transformedRow });
  } catch (err) {
    console.error('Error in updatePaymentStatus:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteToken = async (req, res) => {
  try {
    const data = await readExcelFile();
    const id = parseInt(req.params.id);

    const tokenIndex = data.findIndex(t => t.id === id);
    if (tokenIndex === -1) {
      return res.status(404).json({ error: "Token not found" });
    }

    const deletedToken = data[tokenIndex];
    data.splice(tokenIndex, 1);
    await writeExcelFile(data);

    const transformedRow = {
      id: deletedToken.id,
      tokenNo: deletedToken.token_no,
      date: deletedToken.date,
      time: deletedToken.time,
      code: deletedToken.code,
      name: deletedToken.name,
      test: deletedToken.test,
      weight: deletedToken.weight,
      sample: deletedToken.sample,
      amount: deletedToken.amount,
      isPaid: deletedToken.is_paid || deletedToken.isPaid || 0
    };

    res.status(200).json({ deletedID: 1, token: transformedRow });
  } catch (err) {
    console.error('Error in deleteToken:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const generateTokenNumber = async (req, res) => {
  try {
    const data = await readExcelFile();
    
    let nextTokenNo;
    if (!data || data.length === 0 || !data.some(t => t.token_no || t.tokenNo)) {
      nextTokenNo = "A1";
    } else {
      const validTokens = data.filter(token => token && (token.token_no || token.tokenNo));
      const lastToken = validTokens.reduce((max, token) => 
        (!max || token.id > max.id) ? token : max, null);
      
      if (!lastToken) {
        nextTokenNo = "A1";
      } else {
        const currentToken = (lastToken.token_no || lastToken.tokenNo || "").toString();
        const match = currentToken.match(/^([A-Z])(\d+)$/);
        
        if (!match) {
          nextTokenNo = "A1";
        } else {
          const letter = match[1];
          const number = parseInt(match[2]);
          
          if (number >= 999) {
            if (letter === 'Z') {
              return res.status(400).json({ 
                error: "Token number limit reached. Please contact administrator." 
              });
            }
            nextTokenNo = `${String.fromCharCode(letter.charCodeAt(0) + 1)}1`;
          } else {
            nextTokenNo = `${letter}${number + 1}`;
          }
        }
      }
    }

    if (data && data.some(t => (t.token_no || t.tokenNo) === nextTokenNo)) {
      return res.status(409).json({ 
        error: "Generated token number already exists. Please try again." 
      });
    }

    res.json({ tokenNo: nextTokenNo });
  } catch (err) {
    console.error('Error in generateTokenNumber:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Enhanced cleanup
process.on('exit', () => {
  if (worker) {
    worker.terminate();
  }
});

process.on('SIGINT', () => {
  if (worker) {
    worker.terminate();
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (worker) {
    worker.terminate();
  }
  process.exit(1);
});

module.exports = {
  getAllTokens,
  getTokenByNumber,
  createToken,
  updateToken,
  updatePaymentStatus,
  deleteToken,
  generateTokenNumber
};
