import React, { Suspense } from 'react';
import { useExpenseForm } from '../context/ExpenseFormContext';
import { lazyLoad } from '../../../components/common/LazyLoad';

// Lazy load form field components
const LazyDateField = lazyLoad(() => import('./FormFields/DateField'));
const LazyExpenseTypeField = lazyLoad(() => import('./FormFields/ExpenseTypeField'));
const LazyAmountField = lazyLoad(() => import('./FormFields/AmountField'));
const LazyPaidToField = lazyLoad(() => import('./FormFields/PaidToField'));
const LazyPaymentModeField = lazyLoad(() => import('./FormFields/PaymentModeField'));
const LazyRemarksField = lazyLoad(() => import('./FormFields/RemarksField'));
const LazyFormActions = lazyLoad(() => import('./FormActions'));

// Loading component for form fields
const FieldLoading = () => (
  <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
);

const ExpenseForm = ({ 
  onSubmit, 
  onReset, 
  onOpenMasterExpense, 
  loading: isLoading, 
  isEditing,
  isMasterExpenseOpen = false 
}) => {
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
          <Suspense fallback={<FieldLoading />}>
            <LazyDateField value={formData.date} onChange={handleChange} />
          </Suspense>
        </div>
        <div className="xs:col-span-2 md:col-span-3 lg:col-span-1">
          <Suspense fallback={<FieldLoading />}>
            <LazyExpenseTypeField 
              value={formData.expenseType} 
              onChange={handleChange} 
              expenseTypes={expenseTypes} 
            />
          </Suspense>
        </div>
        <div className="xs:col-span-1">
          <Suspense fallback={<FieldLoading />}>
            <LazyAmountField value={formData.amount} onChange={handleChange} />
          </Suspense>
        </div>
        <div className="xs:col-span-1">
          <Suspense fallback={<FieldLoading />}>
            <LazyPaidToField value={formData.paidTo} onChange={handleChange} />
          </Suspense>
        </div>
        <div className="xs:col-span-2 md:col-span-3 lg:col-span-1">
          <Suspense fallback={<FieldLoading />}>
            <LazyPaymentModeField value={formData.payMode} onChange={handleChange} />
          </Suspense>
        </div>
        <div className="xs:col-span-2 md:col-span-3 lg:col-span-5">
          <Suspense fallback={<FieldLoading />}>
            <LazyRemarksField value={formData.remarks} onChange={handleChange} />
          </Suspense>
        </div>
      </div>
      
      <Suspense fallback={<div className="h-12 bg-gray-100 rounded animate-pulse mt-4"></div>}>
        <LazyFormActions
          loading={isLoading}
          onReset={onReset}
          onOpenMasterExpense={onOpenMasterExpense}
          isEditing={isEditing}
          isMasterExpenseOpen={isMasterExpenseOpen}
        />
      </Suspense>
    </form>
  );
};

export default ExpenseForm;
