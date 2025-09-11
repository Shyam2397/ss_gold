export const calculateBalance = (transactions, openingBalance = 0) => {
  return transactions.reduce((total, t) => {
    if (t.type === 'Income') return total + parseFloat(t.credit || 0);
    if (t.type === 'Expense') return total - parseFloat(t.debit || 0);
    return total;
  }, parseFloat(openingBalance));
};

export const processTransactions = (transactions, cashInfo) => {
  if (!transactions.length) return { categories: [], monthly: [] };
  
  const expenseMap = new Map();
  const monthlyMap = new Map();
  let totalAdditions = 0;
  let totalDeductions = 0;

  transactions.forEach(transaction => {
    if (transaction.isAdjustment) {
      if (transaction.type === 'Income') {
        totalAdditions += parseFloat(transaction.credit || 0);
      } else if (transaction.type === 'Expense') {
        totalDeductions += parseFloat(transaction.debit || 0);
      }
    } else if (transaction?.type === 'Expense' && transaction?.particulars) {
      const category = typeof transaction.particulars === 'string' 
        ? transaction.particulars.split(' - ')[0]
        : 'Other';
      expenseMap.set(category, (expenseMap.get(category) || 0) + (transaction.debit || 0));
    }

    if (transaction?.date) {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-IN', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      const monthData = monthlyMap.get(monthKey) || { 
        month: monthKey,
        timestamp: date.getTime(),
        income: 0, 
        expense: 0, 
        pending: 0,
        total: 0
      };

      if (transaction.type === 'Income') {
        monthData.income += transaction.credit || 0;
        monthData.total += transaction.credit || 0;
      } else if (transaction.type === 'Expense') {
        monthData.expense += transaction.debit || 0;
        monthData.total -= transaction.debit || 0;
      } else if (transaction.type === 'Pending') {
        monthData.pending += transaction.debit || 0;
      }

      monthlyMap.set(monthKey, monthData);
    }
  });

  if (totalDeductions > 0) {
    expenseMap.set('Cash Adjustments', (expenseMap.get('Cash Adjustments') || 0) + totalDeductions);
  }

  const sortedCategories = Array.from(expenseMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const monthlyData = Array.from(monthlyMap.values())
    .sort((a, b) => b.timestamp - a.timestamp);

  return { categories: sortedCategories, monthly: monthlyData };
};

export const processTransactionTotals = (transactions, cashInfo) => {
  const totals = {
    totalIncome: 0,
    totalExpense: 0,
    totalPending: 0,
    incomeSources: [],
    tokenIncome: 0,
    adjustmentIncome: 0,
    paidPendingIncome: 0
  };

  transactions.forEach((transaction) => {
    if (transaction.isAdjustment) {
      if (transaction.type === 'Income') {
        totals.totalIncome += parseFloat(transaction.credit || 0);
        totals.adjustmentIncome += parseFloat(transaction.credit || 0);
      } else if (transaction.type === 'Expense') {
        totals.totalExpense += parseFloat(transaction.debit || 0);
      }
      return;
    }

    const amount = parseFloat(transaction.amount || 0);
    const isPaid = transaction.isPaid;
    const type = transaction.type;
    const source = transaction.source || 'token';
    
    if (type === 'Income' || type === 'Pending') {
      if (amount > 0) {
        if (type === 'Pending' && !isPaid) {
          transaction.debit = amount;
          transaction.credit = 0;
          totals.totalPending += amount;
          
          totals.incomeSources.push({
            type: 'Pending',
            source,
            amount,
            id: transaction.id,
            isPaid: false
          });
        } else {
          transaction.credit = amount;
          transaction.debit = 0;
          totals.totalIncome += amount;
          
          if (source === 'token') {
            totals.tokenIncome += amount;
          }
          
          totals.incomeSources.push({
            type: isPaid ? 'Paid Pending' : 'Income',
            source,
            amount,
            id: transaction.id,
            isPaid: true
          });
        }
      }
    } else if (type === 'Expense' && !transaction.isAdjustment) {
      const expenseAmount = parseFloat(transaction.debit || 0);
      if (expenseAmount > 0) {
        totals.totalExpense += expenseAmount;
      }
    }
  });

  return totals;
};
