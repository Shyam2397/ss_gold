import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiHash,
  FiClock,
  FiCalendar,
  FiPackage,
  FiDollarSign,
  FiSearch,
  FiSave,
  FiRotateCcw,
  FiPrinter,
  FiList,
  FiClipboard
} from "react-icons/fi";
import { BsReceipt } from "react-icons/bs";
import logoPath from '../../assets/logo.png';

// Components
import FormField from './components/FormField';
import FormSelect from './components/FormSelect';
import TokenTable from './components/TokenTable';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';

// Hooks
import useToken from './hooks/useToken';

// Utils
import { preloadImages, convertImageToBase64, generatePrintContent } from './utils/printUtils';

const TokenPage = () => {
  // Form state
  const [code, setCode] = useState("");
  const [tokenNo, setTokenNo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [test, setTest] = useState("Skin Testing");
  const [weight, setWeight] = useState("");
  const [sample, setSample] = useState("");
  const [amount, setAmount] = useState("50");
  
  // UI state
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    tokenId: null
  });

  // Custom hook for token operations
  const {
    tokens,
    loading,
    error,
    success,
    setError,
    fetchTokens,
    generateTokenNumber,
    saveToken,
    deleteToken,
    fetchNameByCode,
    updatePaymentStatus
  } = useToken();

  // Initial setup
  useEffect(() => {
    const initializeData = async () => {
      await fetchTokens();
      const newTokenNo = await generateTokenNumber();
      if (newTokenNo) {
        setTokenNo(newTokenNo);
      }
      getCurrentDateTime();
    };
    
    initializeData();
  }, [fetchTokens, generateTokenNumber]);

  // Initialize filteredTokens with tokens
  useEffect(() => {
    setFilteredTokens(tokens);
  }, [tokens]);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTokens(tokens);
    } else {
      setFilteredTokens(
        tokens.filter((token) =>
          Object.values(token)
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, tokens]);

  const getCurrentDateTime = () => {
    const currentDate = new Date();
    
    // Date formatting similar to TokenTable
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Time formatting with leading zeros
    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    setDate(formattedDate);
    setTime(formattedTime);
  };

  const handleCodeChange = async (e) => {
    const inputCode = e.target.value;
    setCode(inputCode);
    setError("");

    if (inputCode.length === 4) {
      const fetchedName = await fetchNameByCode(inputCode);
      setName(fetchedName);
    } else {
      setName("");
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
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('Form Validation Started');
    if (!validateForm()) {
      console.error('Form Validation Failed');
      return;
    }

    console.log('Preparing Token Data');
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

    console.log('Edit Mode:', editMode);
    console.log('Edit ID:', editId);
    console.log('Token Data:', JSON.stringify(tokenData, null, 2));

    try {
      // If in edit mode but no editId, reset edit mode
      if (editMode && !editId) {
        console.warn('Edit mode is on but no edit ID found. Switching to create mode.');
        setEditMode(false);
      }

      const success = await saveToken(tokenData, editMode ? editId : null);
      
      if (success) {
        console.log('Token Save Successful');
        setEditMode(false);
        resetForm();
        await generateTokenNumber().then(setTokenNo);
      } else {
        console.error('Token Save Failed');
        setError('Failed to save token. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected Error in Token Save:', error);
      setError(`Unexpected error: ${error.message}`);
    }
  };

  const handleEdit = (token) => {
    setEditMode(true);
    setEditId(token.id);
    setCode(token.code);
    setTokenNo(token.tokenNo);
    
    // Ensure consistent date formatting
    const editDate = new Date(token.date);
    const day = editDate.getDate().toString().padStart(2, '0');
    const month = (editDate.getMonth() + 1).toString().padStart(2, '0');
    const year = editDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    setDate(formattedDate);

    // Ensure consistent time formatting
    const [hours, minutes] = token.time.split(':');
    const formattedTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    setTime(formattedTime);

    setName(token.name);
    setTest(token.test);
    setWeight(token.weight);
    setSample(token.sample);
    setAmount(token.amount);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.tokenId) return;

    const success = await deleteToken(deleteConfirmation.tokenId);
    
    if (success) {
      setDeleteConfirmation({
        isOpen: false,
        tokenId: null
      });
      resetForm();
      generateTokenNumber().then(setTokenNo);
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

  const handlePrint = async () => {
    try {
      const imagesToPreload = [logoPath];
      await preloadImages(imagesToPreload);
      const base64Logo = await convertImageToBase64(logoPath);
      
      const tokenData = {
        tokenNo,
        date,
        time,
        name,
        test,
        weight,
        sample,
        amount
      };

      const printContent = generatePrintContent(tokenData, base64Logo);
      
      const printWindow = window.open('', '', 'width=1200,height=600');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } catch (error) {
      console.error('Print error:', error);
      setError('Failed to print token');
    }
  };

  const handlePaymentStatusChange = async (tokenId, isPaid) => {
    await updatePaymentStatus(tokenId, isPaid);
  };

  return (
    <div className="container mx-auto px-8 py-2">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center">
            <div className="mr-4 sm:mr-6">
              <BsReceipt className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-amber-900">
              {editMode ? "Edit Token" : "New Token"}
            </h2>
          </div>
          {error && (
            <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          {success && (
            <div className="p-2 bg-green-50 border-l-4 border-green-500 rounded-md">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 p-5 sm:p-6 bg-amber-50 rounded-xl border border-amber-100 shadow-md"
          >
            <FormField
              label="Token No"
              icon={FiHash}
              value={tokenNo}
              readOnly
              required
              size="lg"
            />
            <FormField
              label="Date"
              icon={FiCalendar}
              value={date}
              readOnly
              required
              size="lg"
            />
            <FormField
              label="Time"
              icon={FiClock}
              value={time}
              readOnly
              required
              size="lg"
            />
            <FormField
              label="Code"
              icon={FiHash}
              value={code}
              onChange={handleCodeChange}
              required
              size="lg"
            />
            <FormField
              label="Name"
              icon={FiUser}
              value={name}
              readOnly
              required
              size="lg"
            />
            <FormSelect
              label="Test"
              icon={FiClipboard}
              value={test}
              onChange={(e) => setTest(e.target.value)}
              options={["Skin Testing", "Photo Testing"]}
              size="lg"
            />
            <FormField
              label="Weight"
              icon={FiPackage}
              type="number"
              step="0.001"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              size="lg"
            />
            <FormField
              label="Sample"
              icon={FiPackage}
              value={sample}
              onChange={(e) => setSample(e.target.value)}
              required
              size="lg"
            />
            <FormField
              label="Amount"
              icon={FiDollarSign}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              size="lg"
            />
          </div>

          <div className="flex justify-end space-x-4 sm:space-x-6">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center px-4 sm:px-6 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200"
            >
              <FiRotateCcw className="-ml-1 mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 sm:px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiSave className="-ml-1 mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              {editMode ? "Update Token" : "Save Token"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-4 sm:px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
            >
              <FiPrinter className="-ml-1 mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Print
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center">
            <div className="mr-4 sm:mr-6">
              <FiList className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-amber-900">
              Token List
            </h3>
          </div>
          <div className="relative w-64 sm:w-80">
            <input
              type="text"
              placeholder="Search tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
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
          <div>
            <TokenTable
              tokens={filteredTokens}
              onEdit={handleEdit}
              onDelete={(id) => setDeleteConfirmation({ isOpen: true, tokenId: id })}
              onPaymentStatusChange={handlePaymentStatusChange}
            />
          </div>
        )}
      </div>

      {deleteConfirmation.isOpen && (
        <DeleteConfirmationModal
          onCancel={() => setDeleteConfirmation({ isOpen: false, tokenId: null })}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
};

export default TokenPage;
