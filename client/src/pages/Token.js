import React, { useState, useEffect } from "react";
import axios from "axios";

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
    setError(""); // Reset error on change

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
    const printContents = document.getElementById("printArea").innerHTML;
    const printWindow = window.open("width=auto,height=400");
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Token</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { margin: 10px; padding: 10px; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="p-6 bg-[#F9F3F1] shadow-lg rounded-xl max-w-full h-full text-[#391145] flex flex-col">
      <div
        className="flex justify-between mb-4"
        style={{ width: "100%", borderBottom: "4px solid #D3B04D" }}
      >
        <h1 className="text-3xl font-bold">New Token</h1>
        {error && <div className="text-red-600">{error}</div>}
      </div>
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <FormField
          label="Code"
          value={code}
          onChange={handleCodeChange}
          required
        />
        <FormField label="Token No" value={tokenNo} readOnly />
        <FormField label="Date" value={date} readOnly />
        <FormField label="Time" value={time} readOnly />
        <FormField
          label="Name"
          value={name}
          readOnly={!editMode}
          onChange={(e) => {
            setName(e.target.value);
            setError(""); // Reset error on change
          }}
        />
        <FormSelect
          label="Test"
          value={test}
          onChange={(e) => {
            setTest(e.target.value);
            setError(""); // Reset error on change
          }}
          options={["Skin Testing", "Photo Testing"]}
        />
        <FormField
          label="Weight"
          type="number"
          step="0.001"
          value={weight}
          onChange={(e) => {
            setWeight(e.target.value);
            setError(""); // Reset error on change
          }}
          required
        />
        <FormField
          label="Sample"
          value={sample}
          onChange={(e) => {
            setSample(e.target.value);
            setError(""); // Reset error on change
          }}
          required
        />
        <FormSelect
          label="Amount"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setError(""); // Reset error on change
          }}
          options={["50", "70", "100"]}
        />
        <div className="col-span-1 md:col-span-3 flex flex-col md:flex-row sm:flex-row sm:col-span-2 justify-evenly mt-8">
          <button
            type="button"
            onClick={handlePrint}
            className="w-full md:w-48 sm:w-32 bg-[#DD845A] text-white py-2.5 px-4 rounded-full hover:bg-gradient-to-br from-orange-500 to-orange-800 transition-transform transform hover:scale-105 text-xl font-bold mb-4 md:mb-0"
          >
            Print
          </button>
          <button
            type="submit"
            className="w-full md:w-48 sm:w-32 bg-emerald-600 text-white py-2.5 px-4 rounded-full hover:bg-gradient-to-br from-emerald-400 to-emerald-800 transition-transform transform hover:scale-105 text-xl font-bold mb-4 md:mb-0"
          >
            {editMode ? "Update" : "Submit"}
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="input input-bordered w-full md:w-48 sm:w-32 text-xl font-bold px-4 py-2 rounded-full mb-4 md:mb-0 bg-transparent"
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
      <div className=" overflow-x-auto bg-[#FFFCF5] rounded-2xl h-72 sm:flex-grow">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <TokenTable
            tokens={filteredTokens}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
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

