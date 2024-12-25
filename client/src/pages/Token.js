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
} from "react-icons/fi";
import { BsReceipt } from "react-icons/bs";

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

const PrintArea = ({
  tokenNo,
  date,
  time,
  name,
  test,
  weight,
  sample,
  amount,
}) => (
  <div id="printArea" className="hidden">
    <div className="p-4 max-w-sm mx-auto bg-white">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">SS GOLD</h1>
        <p className="text-sm">59, Main Bazaar, Nilakottai - 624208</p>
        <p className="text-sm">Ph.No: 8903225544</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Token No:</span>
          <span>{tokenNo}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{date}</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{time}</span>
        </div>
        <div className="flex justify-between">
          <span>Name:</span>
          <span>{name}</span>
        </div>
        <div className="flex justify-between">
          <span>Test:</span>
          <span>{test}</span>
        </div>
        <div className="flex justify-between">
          <span>Weight:</span>
          <span>{weight}</span>
        </div>
        <div className="flex justify-between">
          <span>Sample:</span>
          <span>{sample}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount:</span>
          <span>{amount}</span>
        </div>
      </div>
      <div className="mt-4 text-center text-sm">
        <p>Thank you for your business!</p>
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
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

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

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/tokens`
      );
      setTokens(response.data);
    } catch (error) {
      setError("Failed to fetch tokens. Please try again later.");
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateTokenNumber = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/generateTokenNo`
      );
      setTokenNo(response.data.tokenNo);
    } catch (error) {
      console.error("Error generating token number:", error);
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

  const handleCodeChange = async (e) => {
    const code = e.target.value;
    setCode(code);
    setError("");

    if (code.length === 4) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/entries/${code}`
        );
        setName(response.data.name || "Not Found");
      } catch (error) {
        console.error("Error fetching name:", error);
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
    } catch (error) {
      console.error("Error saving token:", error);
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

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/tokens/${id}`);
      fetchTokens();
      generateTokenNumber();
    } catch (error) {
      console.error("Error deleting token:", error);
    }
    resetForm();
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

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Token</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 10px; padding: 10px; font-family: Arial, sans-serif; }
            .container { max-width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .content { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">SS GOLD</h1>
              <p style="margin: 5px 0; font-size: 14px;">59, Main Bazaar, Nilakottai - 624208</p>
              <p style="margin: 5px 0; font-size: 14px;">Ph.No: 8903225544</p>
            </div>
            <div class="content">
              <div class="row">
                <span>Token No:</span>
                <span>${tokenNo}</span>
              </div>
              <div class="row">
                <span>Date:</span>
                <span>${date}</span>
              </div>
              <div class="row">
                <span>Time:</span>
                <span>${time}</span>
              </div>
              <div class="row">
                <span>Name:</span>
                <span>${name}</span>
              </div>
              <div class="row">
                <span>Test:</span>
                <span>${test}</span>
              </div>
              <div class="row">
                <span>Weight:</span>
                <span>${weight}</span>
              </div>
              <div class="row">
                <span>Sample:</span>
                <span>${sample}</span>
              </div>
              <div class="row">
                <span>Amount:</span>
                <span>${amount}</span>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      {/* Form Section */}
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Token Information */}
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

          {/* Customer Information */}
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

          {/* Sample Information */}
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
              type="number"
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

      {/* Token List */}
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
            onDelete={handleDelete}
          />
        )}
      </div>

      <div id="print-content" className="hidden">
        <PrintArea
          tokenNo={tokenNo}
          date={date}
          time={time}
          name={name}
          test={test}
          weight={weight}
          sample={sample}
          amount={amount}
        />
      </div>
    </div>
  );
};

export default TokenPage;
