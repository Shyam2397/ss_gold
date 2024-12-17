import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const Skintestdata = () => {
  const [skinTests, setSkinTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchSkinTests();
  }, []);

  useEffect(() => {
    filterTestsByDate();
  });

  const fetchSkinTests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        process.env.REACT_APP_API_URL + "/skin_tests"
      );
      const sortedData = response.data.data.sort(
        (a, b) => parseFloat(b.token_no) - parseFloat(a.token_no)
      );
      setSkinTests(sortedData);
      setFilteredTests(sortedData); // Initially, display all tests
    } catch (err) {
      console.error(err);
      setError("Failed to fetch skin tests");
    } finally {
      setLoading(false);
    }
  };

  const filterTestsByDate = () => {
    if (!fromDate || !toDate) {
      setFilteredTests(skinTests); // If no date range is selected, show all tests
      return;
    }

    const filtered = skinTests.filter((test) => {
      const testDate = new Date(test.date.split("-").reverse().join("-"));
      return testDate >= new Date(fromDate) && testDate <= new Date(toDate);
    });

    setFilteredTests(filtered);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTests);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SkinTest Data");
    XLSX.writeFile(workbook, "skinTest_data.xlsx");
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="skin-testing-container p-4 sm:p-6 bg-[#F9F3F1] shadow-lg rounded-xl text-[#391145] w-full flex flex-col h-full">
      <div
        className="flex justify-between mb-4"
        style={{ width: "100%", borderBottom: "4px solid #D3B04D" }}
      >
        <h1 className="text-3xl font-bold">Skin Test Data</h1>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div>
          <label className="mr-2">From Date:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-orange-400 rounded-lg p-2 bg-[#FFF4D6]"
          />
          <label className="ml-4 mr-2">To Date:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-orange-400 rounded-lg p-2 bg-[#FFF4D6]"
          />
          <button
            onClick={clearDates}
            className="text-[#391145] font-bold hover:text-red-600 hover:underline px-4 ml-4"
          >
            Clear
          </button>
        </div>
        <div>
          <button
            onClick={exportToExcel}
            className="text-[#391145] font-bold hover:text-green-600 hover:underline px-4"
          >
            Export to Excel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-[#FFFCF5] rounded-2xl h-72 sm:flex-grow">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <SkinTestTable tests={filteredTests} />
        )}
        {error && <div className="text-red-500">{error}</div>}
      </div>
    </div>
  );
};

const SkinTestTable = ({ tests }) => (
  <div>
    <table className="table table-pin-rows table-pin-cols w-full">
      <thead>
        <tr>
          {Object.keys(tests[0] || {}).map((key) => (
            <th key={key} className="text-base bg-[#DD845A] text-white">
              {key.replace("_", " ")}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr key={test.token_no}>
            {Object.keys(test).map((key) => (
              <td className="whitespace-nowrap" key={key}>
                {test[key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Skintestdata;
