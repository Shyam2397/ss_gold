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
        <div className={`form-control w-full ${className}`}>
            <label className="block text-sm font-medium text-amber-900 mb-1">
                {label}
            </label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                readOnly={readOnly}
                className={`w-full pl-4 pr-4 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
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
            const skinTest = skinTests.find(test => test.tokenNo === tokenNo);
            
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

            // Check each record for existing tokens
            for (const record of dataToSave) {
                const exists = await checkPureExchangeExists(record.tokenNo);
                if (exists) {
                    setErrorWithTimeout(`Token ${record.tokenNo} already exists in the database`);
                    setLoading(false);
                    return;
                }
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            
            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <div
                            className="mr-3"
                        >
                            <GiGoldBar className="w-8 h-8 text-amber-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-amber-900">Pure Exchange</h2>
                    </div>
                    {error && (
                <div className={`p-1 rounded-md ${error.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <FiAlertCircle className="h-5 w-5" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    </div>
                </div>
            )}
                </div>

                {/* Input Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg mb-4">
                    <div className="flex items-end space-x-4">
                    <FormInput
                            label="Token Number"
                        name="tokenNo"
                        value={tokenNo}
                        onChange={(e) => setTokenNo(e.target.value)}
                            className="w-1/2"
                    />
                    <FormInput
                        label="Point"
                        name="point"
                        value={point}
                        onChange={(e) => setPoint(e.target.value)}
                            className="w-1/2"
                        />
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors flex items-center space-x-2"
                        >
                            <FiPlus className="w-5 h-5" />
                            <span>Add</span>
                        </button>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-hidden rounded-lg border border-amber-100">
                    <div className="overflow-x-auto">
                        <div className="flex flex-col h-[270px]">
                            <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                                <table className="min-w-full divide-y divide-amber-200">
                                <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                                        <tr>
                                        {[
                                            'S.no', 'Token-no', 'Name', 'Date', 'Time', 'weight',
                                            'highest', 'H.weight', 'average', 'A.weight',
                                            'Gold-fineness', 'G.weight', 'ex-gold', 'ex.weight'
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className={`px-6 py-3 text-left text-sm font-medium text-white uppercase tracking-wider whitespace-nowrap ${
                                                    header === 'Name' ? 'hidden' : ''
                                                } ${header === 'ex.weight' ? 'sticky right-0 bg-gradient-to-r from-amber-500 to-yellow-500 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]' : 'shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]'}`}
                                            >
                                                {header}
                                            </th>
                                        ))}
                                        </tr>
                                    </thead>
                                <tbody className="bg-white divide-y divide-amber-100">
                                    {tableData.map((row, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-amber-50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-900">{row.id}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-amber-900">{row.tokenNo}</td>
                                            <td className="hidden px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.name}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.date}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.time}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.weight}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.highest}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.hWeight}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.average}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.aWeight}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.goldFineness}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.gWeight}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.exGold}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700 sticky right-0 bg-white shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">{row.exWeight}</td>
                                        </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="sticky bottom-0 w-full bg-amber-50 border-t border-amber-200">
                                <table className="min-w-full">
                                    <tfoot>
                                        <tr>
                                            <td colSpan="12" className="px-6 py-3 text-right font-semibold text-amber-900">Total Exchange Weight:</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-amber-900 sticky right-0 bg-amber-50 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                                                {tableData.length > 0 ? 
                                                    (tableData.reduce((total, row) => {
                                                        const weight = parseFloat(row.weight);
                                                        const exGold = parseFloat(row.exGold);
                                                        return total + ((weight - 0.010) * exGold / 100);
                                                    }, 0).toFixed(2) + '0') 
                                                    : '0.000'}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-all duration-200"
                    >
                        <FiRotateCcw className="-ml-1 mr-2 h-5 w-5" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center">
                                <div className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full text-amber-600" role="status">
                                    <span className="sr-only">Loading...</span>
                                </div>
                                <span className="ml-2">Saving...</span>
                            </div>
                        ) : (
                            <>
                                <FiSave className="-ml-1 mr-2 h-5 w-5" />
                                Save
                            </>
                        )}
                    </button>
                    <ThermalPrinter data={{
                        tokenNo: tableData.map(row => row.tokenNo),
                        date: tableData.map(row => row.date),
                        time: tableData.map(row => row.time),
                        name: tableData.map(row => row.name),
                        weight: tableData.map(row => row.weight),
                        exGold: tableData.map(row => row.exGold),
                    }} />
                </div>
            </div>
        </div>
    );
};

export default PureExchange;
