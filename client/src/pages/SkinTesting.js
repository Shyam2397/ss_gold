import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import SkintestPrint from "../print/SkintestPrint";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiSave,
  FiRotateCcw,
  FiPrinter,
  FiEdit2,
  FiTrash2,
  FiAlertCircle,
} from "react-icons/fi";
import { GiTestTubes } from "react-icons/gi";

const initialFormData = {
  tokenNo: "",
  date: "",
  time: "",
  name: "",
  weight: "",
  sample: "",
  highest: "",
  average: "",
  gold_fineness: "",
  karat: "",
  silver: "",
  copper: "",
  zinc: "",
  cadmium: "",
  nickel: "",
  tungsten: "",
  iridium: "",
  ruthenium: "",
  osmium: "",
  rhodium: "",
  rhenium: "",
  indium: "",
  titanium: "",
  palladium: "",
  platinum: "",
  others: "",
  remarks: "",
  code: "",
};

const FormInput = ({ label, name, value, onChange, readOnly = false }) => {
  const isMetalField = [
    "gold_fineness",
    "silver",
    "copper",
    "zinc",
    "cadmium",
    "nickel",
    "tungsten",
    "iridium",
    "ruthenium",
    "osmium",
    "rhodium",
    "rhenium",
    "indium",
    "titanium",
    "palladium",
    "platinum",
    "others",
  ].includes(name);

  return (
    <div className="form-control w-full">
      <label className="block text-sm font-medium text-amber-900 mb-1">
        {label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
      </label>
      <div className="relative rounded-md shadow-sm">
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className={`
            w-full pl-4 pr-10 py-2 
            rounded-lg border border-amber-200 
            focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
            transition-all duration-200
            ${readOnly ? "bg-gray-50" : ""}
            ${isMetalField ? "bg-amber-50" : ""}
          `}
        />
        {isMetalField && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const TableRow = ({ test, onEdit, onDelete }) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="hover:bg-amber-50 transition-colors duration-200"
  >
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(test)}
          className="text-amber-600 hover:text-amber-900 transition-colors duration-200"
        >
          <FiEdit2 className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(test.tokenNo)}
          className="text-red-600 hover:text-red-900 transition-colors duration-200"
        >
          <FiTrash2 className="h-5 w-5" />
        </button>
      </div>
    </td>
    {Object.keys(test).map((key) => (
      <td
        key={key}
        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
      >
        {test[key]}
      </td>
    ))}
  </motion.tr>
);

const SkinTesting = () => {
  // State variables
  const [formData, setFormData] = useState(initialFormData);
  const [skinTests, setSkinTests] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sum, setSum] = useState(0);

  // Fetch skin tests on component mount
  useEffect(() => {
    fetchSkinTests();
  }, []);

  // Fetch skin tests from the API
  const fetchSkinTests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        process.env.REACT_APP_API_URL + "/skin_tests"
      );
      const sortedData = response.data.data.sort(
        (a, b) => parseFloat(b.tokenNo) - parseFloat(a.tokenNo)
      );
      setSkinTests(sortedData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch skin tests");
    } finally {
      setLoading(false);
    }
  };

  // Calculate sum of specific fields
  const calculateSum = useCallback((data) => {
    const keysToSum = [
      "gold_fineness",
      "silver",
      "copper",
      "zinc",
      "cadmium",
      "nickel",
      "tungsten",
      "iridium",
      "ruthenium",
      "osmium",
      "rhodium",
      "rhenium",
      "indium",
      "titanium",
      "palladium",
      "platinum",
      "others",
    ];

    const sum = keysToSum.reduce((acc, key) => {
      const value = parseFloat(data[key]);
      return acc + (isNaN(value) ? 0 : value);
    }, 0);

    setSum(sum);
  }, []);

  // Update form data
  const updateFormData = (name, value) => {
    setFormData((prevFormData) => {
      const newFormData = { ...prevFormData, [name]: value };

      if (name === "gold_fineness") {
        const goldFineness = parseFloat(value);
        if (!isNaN(goldFineness)) {
          newFormData.karat = (goldFineness / 4.1667).toFixed(2);
        } else {
          newFormData.karat = "";
        }
      }

      calculateSum(newFormData);
      return newFormData;
    });
  };

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset error when any input is modified
    if (error) {
      setError("");
    }
    updateFormData(name, value);
  };

  // Handle token change
  const handleTokenChange = async (e) => {
    const { name, value } = e.target;
    // Reset error when token input is modified
    if (error) {
      setError("");
    }
    updateFormData(name, value);

    if (name === "tokenNo" && value) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/tokens/${value}`
        );

        if (response.data.data) {
          const { date, time, name, weight, sample, code } = response.data.data;
          setFormData((prevFormData) => ({
            ...prevFormData,
            date,
            time,
            name,
            weight,
            sample,
            code,
            tokenNo: value,
          }));
          // Fetch phone number using the code
          fetchPhoneNumber(code); // Fetch phone number based on code
        } else {
          setError("No token data found for the entered token number.");
        }
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setError("Token number not found.");
        } else {
          setError("Failed to fetch token data. Please try again later.");
        }
      }
    }
  };

  // Fetch phone number based on the code
  const fetchPhoneNumber = async (code) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/entries?code=${code}`
      );

      // Check if the response contains the expected data structure
      if (response.data && response.data.length > 0) {
        const phone = response.data[0].phoneNumber; // Adjust based on your response structure
        console.log("Fetched Phone Number:", phone); // Console the phone number
      } else {
        console.log("No phone number found for the given code.");
      }
    } catch (err) {
      console.error("Error fetching phone number:", err);
    }
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.tokenNo) {
      setError("Token number is required");
      return false;
    }
    if (!formData.date) {
      setError("Date is required");
      return false;
    }
    if (!formData.time) {
      setError("Time is required");
      return false;
    }
    if (!formData.name) {
      setError("Name is required");
      return false;
    }
    if (!formData.weight || isNaN(parseFloat(formData.weight))) {
      setError("Weight must be a valid number");
      return false;
    }
    if (!formData.sample) {
      setError("Sample is required");
      return false;
    }

    // Validate numeric fields
    const numericFields = [
      'highest', 'average', 'gold_fineness', 'karat', 'silver', 'copper',
      'zinc', 'cadmium', 'nickel', 'tungsten', 'iridium', 'ruthenium',
      'osmium', 'rhodium', 'rhenium', 'indium', 'titanium', 'palladium',
      'platinum'
    ];

    for (const field of numericFields) {
      if (formData[field] && isNaN(parseFloat(formData[field]))) {
        setError(`${field.replace('_', ' ')} must be a valid number`);
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Convert numeric fields to proper types
    const processedFormData = {
      tokenNo: formData.tokenNo.trim(),
      date: formData.date.trim(),
      time: formData.time.trim(),
      name: formData.name.trim(),
      weight: parseFloat(formData.weight) || 0,
      sample: formData.sample.trim(),
      highest: parseFloat(formData.highest) || 0,
      average: parseFloat(formData.average) || 0,
      gold_fineness: parseFloat(formData.gold_fineness) || 0,
      karat: parseFloat(formData.karat) || 0,
      silver: parseFloat(formData.silver) || 0,
      copper: parseFloat(formData.copper) || 0,
      zinc: parseFloat(formData.zinc) || 0,
      cadmium: parseFloat(formData.cadmium) || 0,
      nickel: parseFloat(formData.nickel) || 0,
      tungsten: parseFloat(formData.tungsten) || 0,
      iridium: parseFloat(formData.iridium) || 0,
      ruthenium: parseFloat(formData.ruthenium) || 0,
      osmium: parseFloat(formData.osmium) || 0,
      rhodium: parseFloat(formData.rhodium) || 0,
      rhenium: parseFloat(formData.rhenium) || 0,
      indium: parseFloat(formData.indium) || 0,
      titanium: parseFloat(formData.titanium) || 0,
      palladium: parseFloat(formData.palladium) || 0,
      platinum: parseFloat(formData.platinum) || 0,
      others: (formData.others || '').trim(),
      remarks: (formData.remarks || '').trim(),
      code: (formData.code || '').trim()
    };

    try {
      console.log('Submitting data:', processedFormData);
      
      if (isEditing) {
        const response = await axios.put(
          `${process.env.REACT_APP_API_URL}/skin_tests/${processedFormData.tokenNo}`,
          processedFormData,
          { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('Update response:', response.data);
        setIsEditing(false);
      } else {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/skin_tests`,
          processedFormData,
          { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('Create response:', response.data);
      }
      fetchSkinTests();
      setFormData(initialFormData);
      setError("");
      setSum(0);
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      if (err.response?.data?.error === "Token number already exists") {
        setError("Token number already exists");
      } else {
        setError(err.response?.data?.error || "Failed to submit form");
      }
    }
  };

  // Handle editing a test
  const handleEdit = (test) => {
    setFormData(test);
    setIsEditing(true);
    calculateSum(test);
  };

  // Handle deleting a test
  const handleDelete = async (tokenNo) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/skin_tests/${tokenNo}`
      );
      fetchSkinTests();
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      setError(err.response?.data?.error || "Failed to delete skin test");
    }
  };

  // Handle resetting the form
  const handleReset = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setError("");
    setSum(0);
  };

  // Debounce search input change
  const debouncedSearchChange = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  // Handle search input change
  const handleSearchChange = (e) => {
    debouncedSearchChange(e.target.value);
  };

  // Filter skin tests based on search query
  const filteredSkinTests = useMemo(() => {
    return skinTests.filter((test) =>
      Object.values(test).some((value) =>
        value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [skinTests, searchQuery]);

  // Handle printing
  const handlePrint = () => {
    const printWindow = window.open("width=1200,height=800");

    // Construct the HTML content for printing
    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
          <style>
            @media print {
              .print-area {
                width: 210mm;
                height: 99mm;
                margin: 0;
                border: 1px solid #000;
                box-sizing: border-box;
              }
              body { margin: 0; padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
        ${document.getElementById("print-content").innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
      {/* Form Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <GiTestTubes className="w-8 h-8 text-amber-600 mr-3" />
            <h2 className="text-2xl font-bold text-amber-900">Skin Testing</h2>
          </div>
          {error && (
            <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded-md">
              <div className="flex">
                <FiAlertCircle className="h-5 w-5 text-red-400" />
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
            <FormInput
              label="Token No"
              name="tokenNo"
              value={formData.tokenNo}
              onChange={handleTokenChange}
            />
            <FormInput
              label="Date"
              name="date"
              value={formData.date}
              readOnly
            />
            <FormInput
              label="Time"
              name="time"
              value={formData.time}
              readOnly
            />
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg">
            <FormInput
              label="Name"
              name="name"
              value={formData.name}
              readOnly
            />
            <FormInput
              label="Weight"
              name="weight"
              value={formData.weight}
              readOnly
            />
            <FormInput
              label="Sample"
              name="sample"
              value={formData.sample}
              readOnly
            />
          </div>

          {/* Test Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Object.keys(formData)
              .filter(
                (key) =>
                  ![
                    "tokenNo",
                    "date",
                    "time",
                    "name",
                    "weight",
                    "sample",
                    "code",
                  ].includes(key)
              )
              .map((key) => (
                <FormInput
                  key={key}
                  label={key}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                />
              ))}
          </div>

          <div className="flex justify-end space-x-4">
            {sum > 0 && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-md">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-amber-800">
                      Total Sum: {sum.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
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
              {isEditing ? "Update Test" : "Save Test"}
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

      {/* Test Results Table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-amber-100">
        <div className="mb-6 flex justify-end">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search tests..."
              onChange={handleSearchChange}
              className="w-64 pl-10 pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
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
          <div className="overflow-hidden rounded-lg border border-amber-100">
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                <table className="min-w-full divide-y divide-amber-200">
                  <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                        Actions
                      </th>
                      {Object.keys(initialFormData).map((key) => (
                        <th
                          key={key}
                          className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                        >
                          {key.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-amber-100">
                    {filteredSkinTests.map((test) => (
                      <TableRow
                        key={test.tokenNo}
                        test={test}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div id="print-content" className="hidden">
        <SkintestPrint formData={formData} sum={sum} />
      </div>
    </div>
  );
};

export default SkinTesting;
