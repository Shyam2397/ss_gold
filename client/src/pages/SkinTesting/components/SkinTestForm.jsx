import React from 'react';
import FormInput from '../components/FormInput';
import { formatDateForInput, formatTimeForInput } from '../utils/validation';
import { 
  FiHash, 
  FiSave, 
  FiPrinter, 
  FiRotateCcw,
  FiAlertCircle,
  FiCheckCircle 
} from 'react-icons/fi';
import { GiTestTubes } from 'react-icons/gi';

const customerFields = {
  tokenNo: '',
  date: '',
  time: '',
};
const tokenFields = {
  name: '',
  weight: '',
  sample: '',
};

const SkinTestForm = ({
  formData,
  isEditing,
  error,
  success,
  loading,
  sum,
  handleTokenChange,
  handleChange,
  handleSubmit,
  handleReset,
  handlePrint,
  getFieldIcon,
}) => (
  <div className="bg-white rounded-lg shadow-sm p-4 border border-amber-100">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center">
        <GiTestTubes className="w-6 h-6 text-amber-600 mr-3" />
        <h2 className="text-xl font-bold text-amber-900">Skin Testing</h2>
      </div>
      {error && (
        <div className="p-1 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex items-center">
            <FiAlertCircle className="text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="p-1 bg-green-50 border-l-4 border-green-500 rounded">
          <div className="flex items-center">
            <FiCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}
    </div>
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer and Token Fields */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100 shadow-sm">
        {[...Object.keys(customerFields), ...Object.keys(tokenFields)].sort((a, b) => {
          const order = [
            'tokenNo', 'date', 'time', 
            'name', 'weight', 'sample'
          ];
          return order.indexOf(a) - order.indexOf(b);
        }).map((key) => {
          let inputValue = formData[key] || '';
          let inputType = 'text';
          if (key === 'date') {
            inputType = 'date';
            inputValue = formatDateForInput(inputValue);
          } else if (key === 'time') {
            inputType = 'time';
            inputValue = formatTimeForInput(inputValue);
          }
          return (
            <FormInput
              key={key}
              label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              name={key}
              value={inputValue}
              onChange={key === 'tokenNo' ? handleTokenChange : handleChange}
              icon={key === 'tokenNo' ? FiHash : getFieldIcon(key)}
              size="base"
              readOnly={isEditing && key === 'tokenNo'}
              placeholder={key === 'tokenNo' ? 'Enter token number' : ''}
              type={inputType}
            />
          );
        })}
      </div>
      {/* Test Results */}
      <div className={`grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9 gap-4 ${loading ? 'opacity-50' : ''}`}>
        {Object.keys(formData)
          .filter(key => {
            const excludedFields = [
              'tokenNo', 'tokenno',
              'date', 'time', 'name', 'weight', 
              'sample', 'code', 'phoneNumber'
            ];
            return !excludedFields.includes(key) && 
              !Object.keys(customerFields).includes(key) && 
              !Object.keys(tokenFields).includes(key) &&
              !/token/i.test(key);
          })
          .map((key) => (
            <FormInput
              key={key}
              label={key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              name={key}
              value={formData[key]}
              onChange={handleChange}
              icon={getFieldIcon(key)}
              size="base"
              readOnly={loading}
            />
          ))}
      </div>
      <div className="flex justify-end space-x-3">
        {sum > 0 && (
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
            <div className="flex">
              <div className="ml-2">
                <p className="text-sm font-medium text-amber-800">
                  Total Sum: {sum.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center px-3 py-2 border border-amber-200 text-amber-700 rounded-2xl hover:bg-amber-50 transition-all"
        >
          <FiRotateCcw className="mr-2 h-4 w-4" />
          Reset
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-2xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all"
        >
          <FiSave className="mr-2 h-4 w-4" />
          Save Test
        </button>
        <button
          type="button"
          onClick={() => handlePrint(formData)}
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-2xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all"
        >
          <FiPrinter className="mr-2 h-4 w-4" />
          Print
        </button>
      </div>
    </form>
  </div>
);

export default React.memo(SkinTestForm);
