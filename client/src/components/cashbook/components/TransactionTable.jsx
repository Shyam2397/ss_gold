import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';

// Move formatters outside component to avoid recreating them
const formatCurrencyValue = (value) => {
  if (typeof value !== 'number') return '0.00';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDateValue = (date) => {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  } catch (e) {
    return '';
  }
};

const TransactionTable = ({ filteredTransactions, cashInfo, rowGetter, totals }) => {
  const DateCell = useCallback(({ rowData }) => (
    <div className="text-center text-xs xs:text-sm text-amber-900 truncate py-2.5 px-3">
      {rowData.type === 'opening' ? (
        <span className="font-semibold">Opening Balance</span>
      ) : rowData.type === 'closing' ? (
        <span className="font-semibold">Closing Balance</span>
      ) : (
        new Date(rowData.date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      )}
    </div>
  ), []);

  // Memoize formatting functions
  const formatCurrency = useCallback((value) => {
    if (typeof value !== 'number') return '0.00';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return '';
    try {
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date(date));
    } catch (e) {
      return '';
    }
  }, []);

  // Memoize row class names
  const getRowClassName = useCallback(({ index }) => {
    return `${index === -1 
      ? 'bg-amber-500' 
      : index === 0 || index === filteredTransactions.length + 1
      ? 'bg-amber-50 sticky top-0 z-10 hover:bg-amber-100/40'
      : index % 2 === 0 
      ? 'bg-white hover:bg-amber-100/40' 
      : 'bg-amber-50/40 hover:bg-amber-100/40'
    } transition-colors text-amber-900 text-xs font-medium rounded overflow-hidden whitespace-nowrap`;
  }, [filteredTransactions.length]);

  // Memoize column renderers
  const columnRenderers = useMemo(() => ({
    date: ({ rowData }) => (
      <div className="text-center text-xs xs:text-sm text-amber-900 truncate py-2.5 px-3 h-full flex items-center justify-center">
        {rowData.type === 'opening' ? (
          <span className="font-semibold">Opening Balance</span>
        ) : rowData.type === 'closing' ? (
          <span className="font-semibold">Closing Balance</span>
        ) : (
          formatDateValue(rowData.date)
        )}
      </div>
    ),
    particulars: ({ rowData }) => {
      if (rowData.type === 'opening' || rowData.type === 'closing') {
        return <div className="text-[10px] xs:text-xs text-amber-900 truncate py-2.5 px-3 h-full flex items-center">-</div>;
      }
      if (typeof rowData.particulars === 'object') {
        return (
          <div className="text-xs xs:text-sm text-amber-900 truncate py-2.5 px-3 flex items-center gap-1.5">
            <span className="font-medium">{rowData.particulars.test}</span>
            <span className="text-[10px] text-amber-600">•</span>
            <span className="text-[10px] text-amber-800">#{rowData.particulars.tokenNo}</span>
            <span className="text-[10px] text-amber-600">•</span>
            <span className="text-[10px] text-amber-500">
              {rowData.particulars.name?.substring(0, 15)}
              {rowData.particulars.name?.length > 15 ? '...' : ''}
            </span>
          </div>
        );
      }
      return (
        <div className="text-xs xs:text-sm text-amber-600 px-3 py-2.5 truncate h-full flex items-center">
          {rowData.particulars}
        </div>
      );
    },
    type: ({ rowData }) => (
      <div className="text-center text-[10px] xs:text-xs truncate py-2.5 px-3 h-full flex items-center justify-center">
        {rowData.type === 'opening' || rowData.type === 'closing' ? '' : (
          <span className={`px-2.5 py-0.5 rounded-full font-medium inline-block
            ${rowData.type === 'Income' ? 'bg-green-100 text-green-800' : 
              rowData.type === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'}`}>
            {rowData.paymentStatus || rowData.type}
          </span>
        )}
      </div>
    ),
    debit: ({ rowData }) => (
      <div className="text-right text-xs xs:text-sm text-amber-700 truncate py-2.5 px-3 h-full flex items-center justify-end">
        {rowData.type === 'opening' || rowData.type === 'closing' ? '-' :
         rowData.debit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    ),
    credit: ({ rowData }) => (
      <div className="text-right text-xs xs:text-sm text-amber-700 truncate py-2.5 px-3 h-full flex items-center justify-end">
        {rowData.type === 'opening' || rowData.type === 'closing' ? '-' :
         rowData.credit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    ),
    runningBalance: ({ rowData }) => (
      <div className="text-right text-xs xs:text-sm py-2.5 px-3 h-full flex items-center justify-end">
        {rowData.type === 'opening' ? (
          <div>
            <div className="font-medium text-amber-700 text-xs">
              ₹ {(cashInfo?.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {(cashInfo?.openingPending || 0) > 0 && (
              <div className="text-[10px] text-yellow-600 mt-0.5">
                Pending: ₹ {(cashInfo?.openingPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        ) : rowData.type === 'closing' ? (
          <div>
            <div className="font-medium text-amber-700">
              ₹ {(filteredTransactions.reduce((total, t) => {
                // For closing balance, include all credits and exclude pending debits
                if (t.type === 'Income') return total + (t.credit || 0);
                if (t.type === 'Expense') return total - (t.debit || 0);
                // Don't subtract pending amounts from closing balance
                return total;
              }, cashInfo?.openingBalance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {(totals?.totalPending || 0) > 0 && (
              <div className="text-[10px] text-yellow-600 mt-0.5">
                Pending: ₹ {(totals?.totalPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <span className={`font-medium ${
              rowData.type === 'Pending' ? 'text-yellow-600' : 'text-green-600'
            }`}>
              ₹ {(filteredTransactions.slice(0, filteredTransactions.findIndex(t => t.id === rowData.id) + 1)
                .reduce((total, t) => {
                  if (t.type === 'Income') return total + (t.credit || 0);
                  if (t.type === 'Expense') return total - (t.debit || 0);
                  // Don't subtract pending amounts from running balance
                  return total;
                }, cashInfo?.openingBalance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    )
  }), [cashInfo, filteredTransactions, totals]);

  console.log(filteredTransactions);
  console.log(cashInfo);

  const cellRenderer = ({ columnIndex, rowIndex, key, style }) => {
    const transaction = rowGetter({ index: rowIndex });
    if (!transaction) return null;

    const getContent = () => {
      if (transaction.type === 'opening') {
        switch (columnIndex) {
          case 0: return <span className="text-gray-600">Opening Balance</span>;
          case 1: return '';
          case 2: return '';
          case 3: return <span className="font-medium text-gray-900">{formatCurrency(cashInfo?.openingBalance || 0)}</span>;
          default: return '';
        }
      }

      if (transaction.type === 'closing') {
        const finalBalance = filteredTransactions.reduce((total, t) => {
          if (t.type === 'Income' || t.type === 'Pending') {
            return total + (t.credit || 0) - (t.debit || 0);
          } else if (t.type === 'Expense') {
            return total - (t.debit || 0);
          }
          return total;
        }, cashInfo?.openingBalance || 0);

        switch (columnIndex) {
          case 0: return <span className="text-gray-600">Closing Balance</span>;
          case 1: return '';
          case 2: return '';
          case 3: return <span className="font-medium text-gray-900">{formatCurrency(finalBalance)}</span>;
          default: return '';
        }
      }

      switch (columnIndex) {
        case 0:
          return formatDate(transaction.date);
        case 1:
          if (typeof transaction.particulars === 'object') {
            return (
              <div>
                <div className="font-medium">{transaction.particulars?.test || 'N/A'}</div>
                <div className="text-sm text-gray-500">
                  #{transaction.particulars?.tokenNo || 'N/A'} - {transaction.particulars?.name || 'N/A'}
                </div>
              </div>
            );
          }
          return transaction.particulars || '';
        case 2:
          return formatCurrency(transaction.debit || 0);
        case 3:
          return formatCurrency(transaction.credit || 0);
        case 4:
          const currentIndex = filteredTransactions.findIndex(t => t.id === transaction.id);
          const runningBalance = filteredTransactions
            .slice(0, currentIndex + 1)
            .reduce((total, t) => {
              if (t.type === 'Income' || t.type === 'Pending') {
                return total + (t.credit || 0) - (t.debit || 0);
              } else if (t.type === 'Expense') {
                return total - (t.debit || 0);
              }
              return total;
            }, cashInfo?.openingBalance || 0);
          return formatCurrency(runningBalance);
        default:
          return '';
      }
    };

    return (
      <div key={key} style={style} className="cell">
        {getContent()}
      </div>
    );
  };

  // Move header renderer to separate memoized component
  const HeaderRenderer = useCallback(({ label, alignRight }) => (
    <div className={`flex items-center h-full px-3 py-2.5 font-semibold text-xs xs:text-sm text-amber-700 uppercase tracking-wider ${alignRight ? 'justify-end' : 'justify-center'}`}>
      {label}
    </div>
  ), []);

  HeaderRenderer.propTypes = {
    label: PropTypes.string.isRequired,
    alignRight: PropTypes.bool
  };

  // Remove opening/closing from virtualized table, so only transaction rows remain
  const transactionRowGetter = useCallback(
    ({ index }) => filteredTransactions[index],
    [filteredTransactions]
  );

  // Sticky row components
  const OpeningBalanceRow = () => (
    <div className="bg-amber-50 sticky top-0 z-20 flex w-full border-b border-amber-100">
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[120px] min-w-[100px] flex items-center justify-center text-xs xs:text-sm font-semibold text-amber-900 py-2.5 px-3 overflow-hidden whitespace-nowrap">
          <span className="truncate">Opening Balance</span>
        </div>
        <div className="flex-1 flex items-center text-xs xs:text-sm text-amber-900 py-2.5 px-3">-</div>
        <div className="w-[90px] min-w-[80px] flex items-center justify-center text-xs xs:text-sm text-amber-900 py-2.5 px-3"></div>
        <div className="w-[110px] min-w-[100px] flex items-center justify-end text-xs xs:text-sm text-amber-700 py-2.5 px-3">-</div>
        <div className="w-[110px] min-w-[100px] flex items-center justify-end text-xs xs:text-sm text-amber-700 py-2.5 px-3">-</div>
        <div className="w-[120px] min-w-[110px] flex items-center justify-end overflow-hidden">
          <div className="flex flex-col items-center text-xs xs:text-sm py-2.5 px-3 font-medium text-amber-700 overflow-hidden">
            <span className="whitespace-nowrap text-sm">
              ₹ {(cashInfo?.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {(cashInfo?.openingPending || 0) > 0 && (
              <span className="text-xs text-yellow-600 whitespace-nowrap">
                Pending: ₹ {(cashInfo?.openingPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const ClosingBalanceRow = () => {
    const finalBalance = filteredTransactions.reduce(
      (total, t) => {
        if (t.type === 'Income') return total + (t.credit || 0);
        if (t.type === 'Expense') return total - (t.debit || 0);
        // Add adjustment handling
        if (t.isAdjustment) {
          return t.credit ? total + t.credit : total - t.debit;
        }
        return total;
      },
      cashInfo?.openingBalance || 0
    );
    
    return (
      <div className="bg-amber-50 sticky bottom-0 z-20 flex w-full border-t border-amber-100">
        <div className="flex-1 flex overflow-hidden">
          <div className="w-[120px] min-w-[100px] flex items-center justify-center text-xs xs:text-sm font-semibold text-amber-900 py-2.5 px-3 overflow-hidden whitespace-nowrap">
            <span className="truncate">Closing Balance</span>
          </div>
          <div className="flex-1 flex items-center text-xs xs:text-sm text-amber-900 py-2.5 px-3">-</div>
          <div className="w-[90px] min-w-[80px] flex items-center justify-center text-xs xs:text-sm text-amber-900 py-2.5 px-3"></div>
          <div className="w-[110px] min-w-[100px] flex items-center justify-end text-xs xs:text-sm text-amber-700 py-2.5 px-3">-</div>
          <div className="w-[110px] min-w-[100px] flex items-center justify-end text-xs xs:text-sm text-amber-700 py-2.5 px-3">-</div>
          <div className="w-[120px] min-w-[110px] flex items-center overflow-hidden">
            <div className="text-sm xs:text-sm py-2.5 px-3 font-medium text-amber-700 whitespace-nowrap">
              ₹ {finalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[70vh] lg:h-[calc(93vh-170px)] overflow-hidden border border-amber-100 rounded-lg flex flex-col">
      <OpeningBalanceRow />
      <div className="flex-1 overflow-auto">
        <AutoSizer>
          {({ width, height }) => (
            <Table
              width={width}
              height={height}
              headerHeight={40}
              rowHeight={42}
              rowCount={filteredTransactions.length}
              rowGetter={transactionRowGetter}
              overscanRowCount={10}
              scrollToIndex={0}
              estimatedRowSize={42}
              defaultHeight={400}
              rowClassName={getRowClassName}
            >
              <Column
                label="Date"
                dataKey="date"
                width={120}
                minWidth={100}
                flexShrink={0}
                headerRenderer={({ label }) => (
                  <HeaderRenderer label={label} alignRight={false} />
                )}
                cellRenderer={columnRenderers.date}
                className="text-[10px] xs:text-xs"
              />
              <Column
                label="Particulars"
                dataKey="particulars"
                width={180}
                minWidth={120}
                flexGrow={1}
                headerRenderer={({ label }) => (
                  <HeaderRenderer label={label} alignRight={false} />
                )}
                cellRenderer={columnRenderers.particulars}
                className="text-[10px] xs:text-xs"
              />
              <Column
                label="Type"
                dataKey="type"
                width={90}
                minWidth={80}
                headerRenderer={({ label }) => (
                  <HeaderRenderer label={label} alignRight={false} />
                )}
                cellRenderer={columnRenderers.type}
                className="text-[10px] xs:text-xs"
              />
              <Column
                label="Debit"
                dataKey="debit"
                width={110}
                minWidth={100}
                headerRenderer={({ label }) => (
                  <HeaderRenderer label={label} alignRight={true} />
                )}
                cellRenderer={columnRenderers.debit}
                className="text-[10px] xs:text-xs text-right font-mono"
              />
              <Column
                label="Credit"
                dataKey="credit"
                width={110}
                minWidth={100}
                headerRenderer={({ label }) => (
                  <HeaderRenderer label={label} alignRight={true} />
                )}
                cellRenderer={columnRenderers.credit}
                className="text-[10px] xs:text-xs text-right font-mono"
              />
              <Column
                label="Balance"
                dataKey="runningBalance"
                width={120}
                minWidth={110}
                headerRenderer={({ label }) => (
                  <HeaderRenderer label={label} alignRight={true} />
                )}
                cellRenderer={columnRenderers.runningBalance}
                className="text-[10px] xs:text-xs text-right font-mono"
              />
            </Table>
          )}
        </AutoSizer>
      </div>
      <ClosingBalanceRow />
    </div>
  );
};

TransactionTable.propTypes = {
  filteredTransactions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    date: PropTypes.string,
    particulars: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        test: PropTypes.string,
        tokenNo: PropTypes.string,
        name: PropTypes.string
      })
    ]),
    type: PropTypes.oneOf(['Income', 'Expense', 'Pending', 'opening', 'closing']),
    debit: PropTypes.number,
    credit: PropTypes.number
  })).isRequired,
  cashInfo: PropTypes.shape({
    openingBalance: PropTypes.number,
    openingPending: PropTypes.number
  }).isRequired,
  rowGetter: PropTypes.func.isRequired,
  totals: PropTypes.shape({
    totalPending: PropTypes.number,
    totalIncome: PropTypes.number,
    totalExpense: PropTypes.number
  })
};

export default React.memo(TransactionTable);
