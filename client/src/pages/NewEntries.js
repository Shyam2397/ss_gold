import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const NewEntry = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const isCodeDuplicate = entries.some((entry) => entry.code === code);
    if (isCodeDuplicate) {
      setError("Code already exists in the entries.");
      return;
    }

    const entryData = { name, phoneNumber, code, place };

    try {
      if (editingEntry) {
        await axios.put(`${API_URL}/entries/${editingEntry.id}`, entryData);
        setSuccess("Entry updated successfully!");
      } else {
        await axios.post(`${API_URL}/entries`, entryData);
        setSuccess("Entry added successfully!");
      }
      resetForm();
      fetchEntries();
      setError("");
    } catch (error) {
      console.error("Error saving entry:", error);
      setError("Failed to save entry. Please try again.");
    }
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setName(entry.name);
    setPhoneNumber(entry.phoneNumber);
    setCode(entry.code);
    setPlace(entry.place);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/entries/${id}`);
      setSuccess("Entry deleted successfully!");
      fetchEntries();
      setError("");
    } catch (error) {
      console.error("Error deleting entry:", error);
      setError("Failed to delete entry. Please try again.");
    }
  };

  const validateForm = () => {
    if (!name) {
      setError("Name is required.");
      return false;
    }
    if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
      setError("Phone number must be a 10-digit number.");
      return false;
    }
    if (code.length !== 4 || isNaN(Number(code))) {
      setError("Code must be a 4-digit number.");
      return false;
    }
    if (!place) {
      setError("Place is required.");
      return false;
    }
    setError("");
    return true;
  };

  const resetForm = () => {
    setName("");
    setPhoneNumber("");
    setCode("");
    setPlace("");
    setError("");
    setSuccess("");
    setEditingEntry(null);
    setSearchQuery("");
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
  };

  const filteredEntries = entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(searchQuery) ||
      entry.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="p-6 bg-[#F9F3F1] shadow-lg rounded-xl max-w-full h-full text-[#391145] flex flex-col">
      <div
        className="flex justify-between mb-4"
        style={{ width: "100%", borderBottom: "4px solid #D3B04D" }}
      >
        <h1 className="text-3xl font-bold">
          {editingEntry ? "Edit Entry" : "New Entry"}
        </h1>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <FormField
          label="Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          required
        />
        <FormField
          label="Phone Number"
          type="tel"
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            setError("");
          }}
          required
        />
        <FormField
          label="Code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError("");
          }}
          required
        />
        <FormField
          label="Place"
          value={place}
          onChange={(e) => {
            setPlace(e.target.value);
            setError("");
          }}
          required
        />
        <div className="col-span-1 xl:col-span-4 md:col-span-3 flex flex-col md:flex-row sm:flex-row sm:col-span-2 justify-evenly mt-8">
          <button
            type="submit"
            className="w-full md:w-48 sm:w-32 bg-emerald-600 text-white py-2.5 px-4 rounded-full hover:bg-gradient-to-br from-emerald-400 to-emerald-800 transition-transform transform hover:scale-105 text-xl font-bold mb-4 md:mb-0"
          >
            {editingEntry ? "Update" : "Submit"}
          </button>
          <input
            type="text"
            placeholder="Search by name"
            value={searchQuery}
            onChange={handleSearch}
            className="w-full md:w-48 sm:w-32 border border-gray-300 input rounded-full px-4 py-2 bg-transparent mb-4 md:mb-0"
          />
          <button
            type="button"
            onClick={resetForm}
            className="w-full md:w-48 sm:w-32 bg-red-600 text-white py-2.5 px-4 rounded-full hover:bg-gradient-to-br from-red-600 to-red-800 transition-transform transform hover:scale-105 text-xl font-bold mb-4 md:mb-0"
          >
            Reset
          </button>
        </div>
      </form>
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
            {filteredEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="whitespace-nowrap font-semibold sm:font-normal">
                  {entry.name}
                  <dl className=" sm:hidden">
                    <dd className=" text-xs font-normal">
                      {entry.phoneNumber}
                    </dd>
                    <dd className=" text-xs font-normal">{entry.code}</dd>
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
                    onClick={() => handleEdit(entry)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Edit
                  </button>
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

const FormField = ({
  label,
  type = "text",
  value,
  onChange,
  readOnly = false,
  required = false,
  step,
}) => (
  <div className="text-[#391145]">
    <label className="block text-xl font-bold text-gray-900">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      required={required}
      step={step}
      className="mt-1 block w-full border border-gray-300 input rounded-full px-4 py-2 bg-transparent"
    />
  </div>
);

export default NewEntry;
