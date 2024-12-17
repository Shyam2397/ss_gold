import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import debounce from "lodash.debounce";
import SkintestPrint from "../print/SkintestPrint";

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

const FormInput = ({ label, name, value, onChange }) => (
  <div className="form-control text-[#391145]">
    <label className="block label">
      <span className="text-sm sm:text-base font-bold capitalize">
        {label.replace("_", " ")}
      </span>
    </label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className="mt-1 block border border-gray-300 input rounded-full px-2 sm:px-4 py-1 sm:py-2 bg-transparent"
    />
  </div>
);

const TableRow = ({ test, onEdit, onDelete }) => (
  <tr key={test.tokenNo}>
    <td className="whitespace-nowrap text-xs sm:text-sm">
      <button
        onClick={() => onEdit(test)}
        className="text-blue-600 hover:underline mr-2"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(test.tokenNo)}
        className="text-red-600 hover:underline"
      >
        Delete
      </button>
    </td>
    {Object.keys(test).map((key) => (
      <td className="whitespace-nowrap text-xs sm:text-sm" key={key}>
        {test[key]}
      </td>
    ))}
  </tr>
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
    updateFormData(name, value);
  };

  // Handle token change
  const handleTokenChange = async (e) => {
    const { name, value } = e.target;
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
    if (isNaN(formData.weight)) {
      setError("Weight must be a number");
      return false;
    }
    // Additional validation logic as needed
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditing) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/skin_tests/${formData.tokenNo}`,
          formData
        );
        setIsEditing(false);
      } else {
        await axios.post(
          process.env.REACT_APP_API_URL + "/skin_tests",
          formData
        );
      }
      fetchSkinTests();
      setFormData(initialFormData);
      setError("");
      setSum(0);
    } catch (err) {
      // console.error(err);
      if (
        err.response &&
        err.response.data &&
        err.response.data.error === "Token number already exists"
      ) {
        setError("Token number already exists");
      } else {
        setError("Failed to submit form");
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
      // console.error(err);
      setError("Failed to delete skin test");
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
    <div className="skin-testing-container p-4 sm:p-6 bg-[#F9F3F1] shadow-lg rounded-xl text-[#391145] w-full flex flex-col">
      <div
        className="flex justify-between items-center mb-4"
        style={{ width: "100%", borderBottom: "4px solid #D3B04D" }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold">Skin Testing Form</h1>
        {sum > 0 && (
          <div className="text-xl sm:text-2xl font-bold text-[#391145]">
            Sum of values : {sum}
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
      </div>
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4"
      >
        {Object.keys(formData)
          .filter((key) => key !== "code")
          .map((key) => (
            <FormInput
              key={key}
              label={key}
              name={key}
              value={formData[key]}
              onChange={key === "tokenNo" ? handleTokenChange : handleChange}
            />
          ))}
        <div className="col-span-2 md:col-span-6 flex flex-col md:flex-row sm:flex-row sm:col-span-4 lg:col-span-7 xl:col-span-9 justify-evenly mt-2">
          <button
            type="submit"
            className="w-full md:w-48 sm:w-32 bg-emerald-600 text-white py-2.5 px-4 rounded-full hover:bg-gradient-to-br from-emerald-400 to-emerald-800 transition-transform transform hover:scale-105 text-xl font-bold mb-4 md:mb-0"
          >
            {isEditing ? "Update" : "Submit"}
          </button>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="input input-bordered w-full md:w-48 sm:w-32 text-xl font-bold px-4 py-2 rounded-full mb-4 md:mb-0 bg-transparent"
          />
          <button
            type="button"
            onClick={handleReset}
            className="w-full md:w-48 sm:w-32 bg-red-600 text-white py-2.5 px-4 rounded-full hover:bg-gradient-to-br from-red-600 to-red-800 transition-transform transform hover:scale-105 text-xl font-bold mb-4 md:mb-0"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full md:w-48 sm:w-32 bg-blue-600 text-white py-2.5 px-4 rounded-full hover:bg-gradient-to-br from-blue-400 to-blue-800 transition-transform transform hover:scale-105 text-xl font-bold mb-4 md:mb-0"
          >
            Print
          </button>
        </div>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-[#FFFCF5] rounded-2xl h-72 sm:flex-grow">
          <table className="table table-pin-rows table-pin-cols w-full">
            <thead>
              <tr>
                <th className="text-xs sm:text-sm bg-[#DD845A] text-white">
                  Actions
                </th>
                {Object.keys(formData).map((key) => (
                  <th
                    key={key}
                    className="text-xs sm:text-sm bg-[#DD845A] text-white"
                  >
                    {key.replace("_", " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
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
      )}

      <div id="print-content" style={{ display: "none" }}>
        <SkintestPrint formData={formData} sum={sum} />
      </div>
    </div>
  );
};

export default SkinTesting;
