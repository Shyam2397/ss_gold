import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const Tokendata = () => {
  const [tokens, setTokens] = useState([]);
  const [filteredTokens, setFilteredTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    fetchTokens();
  }, []);

  useEffect(() => {
    filterTokensByDate();
  }); // Add dependencies to re-run the effect when fromDate or toDate changes

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/tokens`
      );
      setTokens(response.data);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTokensByDate = () => {
    if (!fromDate || !toDate) {
      setFilteredTokens(tokens); // If no date range is selected, show all tokens
      return;
    }

    const filtered = tokens.filter((token) => {
      const tokenDate = new Date(token.date.split("-").reverse().join("-"));
      return tokenDate >= new Date(fromDate) && tokenDate <= new Date(toDate);
    });

    setFilteredTokens(filtered);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredTokens);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Token Data");
    XLSX.writeFile(workbook, "token_data.xlsx");
  };

  const handleDelete = async (tokenId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/tokens/${tokenId}`);
      setTokens(tokens.filter((token) => token.id !== tokenId));
    } catch (error) {
      console.error("Error deleting token:", error);
    }
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <div className="p-6 bg-[#F9F3F1] shadow-lg rounded-xl max-w-full h-full text-[#391145] flex flex-col">
      <div
        className="flex justify-between mb-4"
        style={{ width: "100%", borderBottom: "4px solid #D3B04D" }}
      >
        <h1 className="text-3xl font-bold">Token Data</h1>
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
          <TokenTable tokens={filteredTokens} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
};

const TokenTable = ({ tokens, onDelete }) => (
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
                <dd className="text-xs font-normal">{token.date}</dd>
                <dd className="text-xs font-normal">{token.time}</dd>
                <dd className="text-xs font-normal">{token.code}</dd>
              </dl>
            </td>
            <td className="whitespace-nowrap max-[600px]:hidden">
              {token.date}
            </td>
            <td className="whitespace-nowrap max-[600px]:hidden">
              {token.time}
            </td>
            <td className="whitespace-nowrap max-[600px]:hidden">
              {token.code}
            </td>
            <td className="whitespace-nowrap max-[600px]:font-bold">
              {token.name}
            </td>
            <td className="whitespace-nowrap hidden md:table-cell">
              {token.test}
            </td>
            <td className="whitespace-nowrap hidden md:table-cell">
              {token.weight}
            </td>
            <td className="whitespace-nowrap hidden md:table-cell">
              {token.sample}
            </td>
            <td className="whitespace-nowrap hidden md:table-cell">
              {token.amount}
            </td>
            <td>
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

export default Tokendata;
