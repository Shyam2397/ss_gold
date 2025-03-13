import React, { useState, useEffect } from 'react';
import { FiX, FiLoader } from 'react-icons/fi';

const EditExchangeModal = ({ exchange, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        tokenno: '',
        date: '',
        time: '',
        weight: '',
        highest: '',
        hweight: '',
        average: '',
        aweight: '',
        goldfineness: '',
        gweight: '',
        exgold: '',
        exweight: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (exchange) {
            setFormData({
                tokenno: exchange.token_no || '',
                date: exchange.date || '',
                time: exchange.time || '',
                weight: exchange.weight || '',
                highest: exchange.highest || '',
                hweight: exchange.hweight || '',
                average: exchange.average || '',
                aweight: exchange.aweight || '',
                goldfineness: exchange.goldfineness || '',
                gweight: exchange.gweight || '',
                exgold: exchange.exgold || '',
                exweight: exchange.exweight || ''
            });
        }
    }, [exchange]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Format weight fields to exactly 3 decimal places
        if (['weight', 'hweight', 'aweight', 'gweight', 'exweight'].includes(name)) {
            const numValue = parseFloat(value || 0);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(numValue) ? '' : numValue.toFixed(3)
            }));
        } else if (['highest', 'average', 'goldfineness', 'exgold'].includes(name)) {
            const numValue = parseFloat(value || 0);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(numValue) ? '' : numValue.toFixed(2)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onUpdate(formData);
            onClose();
        } catch (error) {
            console.error('Error updating exchange:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-amber-900">Edit Exchange Entry</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isSubmitting}
                    >
                        <FiX className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-amber-700">Token Number</label>
                        <input
                            type="text"
                            name="tokenno"
                            value={formData.tokenno}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                            readOnly
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Date</label>
                        <input
                            type="text"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Time</label>
                        <input
                            type="text"
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Highest</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="highest"
                            value={formData.highest}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Highest Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            name="hweight"
                            value={formData.hweight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Average</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="average"
                            value={formData.average}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Average Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            name="aweight"
                            value={formData.aweight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Gold Fineness</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="goldfineness"
                            value={formData.goldfineness}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Gold Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            name="gweight"
                            value={formData.gweight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Exchange Gold</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="exgold"
                            value={formData.exgold}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-amber-700">Exchange Weight</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            name="exweight"
                            value={formData.exweight}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded-md border-amber-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 p-2"
                        />
                    </div>

                    <div className="col-span-2 flex justify-end space-x-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 border border-transparent rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center space-x-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <FiLoader className="animate-spin h-4 w-4" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <span>Update Exchange</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditExchangeModal;
