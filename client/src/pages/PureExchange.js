import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FiSave,
    FiRotateCcw,
    FiAlertCircle,
    FiPlus,
} from 'react-icons/fi';
import { GiGoldBar } from 'react-icons/gi';

const headingIconVariants = {
    initial: { scale: 0.8, rotate: -180 },
    animate: { scale: 1, rotate: 0, transition: { type: "spring" } },
    hover: { scale: 1.1, rotate: 5, transition: { duration: 0.2 } }
};

const FormInput = ({ label, name, value, onChange, readOnly = false, className }) => {
    return (
        <div className={`form-control w-full ${className}`}>
            <label className="block text-sm font-medium text-amber-900 mb-1">
                {label}
            </label>
            <div className="relative rounded-md shadow-sm">
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    readOnly={readOnly}
                    className={`w-full pl-4 pr-10 py-2 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 ${
                        readOnly ? "bg-gray-50" : ""
                    }`}
                />
            </div>
        </div>
    );
};

const PureExchange = () => {
    const [tokenNo, setTokenNo] = useState('');
    const [point, setPoint] = useState('');
    const [tableData, setTableData] = useState([]);
    const [error, setError] = useState('');

    const handleAdd = () => {
        if (!tokenNo.trim()) {
            setError('Please enter a token number');
            return;
        }
        setError('');
        const newRow = {
            id: tableData.length + 1,
            tokenNo: tokenNo,
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString(),
            weight: '',
            highest: '',
            hWeight: '',
            average: '',
            aWeight: '',
            goldFineness: '',
            gWeight: '',
            exGold: '',
            exWeight: ''
        };
        setTableData([...tableData, newRow]);
        setTokenNo('');
        setPoint('');
    };

    const handleSave = () => {
        // Save logic here
        console.log('Saving data:', tableData);
    };

    const handleReset = () => {
        setTokenNo('');
        setPoint('');
        setTableData([]);
        setError('');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-amber-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <motion.div
                            variants={headingIconVariants}
                            initial="initial"
                            animate="animate"
                            whileHover="hover"
                            className="mr-3"
                        >
                            <GiGoldBar className="w-8 h-8 text-amber-600" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-amber-900">Pure Exchange</h2>
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

                {/* Input Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-lg mb-6">
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
                        <div className=" h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-amber-100">
                            <table className="min-w-full divide-y divide-amber-200">
                                <thead className="bg-gradient-to-r from-amber-500 to-yellow-500 sticky top-0 z-10">
                                    <tr>
                                        {[
                                            'S.no', 'Token-no', 'Date', 'Time', 'weight',
                                            'highest', 'H.weight', 'average', 'A.weight',
                                            'Gold-fineness', 'G.weight', 'ex-gold', 'ex.weight'
                                        ].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-2 text-left text-sm font-medium text-white uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-amber-100">
                                    {tableData.map((row, index) => (
                                        <motion.tr
                                            key={index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-amber-50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-900">{row.id}</td>
                                            <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-amber-900">{row.tokenNo}</td>
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
                                            <td className="px-6 py-3 whitespace-nowrap text-sm text-amber-700">{row.exWeight}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
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
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-200"
                    >
                        <FiSave className="-ml-1 mr-2 h-5 w-5" />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PureExchange;
