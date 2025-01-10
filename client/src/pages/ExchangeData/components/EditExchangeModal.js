import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const EditExchangeModal = ({ exchange, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        tokenNo: '',
        date: '',
        time: '',
        weight: '',
        highest: '',
        hWeight: '',
        average: '',
        aWeight: '',
        goldFineness: '',
        gWeight: '',
        exGold: '',
        exWeight: ''
    });

    useEffect(() => {
        if (exchange) {
            setFormData(exchange);
        }
    }, [exchange]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-amber-900">Edit Exchange Entry</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FiX className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 text-white text-sm">
                    <div>
                        <label className="block text-sm text-amber-700">Token Number</label>
                        <input
                            type="text"
                            name="tokenNo"
                            value={formData.tokenNo}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Date</label>
                        <input
                            type="text"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Time</label>
                        <input
                            type="text"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Highest</label>
                        <input
                            type="number"
                            step="0.01"
                            name="highest"
                            value={formData.highest}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">H.Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            name="hWeight"
                            value={formData.hWeight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Average</label>
                        <input
                            type="number"
                            step="0.01"
                            name="average"
                            value={formData.average}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">A.Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            name="aWeight"
                            value={formData.aWeight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Gold Fineness</label>
                        <input
                            type="number"
                            step="0.01"
                            name="goldFineness"
                            value={formData.goldFineness}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">G.Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            name="gWeight"
                            value={formData.gWeight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Ex.Gold</label>
                        <input
                            type="number"
                            step="0.01"
                            name="exGold"
                            value={formData.exGold}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-amber-700">Ex.Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            name="exWeight"
                            value={formData.exWeight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-1 px-3"
                        />
                    </div>

                    <div className="col-span-2 flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-amber-300 text-amber-700 rounded-md hover:bg-amber-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditExchangeModal;