const FormSelect = ({ label, value, onChange, options }) => (
  <div className="text-[#391145]">
    <label className="block text-xl font-bold text-gray-900">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="select select-bordered w-full mt-1 bg-transparent rounded-full"
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
  <div>
    <table className="table table-pin-rows table-pin-cols w-full">
      <thead>
        <tr>
          <th className="text-base bg-[#DD845A] text-white">Token No</th>
          <th className="text-base bg-[#DD845A] text-white max-[600px]:hidden">
            Date
          </th>
          <th className="text-base bg-[#DD845A] text-white max-[600px]:hidden">
            Time
          </th>
          <th className="text-base bg-[#DD845A] text-white max-[600px]:hidden">
            Code
          </th>
          <th className="text-base bg-[#DD845A] text-white">Name</th>
          <th className="text-base bg-[#DD845A] text-white hidden md:table-cell">
            Test
          </th>
          <th className="text-base bg-[#DD845A] text-white hidden md:table-cell">
            Weight
          </th>
          <th className="text-base bg-[#DD845A] text-white hidden md:table-cell">
            Sample
          </th>
          <th className="text-base bg-[#DD845A] text-white hidden md:table-cell">
            Amount
          </th>
          <th className="text-base bg-[#DD845A] text-white">Actions</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.id}>
            <td className="whitespace-nowrap max-[600px]:font-bold max-[600px]:text-center pl-11 max-[600px]:pl-0">
              {token.tokenNo}
              <dl className="sm:hidden">
                <dd className=" text-xs font-normal">{token.date}</dd>

                <dd className=" text-xs font-normal">{token.time}</dd>
                <dd className=" text-xs font-normal">{token.code}</dd>
              </dl>
            </td>
            <td className="whitespace-nowrap max-[600px]:hidden">
              {token.date}
              <dl className="md:hidden">
                <dd className=" text-xs font-normal">{token.test}</dd>
              </dl>
            </td>
            <td className="whitespace-nowrap max-[600px]:hidden">
              {token.time}
              <dl className="md:hidden">
                <dd className=" text-xs font-normal">{token.weight}</dd>
              </dl>
            </td>
            <td className="whitespace-nowrap max-[600px]:hidden">
              {token.code}
              <dl className="md:hidden">
                <dd className=" text-xs font-normal">{token.sample}</dd>
              </dl>
            </td>
            <td className="whitespace-nowrap max-[600px]:font-bold">
              {token.name}
              <dl className="md:hidden">
                <dd className=" text-xs font-normal sm:hidden">{token.test}</dd>
                <dd className=" text-xs font-normal sm:hidden">
                  {token.weight}
                </dd>
                <dd className=" text-xs font-normal sm:hidden">
                  {token.sample}
                </dd>
                <dd className=" text-xs font-normal">{token.amount}</dd>
              </dl>
            </td>
            <td className="whitespace-nowrap  hidden md:table-cell">
              {token.test}
            </td>
            <td className="whitespace-nowrap  hidden md:table-cell">
              {token.weight}
            </td>
            <td className="whitespace-nowrap  hidden md:table-cell">
              {token.sample}
            </td>
            <td className="whitespace-nowrap  hidden md:table-cell">
              {token.amount}
            </td>
            <td>
              <button
                onClick={() => onEdit(token)}
                className="text-blue-600 hover:underline mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(token.id)}
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
    <div style={{ width: "80mm", paddingRight: "15px", lineHeight: "130%" }}>
      <div
        style={{
          textAlign: "center",
          fontFamily: "Poppins",
          padding: 0,
          margin: 0,
        }}
      >
        <h1 style={{ fontSize: "25px", fontWeight: "bold", margin: "0px" }}>
          SS GOLD
        </h1>
        <div style={{ margin: 0, padding: 0, fontWeight: "500" }}>
          Computer X-ray Testing
        </div>
        <div style={{ fontWeight: "400", fontSize: "15px" }}>
          59, Main Bazaar, Nilakottai - 624208
        </div>
        <div style={{ fontWeight: "400", fontSize: "15px" }}>
          Ph.No : 8903225544
        </div>
      </div>
      <hr style={{ borderTop: "2px solid black", margin: 0 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "end",
          fontSize: "14px",
          margin: 0,
          fontFamily: "Poppins",
        }}
      >
        <div style={{ paddingRight: "10px" }}>{date}</div>
        <div style={{ paddingRight: "10px" }}>{time}</div>
      </div>
      <hr style={{ borderTop: "2px dashed black", margin: 0 }} />
      <div style={{ fontFamily: "Poppins", fontSize: "15px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            Token No<div>:</div>
          </div>
          <div
            style={{
              display: "grid",
              gridColumn: "2/4",
              justifyContent: "center",
            }}
          >
            {tokenNo}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            Name<div>:</div>
          </div>
          <div
            style={{
              display: "grid",
              gridColumn: "2/4",
              justifyContent: "center",
            }}
          >
            {name}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            Test<div>:</div>
          </div>
          <div
            style={{
              display: "grid",
              gridColumn: "2/4",
              justifyContent: "center",
            }}
          >
            {test}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            Weight<div>:</div>
          </div>
          <div
            style={{
              display: "grid",
              gridColumn: "2/4",
              justifyContent: "center",
            }}
          >
            {weight}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            Sample<div>:</div>
          </div>
          <div
            style={{
              display: "grid",
              gridColumn: "2/4",
              justifyContent: "center",
            }}
          >
            {sample}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            Amount<div>:</div>
          </div>
          <div
            style={{
              display: "grid",
              gridColumn: "2/4",
              justifyContent: "center",
            }}
          >
            {amount}
          </div>
        </div>
      </div>
      <hr style={{ borderTop: "2px solid black", margin: 0 }} />
      <div style={{ textAlign: "center", fontSize: "14px" }}>
        Thank You.... Visit Again....
      </div>
    </div>
  </div>
);

export default TokenPage;
