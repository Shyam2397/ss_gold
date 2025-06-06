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

const TransactionTable = ({ filteredTransactions, cashInfo, rowGetter }) => {
  const DateCell = useCallback(({ rowData }) => (
    <div className="text-center text-xs text-amber-900 truncate py-3.5 px-4">
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
      ? 'bg-amber-50 hover:bg-amber-100/40'
      : index % 2 === 0 
      ? 'bg-white hover:bg-amber-100/40' 
      : 'bg-amber-50/40 hover:bg-amber-100/40'
    } transition-colors text-amber-900 text-xs font-medium rounded`;
  }, [filteredTransactions.length]);

  // Memoize column renderers
  const columnRenderers = useMemo(() => ({
    date: ({ rowData }) => (
      <div className="text-center text-xs text-amber-900 truncate py-3.5 px-4">
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
        return <div className="text-xs text-amber-900 truncate py-3.5 px-4">-</div>;
      }
      if (typeof rowData.particulars === 'object') {
        return (
          <div className="text-xs text-amber-900 truncate py-2.5 px-4 flex items-center gap-1.5">
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
        <div className="text-xs text-amber-900 truncate py-3.5 px-4">
          {rowData.particulars}
        </div>
      );
    },
    type: ({ rowData }) => (
      <div className="text-center text-xs truncate py-3.5 px-4">
        {rowData.type === 'opening' || rowData.type === 'closing' ? '' : (
          <span className={`px-2.5 py-0.5 rounded-full font-medium inline-block
            ${rowData.type === 'Income' ? 'bg-green-100 text-green-800' : 
              rowData.type === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'}`}>
            {rowData.type}
          </span>
        )}
      </div>
    ),
    debit: ({ rowData }) => (
      <div className="text-right text-xs text-amber-700 truncate py-3.5 px-4">
        {rowData.type === 'opening' || rowData.type === 'closing' ? '-' :
         rowData.debit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    ),
    credit: ({ rowData }) => (
      <div className="text-right text-xs text-amber-700 truncate py-3.5 px-4">
        {rowData.type === 'opening' || rowData.type === 'closing' ? '-' :
         rowData.credit?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    ),
    runningBalance: ({ rowData }) => (
      <div className="text-right text-xs py-3.5 px-4">
        {rowData.type === 'opening' ? (
          <div>
            <div className="font-medium text-amber-700">
              ₹ {(cashInfo?.openingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            {(cashInfo?.openingPending || 0) > 0 && (
              <div className="text-[10px] text-yellow-600 mt-0.5">
                Pending: ₹ {(cashInfo?.openingPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            )}
          </div>
        ) : rowData.type === 'closing' ? (
          <div className="font-medium text-amber-700">
            ₹ {(filteredTransactions.reduce((total, t) => total + (t.credit || 0) - (t.debit || 0), cashInfo?.openingBalance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        ) : (
          <span className={`font-medium text-green-600`}>
            ₹ {(filteredTransactions.slice(0, filteredTransactions.findIndex(t => t.id === rowData.id) + 1).reduce((total, t) => total + (t.credit || 0) - (t.debit || 0), cashInfo?.openingBalance || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    )
  }), [cashInfo, filteredTransactions]);

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
          return total + (t.credit || 0) - (t.debit || 0);
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
              return total + (t.credit || 0) - (t.debit || 0);
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
  const HeaderRenderer = React.memo(({ label, alignRight }) => (
    <div className={`text-xs font-medium text-white uppercase tracking-wider px-4 h-full flex items-center ${alignRight ? 'justify-end' : ''}`}>
      {label}
    </div>
  ));

  HeaderRenderer.propTypes = {
    label: PropTypes.string.isRequired,
    alignRight: PropTypes.bool
  };

  return (
    <div className="h-[65vh] lg:h-[calc(93vh-190px)]">
      <AutoSizer>
        {({ width, height }) => (
          <Table
            width={width}
            height={height}
            headerHeight={32}
            rowHeight={40}
            rowCount={filteredTransactions.length + 2}
            rowGetter={rowGetter}
            overscanRowCount={5}
            scrollToIndex={0}
            estimatedRowSize={48}
            defaultHeight={450}
            rowClassName={getRowClassName}
          >
            <Column
              label="Date"
              dataKey="date"
              width={100}
              flexShrink={0}
              headerRenderer={({ label }) => (
                <HeaderRenderer label={label} />
              )}
              cellRenderer={columnRenderers.date}
            />
            <Column
              label="Particulars"
              dataKey="particulars"
              width={300}
              flexGrow={1}
              headerRenderer={({ label }) => (
                <HeaderRenderer label={label} />
              )}
              cellRenderer={columnRenderers.particulars}
            />
            <Column
              label="Type"
              dataKey="type"
              width={120}
              headerRenderer={({ label }) => (
                <HeaderRenderer label={label} />
              )}
              cellRenderer={columnRenderers.type}
            />
            <Column
              label="Debit"
              dataKey="debit"
              width={120}
              headerRenderer={({ label }) => (
                <HeaderRenderer label={label} alignRight />
              )}
              cellRenderer={columnRenderers.debit}
            />
            <Column
              label="Credit"
              dataKey="credit"
              width={120}
              headerRenderer={({ label }) => (
                <HeaderRenderer label={label} alignRight />
              )}
              cellRenderer={columnRenderers.credit}
            />
            <Column
              label="Balance"
              dataKey="runningBalance"
              width={120}
              headerRenderer={({ label }) => (
                <HeaderRenderer label={label} alignRight />
              )}
              cellRenderer={columnRenderers.runningBalance}
            />
          </Table>
        )}
      </AutoSizer>
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
  rowGetter: PropTypes.func.isRequired
};

export default React.memo(TransactionTable);
