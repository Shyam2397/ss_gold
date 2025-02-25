const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Add date formatting helpers
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // Try parsing DD-MM-YYYY format
      const [day, month, year] = dateString.split('-');
      if (day && month && year) {
        date = new Date(year, month - 1, day);
      }
    }
    
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

// Define the Excel file path
const DATA_DIR = path.join(__dirname, '../../../data');
const EXCEL_FILE = path.join(DATA_DIR, 'tokens.xlsx');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Modify the read helper to format dates
const readExcelFile = () => {
  if (!fs.existsSync(EXCEL_FILE)) {
    return [];
  }
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Format dates in the data
  return data.map(row => ({
    ...row,
    date: formatDate(row.date)
  }));
};

// Helper function to write Excel file
const writeExcelFile = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tokens');
  XLSX.writeFile(workbook, EXCEL_FILE);
};

const getAllTokens = async (req, res) => {
  try {
    const data = readExcelFile();
    const transformedData = data.map(row => ({
      id: row.id,
      tokenNo: row.token_no,
      date: row.date,
      time: row.time,
      code: row.code,
      name: row.name,
      test: row.test,
      weight: row.weight,
      sample: row.sample,
      amount: row.amount,
      isPaid: row.is_paid
    }));
    res.json(transformedData);
  } catch (err) {
    console.error('Error in getAllTokens:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTokenByNumber = async (req, res) => {
  try {
    const data = readExcelFile();
    const token = data.find(row => row.token_no === req.params.tokenNo);
    
    if (!token) {
      return res.status(404).json({ success: false, message: 'Token not found' });
    }

    const transformedRow = {
      id: token.id,
      tokenNo: token.token_no,
      date: token.date,
      time: token.time,
      code: token.code,
      name: token.name,
      test: token.test,
      weight: token.weight,
      sample: token.sample,
      amount: token.amount,
      isPaid: token.is_paid
    };

    res.json({ success: true, data: transformedRow });
  } catch (err) {
    console.error('Error in getTokenByNumber:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Modify createToken to format date
const createToken = async (req, res) => {
  try {
    const data = readExcelFile();
    const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
    
    const newToken = {
      id: data.length > 0 ? Math.max(...data.map(t => t.id)) + 1 : 1,
      token_no: tokenNo,
      date: formatDate(date),
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
    writeExcelFile(data);

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

// Modify updateToken to format date
const updateToken = async (req, res) => {
  try {
    const data = readExcelFile();
    const { tokenNo, date, time, code, name, test, weight, sample, amount } = req.body;
    const id = parseInt(req.params.id);

    const tokenIndex = data.findIndex(t => t.id === id);
    if (tokenIndex === -1) {
      return res.status(404).json({ success: false, error: "Token not found" });
    }

    // Check for duplicate token number
    if (data.some(t => t.token_no === tokenNo && t.id !== id)) {
      return res.status(400).json({ success: false, error: "Token number already exists" });
    }

    data[tokenIndex] = {
      ...data[tokenIndex],
      token_no: tokenNo,
      date: formatDate(date),
      time,
      code,
      name,
      test,
      weight,
      sample,
      amount
    };

    writeExcelFile(data);

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

    res.status(200).json({ success: true, data: transformedRow });
  } catch (err) {
    console.error('Error in updateToken:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const data = readExcelFile();
    const { isPaid } = req.body;
    const id = parseInt(req.params.id);

    const tokenIndex = data.findIndex(t => t.id === id);
    if (tokenIndex === -1) {
      return res.status(404).json({ error: "Token not found" });
    }

    data[tokenIndex].is_paid = isPaid ? 1 : 0;
    writeExcelFile(data);

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
     const data = readExcelFile();
    const id = parseInt(req.params.id);

    const tokenIndex = data.findIndex(t => t.id === id);
    if (tokenIndex === -1) {
      return res.status(404).json({ error: "Token not found" });
    }

    const deletedToken = data[tokenIndex];
    data.splice(tokenIndex, 1);
    writeExcelFile(data);

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
      isPaid: deletedToken.is_paid
    };

    res.status(200).json({ deletedID: 1, token: transformedRow });
  } catch (err) {
    console.error('Error in deleteToken:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const generateTokenNumber = async (req, res) => {
  try {
    const data = readExcelFile();
    
    let nextTokenNo;
    if (data.length === 0) {
      nextTokenNo = "A1";
    } else {
      const currentToken = data[data.length - 1].token_no.toString();
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

    if (data.some(t => t.token_no === nextTokenNo)) {
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

module.exports = {
  getAllTokens,
  getTokenByNumber,
  createToken,
  updateToken,
  updatePaymentStatus,
  deleteToken,
  generateTokenNumber
};
