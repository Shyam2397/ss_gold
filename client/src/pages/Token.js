import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FiUser,
  FiHash,
  FiClock,
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPrinter,
  FiSave,
  FiRotateCcw,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { BsReceipt } from "react-icons/bs";
import logoPath from '../assets/logo.png';
import loadImage from 'blueimp-load-image';

const FormField = ({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  readOnly = false,
  required = false,
  step,
}) => (
  <div className="form-control w-full">
    <label className="block text-sm font-medium text-amber-900 mb-1">
      {label}
    </label>
    <div className="relative rounded-md shadow-sm">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-amber-400" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        required={required}
        step={step}
        className={`w-full ${
          Icon ? "pl-10" : "pl-4"
        } pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
          readOnly ? "bg-amber-50" : ""
        }`}
      />
    </div>
  </div>
);

const FormSelect = ({ label, value, onChange, options }) => (
  <div className="form-control w-full">
    <label className="block text-sm font-medium text-amber-900 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full pl-4 pr-10 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const TokenTable = ({ tokens, onEdit, onDelete }) => (
  <div className="overflow-hidden rounded-lg border border-amber-100">
    <div className="overflow-x-auto">
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
        <table className="min-w-full divide-y divide-amber-200">
          <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
            <tr>
              {[
                "Actions",
                "Token No",
                "Date",
                "Time",
                "Code",
                "Name",
                "Test",
                "Weight",
                "Sample",
                "Amount",
              ].map((header) => (
                <th
                  key={header}
                  className="px-6 py-2 text-left text-sm font-medium text-white uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-amber-100">
            {tokens.map((token) => (
              <motion.tr
                key={token.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-amber-50 transition-colors duration-200"
              >
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(token)}
                      className="text-amber-600 hover:text-amber-900 transition-colors duration-200"
                    >
                      <FiEdit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(token.id)}
                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                    >
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.tokenNo}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.date}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.time}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.code}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.name}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.test}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.weight}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.sample}
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  {token.amount}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const TokenPage = () => {
  const [code, setCode] = useState("");
  const [tokenNo, setTokenNo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [test, setTest] = useState("Skin Testing");
  const [weight, setWeight] = useState("");
  const [sample, setSample] = useState("");
  const [amount, setAmount] = useState("50");
  const [tokens, setTokens] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    tokenId: null
  });

  // Add state for message timeout duration
  const MESSAGE_TIMEOUT = 5000; // 5 seconds

  useEffect(() => {
    fetchTokens();
    generateTokenNumber();
    getCurrentDateTime();
  }, []);

  useEffect(() => {
    setFilteredTokens(
      tokens.filter((token) =>
        Object.values(token)
          .join(" ")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, tokens]);

  useEffect(() => {
    let successTimer;

    if (success) {
      successTimer = setTimeout(() => {
        setSuccess("");
      }, MESSAGE_TIMEOUT);
    }

    return () => {
      if (successTimer) clearTimeout(successTimer);
    };
  }, [success]);

  const generateTokenNumber = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/generateTokenNo`
      );
      setTokenNo(response.data.tokenNo);
    } catch (error) {
      setError("Failed to generate token number");
    }
  };

  const getCurrentDateTime = () => {
    const currentDate = new Date();
    const formattedDate = currentDate
      .toLocaleDateString("en-GB")
      .split("/")
      .join("-");
    const formattedTime = currentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setDate(formattedDate);
    setTime(formattedTime);
  };

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/tokens`
      );
      setTokens(response.data);
    } catch (error) {
      setError("Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = async (e) => {
    const inputCode = e.target.value;
    setCode(inputCode);
    setError("");

    if (inputCode.length === 4) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/entries/${inputCode}`
        );
        setName(response.data.name || "Not Found");
      } catch (error) {
        setError("Failed to fetch name");
      }
    } else {
      setName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const tokenData = {
      tokenNo,
      date,
      time,
      code,
      name,
      test,
      weight: parseFloat(weight).toFixed(3),
      sample,
      amount,
    };

    try {
      if (editMode) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/tokens/${editId}`,
          tokenData
        );
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/tokens`, tokenData);
      }
      setEditMode(false);
      resetForm();
      fetchTokens();
      generateTokenNumber();
      setSuccess("Token saved successfully!");
    } catch (error) {
      setError("Failed to save token");
    }
  };

  const validateForm = () => {
    if (code.length !== 4 || isNaN(code)) {
      setError("Code must be a 4-digit number.");
      return false;
    }
    if (name === "Not Found") {
      setError("Name not found for the entered code.");
      return false;
    }
    if (weight <= 0) {
      setError("Weight must be a positive number.");
      return false;
    }
    if (!sample) {
      setError("Sample cannot be empty.");
      return false;
    }
    setError("");
    return true;
  };

  const handleEdit = (token) => {
    setEditMode(true);
    setEditId(token.id);
    setCode(token.code);
    setTokenNo(token.tokenNo);
    setDate(token.date);
    setTime(token.time);
    setName(token.name);
    setTest(token.test);
    setWeight(token.weight);
    setSample(token.sample);
    setAmount(token.amount);
  };

  const confirmDelete = (id) => {
    setDeleteConfirmation({
      isOpen: true,
      tokenId: id
    });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      tokenId: null
    });
  };

  const proceedDelete = async () => {
    if (!deleteConfirmation.tokenId) return;

    try {
      setLoading(true);
      await axios.delete(`${process.env.REACT_APP_API_URL}/tokens/${deleteConfirmation.tokenId}`);
      fetchTokens();
      generateTokenNumber();
      setError("");
      setSuccess("Token deleted successfully!");
    } catch (error) {
      setError("Failed to delete token");
    } finally {
      // Reset delete confirmation
      setDeleteConfirmation({
        isOpen: false,
        tokenId: null
      });
      setLoading(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setCode("");
    setName("");
    setTest("Skin Testing");
    setWeight("");
    setSample("");
    setAmount("50");
    setEditMode(false);
    setError("");
  };

  const preloadImages = (imagePaths) => {
    return Promise.all(
      imagePaths.map(path => 
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ path, img });
          img.onerror = reject;
          img.src = path;
        })
      )
    );
  };

  const convertImageToBase64 = (imagePath) => {
    return new Promise((resolve, reject) => {
      loadImage(
        imagePath,
        (canvas) => {
          resolve(canvas.toDataURL('image/png'));
        },
        {
          maxWidth: 1000, // Optional: limit max width
          maxHeight: 1000, // Optional: limit max height
          canvas: true,
          orientation: true
        }
      );
    });
  };

  const handlePrint = async () => {
    try {
      const imagesToPreload = [logoPath]; // Add other image paths if needed
      await preloadImages(imagesToPreload);

      const base64Logo = await convertImageToBase64(logoPath);
      
      const printContent = `
        <html>
          <head>
            <title>Token Receipt - SS GOLD</title>
            <style>
              @page { 
                size: 80mm auto; 
                margin: 0; 
              }
              body { 
                font-family: Arial, sans-serif; 
                max-width: 300px; 
                margin: 0 auto; 
                
              }
              .header { 
                text-align: center; 
                margin-bottom: 1px; 
                border-bottom: 1px solid black; 
                padding-bottom: 1px; 
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .logo-container {
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .logo {
                width: 30px;
                height: 30px;
                margin-right: 5px;
                object-fit: contain;
              }
              .header-text {
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .header-title {
                margin: 0;
                font-size: 20px;
                line-height: 1;
                vertical-align: middle;
              }
              .header-subtitle {
                margin: 1px 0;
                font-size: 12px;
              }
              .header-subtitle:nth-child(2) {
                font-size: 14px;
                font-weight: bold;
                margin: 1px 0;
              }
              .content { 
                margin-bottom: 1px;
                border-bottom: 1px dotted black; 
              }
              .row { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 3px; 
                font-size: 13px; 
              }
              .row span:first-child { 
                font-weight: medium;
                text-transform: uppercase;
                padding-left: 5px;
              }
              .row span:last-child {
                text-align: center;
                width: 50%;
              }
              
              .date-time {
                display: flex;
                justify-content: end;
                font-size: 11px;
                margin-bottom: 1px;
                border-bottom: 1px dotted black;
                padding-bottom: 1px;
              }
              .date-time span {
                margin-right: 5px;
              }
              .thank-you {
                text-align: center;
                font-size: 12px;
                margin: 1px 0;
                font-style: italic;
                font-family: 'Vivaldi', cursive;
              }
            </style>
          </head>
          <body>
            <div class="header">
            <div class="header-text">
            <div class="logo-container">
                ${base64Logo ? `<img src="${base64Logo}" alt="SS GOLD Logo" class="logo" />` : ''}
                <h1 class="header-title">SS GOLD</h1>
              </div>
                <p class="header-subtitle">Computer X-ray Testing</p>
                  <p class="header-subtitle">59, Main Bazaar, Nilakottai - 624208</p>
                  <p class="header-subtitle">Ph.No: 8903225544</p>
                </div>        
            </div>
            <div class="date-time">
              <span>${date}</span>
              <span>${time}</span>
            </div>
            <div class="content">
              <div class="row">
                <span>Token No</span>
                <span>${tokenNo}</span>
              </div>
              
              <div class="row">
                <span>Name</span>
                <span>${name}</span>
              </div>
              <div class="row">
                <span>Test</span>
                <span>${test}</span>
              </div>
              <div class="row">
                <span>Weight</span>
                <span>${parseFloat(weight).toFixed(3)} g</span>
              </div>
              <div class="row">
                <span>Sample</span>
                <span>${sample}</span>
              </div>
              <div class="row">
                <span>Amount</span>
                <span>₹${amount}</span>
              </div>
            </div>
            <div class="thank-you">
            Thank You.... Visit Again....
            </div>
            
          </body>
        </html>
      `;

      const printWindow = window.open('', '', 'width=1200,height=600');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      console.error('Image conversion error:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BsReceipt className="w-8 h-8 text-amber-600 mr-3" />
            <h2 className="text-2xl font-bold text-amber-900">
              {editMode ? "Edit Token" : "New Token"}
            </h2>
          </div>
          {error && (
            <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="p-2 bg-green-50 border-l-4 border-green-500 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiCheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg">
            <FormField
              label="Token No"
              icon={FiHash}
              value={tokenNo}
              readOnly
              required
            />
            <FormField
              label="Date"
              icon={FiCalendar}
              value={date}
              readOnly
              required
            />
            <FormField
              label="Time"
              icon={FiClock}
              value={time}
              readOnly
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg">
            <FormField
              label="Code"
              icon={FiHash}
              value={code}
              onChange={handleCodeChange}
              required
            />
            <FormField
              label="Name"
              icon={FiUser}
              value={name}
              readOnly
              required
            />
            <FormSelect
              label="Test"
              value={test}
              onChange={(e) => setTest(e.target.value)}
              options={["Skin Testing", "Photo Testing"]}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg">
            <FormField
              label="Weight"
              icon={FiPackage}
              type="number"
              step="0.001"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
            <FormField
              label="Sample"
              icon={FiPackage}
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              required
            />
            <FormField
              label="Amount"
              icon={FiDollarSign}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200"
            >
              <FiRotateCcw className="-ml-1 mr-2 h-5 w-5" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiSave className="-ml-1 mr-2 h-5 w-5" />
              {editMode ? "Update Token" : "Save Token"}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiPrinter className="-ml-1 mr-2 h-5 w-5" />
              Print
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="mb-6 flex justify-end">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-amber-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : (
          <TokenTable
            tokens={filteredTokens}
            onEdit={handleEdit}
            onDelete={confirmDelete}
          />
        )}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
              <div className="text-center">
                <FiAlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Are you sure you want to delete this token? 
                  This action cannot be undone.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={proceedDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenPage;
