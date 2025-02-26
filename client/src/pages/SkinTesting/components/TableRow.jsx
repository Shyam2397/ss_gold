import React from 'react';
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

    let phoneNumber = rowData.phoneNumber?.replace(/\D/g, '') || '';
    // Handle Indian phone numbers
    if (phoneNumber) {
      // Remove leading zeros if any
      phoneNumber = phoneNumber.replace(/^0+/, '');
      // If number starts with 91, make sure it's not duplicated
      if (phoneNumber.startsWith('91')) {
        phoneNumber = phoneNumber.substring(2);
      }
      // Check if it's a valid Indian mobile number (10 digits)
      if (phoneNumber.length === 10) {
        phoneNumber = '91' + phoneNumber;
      } else {
        alert('Invalid phone number format. Please ensure it is a 10-digit Indian mobile number.');
        return;
      }
    } else {
      alert('No phone number available for this entry');
      return;
    }
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const getColumns = () => {
    const columnOrder = [
      'tokenNo',
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

  const columns = getColumns();

  const getColumnWidth = (key) => {
    switch (key.toLowerCase()) {
      case 'tokenno':
        return 80;
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
        onClick={() => onDelete(rowData.tokenNo || rowData.tokenno)}
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

  // Create reversed array for display
  const reversedTests = [...skinTests].reverse();

  const getTotalTableWidth = () => {
    // Start with actions column width plus some buffer
    let totalWidth = 100;
    
    // Add up all column widths with some padding
    columns.forEach(key => {
      totalWidth += getColumnWidth(key) + 10; // Added 10px padding between columns
    });
    
    // Add extra buffer for scrollbar and edge cases
    return totalWidth + 50;
  };

  return (
    <div className="rounded border border-amber-100" style={{ height: '450px' }}>
      <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
        <AutoSizer>
          {({ height, width }) => (
            <div style={{ height, width, overflowX: 'auto', overflowY: 'hidden' }}>
              <Table
                width={getTotalTableWidth()}
                height={height}
                headerHeight={40}
                rowHeight={48}
                rowCount={reversedTests.length || 0}
                rowGetter={({ index }) => reversedTests[index]}
                rowClassName={({ index }) => 
                  `${index === -1 ? 'bg-amber-500' : index % 2 === 0 ? 'bg-white' : 'bg-amber-50/40'} hover:bg-amber-100/40 transition-colors text-amber-900 text-xs font-medium`
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
                  headerClassName="bg-amber-500 text-white text-sm font-medium uppercase tracking-wider whitespace-nowrap text-center"
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
                    headerClassName="bg-amber-500 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap text-center"
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

export default TableRow;
