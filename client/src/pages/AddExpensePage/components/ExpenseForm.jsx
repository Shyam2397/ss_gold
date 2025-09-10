import React from 'react';
import { useExpenseForm } from '../context/ExpenseFormContext';
import DateField from './FormFields/DateField';
import ExpenseTypeField from './FormFields/ExpenseTypeField';
import AmountField from './FormFields/AmountField';
import PaidToField from './FormFields/PaidToField';
import PaymentModeField from './FormFields/PaymentModeField';
import RemarksField from './FormFields/RemarksField';

const ExpenseForm = ({ onSubmit }) => {
  const { state, dispatch } = useExpenseForm();
  const { formData, expenseTypes, loading } = state;

  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name, value });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 py-3 sm:py-4 px-3 sm:px-6 bg-amber-50/50 rounded-lg border border-amber-100 text-amber-900">
        <div className="xs:col-span-2 md:col-span-3 lg:col-span-1">
          <DateField value={formData.date} onChange={handleChange} />
        </div>
        <div className="xs:col-span-2 md:col-span-3 lg:col-span-1">
          <ExpenseTypeField 
            value={formData.expenseType} 
            onChange={handleChange} 
            expenseTypes={expenseTypes} 
          />
        </div>
        <div className="xs:col-span-1">
          <AmountField value={formData.amount} onChange={handleChange} />
        </div>
        <div className="xs:col-span-1">
          <PaidToField value={formData.paidTo} onChange={handleChange} />
        </div>
        <div className="xs:col-span-2 md:col-span-3 lg:col-span-1">
          <PaymentModeField value={formData.payMode} onChange={handleChange} />
        </div>
        <div className="xs:col-span-2 md:col-span-3 lg:col-span-5">
          <RemarksField value={formData.remarks} onChange={handleChange} />
        </div>
      </div>
    </form>
  );
};

export default ExpenseForm;
