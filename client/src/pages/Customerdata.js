import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL = process.env.REACT_APP_API_URL;

const Customerdata = () => {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get(`${API_URL}/entries`);
      setEntries(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching entries:", error);
      setError("Failed to fetch entries. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/entries/${id}`);
      setEntries(entries.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      setError("Failed to delete entry. Please try again.");
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(entries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Data");
    XLSX.writeFile(workbook, "customer_data.xlsx");
  };

  return (
    <div className="p-6 bg-[#F9F3F1] shadow-lg rounded-xl max-w-full h-full text-[#391145] flex flex-col">
      <div
        className="flex justify-between mb-4"
        style={{ width: "100%", borderBottom: "4px solid #D3B04D" }}
      >
        <h1 className="text-3xl font-bold">Customer Data</h1>
        {error && <div className="text-red-600">{error}</div>}
        <button
          onClick={exportToExcel}
          className="text-[#391145] font-bold hover:text-green-600 hover:underline px-4"
        >
          Export to Excel
        </button>
      </div>

      <div className="mt-2 overflow-x-auto bg-[#FFFCF5] rounded-2xl h-64 sm:flex-grow">
        <table className="table table-pin-rows table-pin-cols min-w-full">
          <thead>
            <tr>
              <th className="text-base bg-[#DD845A] text-white w-96">Name</th>
              <th className="text-base bg-[#DD845A] text-white hidden sm:table-cell">
                Phone Number
              </th>
              <th className="text-base bg-[#DD845A] text-white hidden sm:table-cell">
                Code
              </th>
              <th className="text-base bg-[#DD845A] text-white hidden sm:table-cell">
                Place
              </th>
              <th className="text-base bg-[#DD845A] text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap font-semibold sm:font-normal">
                  {entry.name}
                  <dl className="sm:hidden">
                    <dd className="text-xs font-normal">{entry.phoneNumber}</dd>
                    <dd className="text-xs font-normal">{entry.code}</dd>
                  </dl>
                </td>
                <td className="whitespace-nowrap hidden sm:table-cell">
                  {entry.phoneNumber}
                </td>
                <td className="whitespace-nowrap hidden sm:table-cell">
                  {entry.code}
                </td>
                <td className="whitespace-nowrap hidden sm:table-cell">
                  {entry.place}
                </td>
                <td className="whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customerdata;
