import React, { useMemo } from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';
import { formatDateForDisplay, formatTimeForDisplay } from '../utils/validation';

const TableRow = React.memo(({ 
  skinTests, 
  initialFormData,
  onEdit, 
  onDelete,
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

  const handleWhatsAppShare = async (rowData) => {
    let resultMessage;
    
    // Check for melting defect in remarks
    if (rowData.remarks && rowData.remarks.toLowerCase().includes('melting defect')) {
      resultMessage = '✨ *RESULT:* *Melting Defect*\n👉 *Please collect the sample, remelt it, and return it.*';
    } else if (parseFloat(rowData.gold_fineness) === 0 && parseFloat(rowData.silver || 0) === 0) {
      resultMessage = '✨ *RESULT:* Analysis indicates the sample contains no detectable gold or silver content.';
    } else if (parseFloat(rowData.gold_fineness) === 0 && rowData.silver) {
      resultMessage = `✨ *SILVER RESULT:* *${parseFloat(rowData.silver).toFixed(2)}* %`;
    } else {
      resultMessage = `✨ *RESULT:* *${parseFloat(rowData.gold_fineness).toFixed(2)}* %`;
    }

    const messageLines = [
      '*Dear Customer,*',
      '',
      `🔖 *Token No:* ${rowData.tokenNo || rowData.tokenno || rowData.token_no}`,
      `📅 *Date:* ${formatDateForDisplay(rowData.date)}`,
      `👤 *Name:* ${rowData.name}`,
      `⚖️ *Weight:* ${parseFloat(rowData.weight).toFixed(3)} g`,
      `🔍 *Sample:* ${rowData.sample}`,
      '',
      resultMessage
    ];

    if (rowData.remarks && !rowData.remarks.toLowerCase().includes('melting defect')) {
      messageLines.push('', `📝 *Remarks:* ${rowData.remarks}`);
    }

    messageLines.push(
      '',
      'SS GOLD TESTING,',
      'Nilakottai.',
      'For any doubt/clarification, please contact',
      '8903225544'
    );

    const message = encodeURIComponent(messageLines.join('\n'));
    
    // Extract and validate phone number
    let phoneNumber = '';
    
    // Try to get phone number from rowData
    if (rowData.phoneNumber) {
      phoneNumber = rowData.phoneNumber.toString().replace(/\D/g, '');
    } 
    // If no phone number found, try to fetch it using the code
    else if (rowData.code) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/entries?code=${encodeURIComponent(rowData.code)}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            phoneNumber = data[0].phoneNumber?.toString().replace(/\D/g, '') || '';
          }
        }
      } catch (err) {
        console.error('Error fetching phone number:', err);
      }
    }

    // If still no phone number, prompt the user
    if (!phoneNumber) {
      const userInput = prompt('No phone number found. Please enter a 10-digit mobile number:');
      if (!userInput) return; // User cancelled
      phoneNumber = userInput.replace(/\D/g, '');
    }

    // Format phone number
    phoneNumber = phoneNumber.replace(/^0+/, '');
    
    // Remove country code if present
    if (phoneNumber.startsWith('91') && phoneNumber.length > 10) {
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
      'tokenNo', // Main token field
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

    // Modified filter to handle token field variations
    if (skinTests.length > 0) {
      const firstTest = skinTests[0];
      const hasTokenNo = 'tokenNo' in firstTest || 'token_no' in firstTest || 'tokenno' in firstTest;
      
      return columnOrder.filter(col => {
        if (col === 'tokenNo') return hasTokenNo;
        return Object.keys(firstTest).includes(col) &&
          col !== 'code' && 
          col !== 'phoneNumber';
      });
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
      case 'token_no':
      case 'tokennumber':
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
    // Special handling for token number variations
    if (dataKey === 'tokenNo' || dataKey === 'token_no' || dataKey === 'tokenno') {
      const tokenValue = rowData.tokenNo || rowData.token_no || rowData.tokenno;
      return tokenValue || '-';
    }
    
    let value = rowData[dataKey];
    
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
});

// Custom comparison function for React.memo
const areEqual = (prevProps, nextProps) => {
  // Only re-render if the skinTest data has actually changed
  return JSON.stringify(prevProps.skinTests) === JSON.stringify(nextProps.skinTests) &&
         prevProps.onEdit === nextProps.onEdit &&
         prevProps.onDelete === nextProps.onDelete;
};

export default React.memo(TableRow, areEqual);
