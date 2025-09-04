import Decimal from 'decimal.js';

export const calculateBalance = (transactions, openingBalance = '0') => {
  return transactions.reduce((total, t) => {
    const amount = new Decimal(t.amount || '0');
    if (t.type === 'Income') return total.plus(amount);
    if (t.type === 'Expense') return total.minus(amount);
    return total;
  }, new Decimal(openingBalance));
};
