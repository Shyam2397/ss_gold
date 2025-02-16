import React, { useState } from 'react';
import {
    FiSave,
    FiRotateCcw,
    FiAlertCircle,
    FiPlus,
} from 'react-icons/fi';
import { GiGoldBar } from 'react-icons/gi';
import { createPureExchange, checkPureExchangeExists } from './api/pureExchangeApi';
import { fetchSkinTests } from '../SkinTesting/api/skinTestApi';
import ThermalPrinter from './ThermalPrinter';

const FormInput = ({ label, name, value, onChange, readOnly = false, className }) => {
    return (
        <div className={`form-control ${className}`}>
            <label className="block text-xs font-medium text-amber-900 mb-0.5">
                {label}
            </label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                className={`w-full px-2 py-1 text-sm rounded border border-amber-200 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-amber-900 transition-all duration-200 ${
                    readOnly ? 'bg-gray-50' : ''
                }`}
            />
        </div>
    );
};

const PureExchange = () => {
    const [tokenNo, setTokenNo] = useState('');
    const [point, setPoint] = useState('0.20');
    const [tableData, setTableData] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Function to set error with auto-clear timeout
    const setErrorWithTimeout = (message) => {
        setError(message);
        setTimeout(() => {
            setError('');
        }, 3000); // Clear after 3 seconds
    };

    const fetchSkinTestData = async (tokenNo) => {
        try {
            const response = await fetchSkinTests();
            const skinTests = response;
            const skinTest = skinTests.find(test => 
                (test.tokenNo || test.tokenno || '').toString() === tokenNo.toString()
            );
            
            if (!skinTest) {
                setErrorWithTimeout('Token number not found in skin testing data');
                return null;
            }
            
            return skinTest;
        } catch (error) {
            console.error('Error fetching skin test data:', error);
            setErrorWithTimeout('Error fetching skin test data. Please try again.');
            return null;
        }
    };

    const handleAdd = async () => {
        if (!tokenNo) {
            setErrorWithTimeout('Please enter a token number');
            return;
        }

        if (!point) {
            setErrorWithTimeout('Please enter a point value');
            return;
        }

        const tokenExists = tableData.some(row => row.tokenNo === tokenNo);

        if (tokenExists) {
            setErrorWithTimeout('Token number already exists.');
            return;
        }

        // Fetch skin testing data
        const skinTestData = await fetchSkinTestData(tokenNo);
        
        if (!skinTestData) {
            return;
        }

        // Extract required values
        const { weight, highest, average, gold_fineness, name } = skinTestData;

        // Calculate values based on the logic
        const hWeight = (parseFloat(weight) * parseFloat(highest)) / 100;
        const aWeight = (parseFloat(weight) * parseFloat(average)) / 100;
        const gWeight = (parseFloat(weight) * parseFloat(gold_fineness)) / 100;
        const exGold = parseFloat(gold_fineness) - parseFloat(point);
        const exWeight = ((parseFloat(weight) - 0.010) * exGold)/100;

        const newRow = {
            id: tableData.length + 1,
            tokenNo: tokenNo,
            name: name, 
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\/+/g, '-'),
            time: new Date().toLocaleTimeString(),
            weight: parseFloat(weight).toFixed(3),
            highest: parseFloat(highest).toFixed(2),
            hWeight: hWeight.toFixed(3),
            average: parseFloat(average).toFixed(2),
            aWeight: aWeight.toFixed(3),
            goldFineness: parseFloat(gold_fineness).toFixed(2),
            gWeight: gWeight.toFixed(3),
            exGold: parseFloat(exGold).toFixed(2),
            exWeight: exWeight.toFixed(3)
        };

        setTableData([...tableData, newRow]);
        setTokenNo('');
        setError('');
    };

    const handleSave = async () => {
        try {
            if (tableData.length === 0) {
                setErrorWithTimeout('Please add at least one entry before saving.');
                return;
            }

            setLoading(true);
            setError('');

            // Prepare data for saving (excluding id field)
            const dataToSave = tableData.map(({ id, ...rest }) => rest);

            // Check all records for existing tokens first
            const existingTokens = [];
            for (const record of dataToSave) {
                const exists = await checkPureExchangeExists(record.tokenNo);
                if (exists) {
                    existingTokens.push(record.tokenNo);
                }
            }

            // If any tokens exist, show error and return
            if (existingTokens.length > 0) {
                const tokens = existingTokens.join(', ');
                setErrorWithTimeout(
                    existingTokens.length === 1
                        ? `Token ${tokens} already exists in Pure Exchange data. Please remove it and try again.`
                        : `Tokens ${tokens} already exist in Pure Exchange data. Please remove them and try again.`
                );
                setLoading(false);
                return;
            }

            // Save each record
            for (const record of dataToSave) {
                await createPureExchange(record);
            }

            // Clear the table after successful save
            setTableData([]);
            setErrorWithTimeout('Data saved successfully!');
        } catch (error) {
            console.error('Error saving data:', error);
            setErrorWithTimeout('Error saving data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setTokenNo('');
        setPoint('0.20');
        setTableData([]);
        setError('');
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2">
            
            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-sm p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div
                            className="mr-2"
                        >
                            <GiGoldBar className="w-6 h-6 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-amber-900">Pure Exchange</h2>
                    </div>
                    {error && (
                <div className={`p-1 rounded-md ${error.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center">
                        <FiAlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium ml-2">{error}</p>
                    </div>
                </div>
            )}
                </div>

                {/* Input Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 bg-amber-50/50 rounded mb-3">
                    <div className="flex items-end space-x-2">
                    <FormInput
                            label="Token Number"
                        name="tokenNo"
                        value={tokenNo}
                        onChange={(e) => setTokenNo(e.target.value)}
                            className="flex-1"
                    />
                    <FormInput
                        label="Point"
                        name="point"
                        value={point}
                        onChange={(e) => setPoint(e.target.value)}
                            className="w-20"
                        />
                        <button
                            onClick={handleAdd}
                            className="px-2 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition-colors flex items-center space-x-1 h-[30px]"
                        >
                            <FiPlus className="w-3.5 h-3.5" />
                            <span>Add</span>
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-xl border border-amber-100 mt-2">
                    <div className="overflow-x-auto">
                        <div className="flex flex-col h-[calc(100vh-280px)]">
                            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                                <table className="min-w-full divide-y divide-amber-200">
                                <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                                        <tr>
                                        {[
                                            'S.no', 'Token-no', 'Name', 'Date', 'Time', 'Weight',
                                            'Highest', 'H.Weight', 'Average', 'A.Weight',
                                            'Gold Fineness', 'G.Weight', 'Ex.Gold', 'Ex.Weight'
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-2 py-1.5 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                        </tr>
                                    </thead>
                                <tbody className="bg-white divide-y divide-amber-100">
                                    {tableData.map((row, index) => (
                                        <tr key={row.tokenNo} className="hover:bg-amber-50/50">
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {index + 1}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {row.tokenNo}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {row.name}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {row.date}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {row.time}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.weight).toFixed(3)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.highest).toFixed(2)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.hWeight).toFixed(3)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.average).toFixed(2)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.aWeight).toFixed(3)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.goldFineness).toFixed(2)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.gWeight).toFixed(3)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.exGold).toFixed(2)}
                                            </td>
                                            <td className="px-2 py-1.5 whitespace-nowrap text-sm text-gray-900">
                                                {parseFloat(row.exWeight).toFixed(3)}
                                            </td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-2">
                    <button
                        onClick={handleReset}
                        className="px-2 py-1 border border-amber-300 text-amber-700 text-sm rounded hover:bg-amber-50 transition-colors flex items-center space-x-1 h-[30px]"
                        disabled={loading}
                    >
                        <FiRotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-2 py-1 bg-amber-500 text-white text-sm rounded hover:bg-amber-600 transition-colors flex items-center space-x-1 h-[30px]"
                        disabled={loading || tableData.length === 0}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <FiSave className="w-3.5 h-3.5" />
                                <span>Save</span>
                            </>
                        )}
                    </button>
                    {/* Thermal Printer Component */}
            <ThermalPrinter tableData={tableData} />
                </div>
            </div>
            
            
        </div>
    );
};

export default PureExchange;
