import React, { useMemo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/validation';

const TableRow = ({ 
  skinTests, 
  initialFormData,
  onEdit, 
  onDelete,
  onPrint
}) => {
  // Optimize sorting with simpler logic
  const sortedTests = useMemo(() => {
    if (!skinTests.length) return [];
    return [...skinTests].sort((a, b) => {
      const tokenA = (a.tokenNo || a.tokenno || '').toString();
      const tokenB = (b.tokenNo || b.tokenno || '').toString();
      return tokenB.localeCompare(tokenA, undefined, { numeric: true });
    });
  }, [skinTests]);

  const handleWhatsAppShare = (rowData) => {
    const messageLines = [
      '*Dear Customer,*',
      '',
      `🔖 *Token No:* ${rowData.tokenNo || rowData.tokenno}`,
      `📅 *Date:* ${formatDateForDisplay(rowData.date)}`,
      `👤 *Name:* ${rowData.name}`,
      `⚖️ *Weight:* ${parseFloat(rowData.weight).toFixed(3)} g`,
      `🔍 *Sample:* ${rowData.sample}`,
      '',
      `✨ *RESULT:* *${parseFloat(rowData.gold_fineness).toFixed(2)}* %`,
      '',
      'SS GOLD TESTING,',
      'Nilakottai.',
      'For any doubt/clarification, please contact',
      '8903225544'
    ];

    if (rowData.remarks) {
      messageLines.push(`📝 *Remarks:* ${rowData.remarks}`);
    }

    const message = encodeURIComponent(messageLines.join('\n'));
    
    // Extract and validate phone number
    let phoneNumber = rowData.phoneNumber?.replace(/\D/g, '') || '';
    if (!phoneNumber) {
      const userInput = prompt('No phone number found. Please enter a phone number:');
      if (!userInput) return;
      phoneNumber = userInput.replace(/\D/g, '');
    }

    // Format phone number
    phoneNumber = phoneNumber.replace(/^0+/, '');
    if (phoneNumber.startsWith('91')) {
      phoneNumber = phoneNumber.substring(2);
    }

    // Validate phone number
    if (phoneNumber.length !== 10) {
      alert('Invalid phone number format. Please enter a 10-digit mobile number.');
      return;
    }

    // Add country code
    phoneNumber = '91' + phoneNumber;

    // Open WhatsApp
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const getColumns = () => {
    const columnOrder = [
      'tokenno', // Changed from 'tokenNo' to 'tokenno'
      'date',
      'time',
      'name',
      'weight',
      'sample',
      'highest',
      'average',
      'gold_fineness',
      'karat',
      'silver',
      'copper',
      'zinc',
      'cadmium',
      'nickel',
      'tungsten',
      'iridium',
      'ruthenium',
      'osmium',
      'rhodium',
      'rhenium',
      'indium',
      'titanium',
      'palladium',
      'platinum',
      'others',
      'remarks'
    ];

    if (skinTests.length > 0) {
      return columnOrder.filter(col => 
        Object.keys(skinTests[0]).includes(col) &&
        col !== 'code' && 
        col !== 'phoneNumber'
      );
    }
    return columnOrder.filter(col => 
      Object.keys(initialFormData).includes(col) &&
      col !== 'code' && 
      col !== 'phoneNumber'
    );
  };

  // Memoize columns configuration
  const columns = useMemo(() => getColumns(), [skinTests, initialFormData]);

  const getColumnWidth = (key) => {
    switch (key.toLowerCase()) {
      case 'tokenno':
        return 100; // Increased width for token number
      case 'date':
        return 80;
      case 'time':
        return 80;
      case 'name':
        return 180;
      case 'weight':
        return 80;
      case 'sample':
        return 180;
      case 'highest':
        return 100;
      case 'average':
        return 100;
      case 'gold_fineness':
        return 120;
      case 'karat':
        return 80;
      // Metal columns
      case 'silver':
      case 'copper':
      case 'zinc':
      case 'cadmium':
      case 'nickel':
      case 'tungsten':
      case 'iridium':
      case 'ruthenium':
      case 'osmium':
      case 'rhodium':
      case 'rhenium':
      case 'indium':
      case 'titanium':
      case 'palladium':
      case 'platinum':
      case 'others':
        return 80;
      case 'remarks':
        return 150;
      default:
        return 80;
    }
  };

  const renderActions = ({ rowData }) => (
    <div className="flex items-center justify-center space-x-2">
      <button 
        onClick={() => onEdit(rowData)}
        className="text-amber-600 hover:text-amber-900 p-1 rounded hover:bg-amber-50"
        title="Edit Test"
      >
        <FiEdit2 className="w-3.5 h-3.5" />
      </button>
      <button 
        onClick={() => {
          const tokenNo = rowData.tokenNo || rowData.tokenno || rowData.token_no;
          if (tokenNo) {
            onDelete(tokenNo.toString());
          }
        }}
        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
        title="Delete Test"
      >
        <FiTrash2 className="w-3.5 h-3.5" />
      </button>
      <button 
        onClick={() => handleWhatsAppShare(rowData)}
        className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50"
        title="Share on WhatsApp"
      >
        <FaWhatsapp className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const getCellValue = ({ dataKey, rowData }) => {
    let value = rowData[dataKey];
    
    // Special handling for token number
    if (dataKey === 'tokenno') {
      return rowData.tokenNo || rowData.tokenno || '-';
    }
    
    // Return "-" for null, undefined or empty values
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (dataKey === 'date') {
      return formatDateForDisplay(value);
    } else if (dataKey === 'time') {
      return formatTimeForDisplay(value);
    } else if (dataKey === 'weight') {
      return parseFloat(value).toFixed(3);
    } else if ([
      'highest',
      'average',
      'gold_fineness',
      'silver',
      'copper',
      'zinc',
      'cadmium',
      'nickel',
      'tungsten',
      'iridium',
      'ruthenium',
      'osmium',
      'rhodium',
      'rhenium',
      'indium',
      'titanium',
      'palladium',
      'platinum',
      'others'
    ].includes(dataKey)) {
      return parseFloat(value).toFixed(2);
    }
    return value;
  };

  const getCellAlignment = (key) => {
    return ['name', 'sample', 'remarks'].includes(key.toLowerCase()) 
      ? 'text-left' 
      : 'text-center';
  };

  const getTotalTableWidth = (cols) => {
    // Start with actions column width plus some buffer
    let totalWidth = 100;
    
    // Add up all column widths with some padding
    cols.forEach(key => {
      totalWidth += getColumnWidth(key) + 10; // Added 10px padding between columns
    });
    
    // Add extra buffer for scrollbar and edge cases
    return totalWidth + 50;
  };

  // Memoize total width calculation
  const totalWidth = useMemo(() => getTotalTableWidth(columns), [columns]);

  return (
    <div className="rounded border border-amber-100" style={{ height: '450px' }}>
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <AutoSizer>
          {({ height, width }) => (
            <div style={{ height, width, overflowX: 'auto', overflowY: 'hidden' }}>
              <Table
                width={Math.max(width, totalWidth)}
                height={height}
                headerHeight={40}
                rowHeight={48}
                rowCount={sortedTests.length || 0}
                rowGetter={({ index }) => sortedTests[index]}
                overscanRowCount={5} // Add this to improve scroll performance
                scrollToIndex={0}
                // Add these props to improve performance
                estimatedRowSize={48}
                defaultHeight={450}
                rowClassName={({ index }) => 
                  `${
                    index === -1 
                      ? 'bg-amber-500' 
                      : index % 2 === 0 
                        ? 'bg-white hover:bg-amber-100/40' 
                        : 'bg-amber-50/40 hover:bg-amber-100/40'
                  } transition-colors text-amber-900 text-xs font-medium rounded`
                }
                noRowsRenderer={() => (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No tests found
                  </div>
                )}
              >
                <Column
                  label="Actions"
                  dataKey="actions"
                  width={100} // Increased width
                  flexShrink={0}
                  cellRenderer={renderActions}
                  headerClassName="bg-amber-500 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap text-center pointer-events-none"
                  className="sticky left-0 z-10 bg-white"
                />
                {columns.map(key => (
                  <Column
                    key={key}
                    label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    dataKey={key}
                    width={getColumnWidth(key)}
                    flexGrow={0}
                    flexShrink={0}
                    cellRenderer={({ cellData, dataKey, rowData }) => (
                      <div 
                        className={`truncate whitespace-nowrap ${getCellAlignment(dataKey)}`} 
                        title={cellData}
                      >
                        {getCellValue({ dataKey, rowData })}
                      </div>
                    )}
                    headerClassName="bg-amber-500 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap text-center pointer-events-none"
                    style={{ overflow: 'visible' }}
                  />
                ))}
              </Table>
            </div>
          )}
        </AutoSizer>
      </div>
    </div>
  );
};

// Apply memo after the component definition
export default React.memo(TableRow);
