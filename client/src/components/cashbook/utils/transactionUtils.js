export const calculateBalance = (transactions, openingBalance = 0) => {
  return transactions.reduce((total, t) => {
    if (t.type === 'Income') return total + parseFloat(t.credit || 0);
    if (t.type === 'Expense') return total - parseFloat(t.debit || 0);
    return total;
  }, parseFloat(openingBalance));
};

export const processTransactions = (transactions) => {
  if (!transactions.length) return { categories: [] };
  
  const expenseMap = new Map();

  transactions.forEach(transaction => {
    // Skip adjustments from category summary — they're not regular expenses
    if (transaction.isAdjustment) return;

    // Category summary — only regular expenses
    if (transaction?.type === 'Expense' && transaction?.particulars) {
      const category = typeof transaction.particulars === 'string' 
        ? transaction.particulars.split(' - ')[0]
        : 'Other';
      expenseMap.set(category, (expenseMap.get(category) || 0) + (parseFloat(transaction.debit) || 0));
    }
  });

  const categories = Array.from(expenseMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return { categories };
};

export const processTransactionTotals = (transactions, cashInfo) => {
  const previousPendingTokenIds = cashInfo.previousPendingTokenIds || [];
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
    const wasPending = previousPendingTokenIds.includes(transaction.id);
    
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

          // Track income from previously pending tokens (to avoid double-counting in netChange)
          if (wasPending) {
            totals.paidPendingIncome += amount;
          }
          
          if (source === 'token') {
            totals.tokenIncome += amount;
          }
          
          totals.incomeSources.push({
            type: wasPending ? 'Paid Pending' : 'Income',
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
