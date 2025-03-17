import { useMemo } from 'react';

const useSparklineData = ({ tokens, expenseData, entries, exchanges }) => {
  return useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return date;
    });

    // Helper function to get daily total
    const getDailyTotal = (items, dateField, valueField = 'totalAmount') => {
      return days.map(day => ({
        date: day,
        value: items
          .filter(item => {
            const itemDate = new Date(item[dateField].split('-').reverse().join('-'));
            return itemDate.toDateString() === day.toDateString();
          })
          .reduce((sum, item) => sum + (parseFloat(item[valueField]) || 0), 0)
      }));
    };

    // Revenue sparkline data
    const revenue = getDailyTotal(tokens, 'date');

    // Expenses sparkline data
    const expenses = getDailyTotal(expenseData, 'date', 'amount');

    // Profit sparkline data
    const profit = days.map((day, index) => ({
      date: day,
      value: revenue[index].value - expenses[index].value
    }));

    // Customers sparkline data
    const customers = days.map(day => ({
      date: day,
      value: entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate.toDateString() === day.toDateString();
      }).length
    }));

    // Skin tests sparkline data
    const skinTests = days.map(day => ({
      date: day,
      value: tokens.filter(token => {
        const tokenDate = new Date(token.date.split('-').reverse().join('-'));
        return tokenDate.toDateString() === day.toDateString() && token.testType === 'skin';
      }).length
    }));

    // Weights sparkline data
    const weights = days.map(day => ({
      date: day,
      value: exchanges
        .filter(exchange => {
          const exchangeDate = new Date(exchange.date.split('-').reverse().join('-'));
          return exchangeDate.toDateString() === day.toDateString();
        })
        .reduce((sum, exchange) => sum + parseFloat(exchange.weight || '0'), 0)
    }));

    return {
      revenue,
      expenses,
      profit,
      customers,
      skinTests,
      weights
    };
  }, [tokens, expenseData, entries, exchanges]);
};

export default useSparklineData;