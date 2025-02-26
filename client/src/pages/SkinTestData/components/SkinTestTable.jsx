import React from 'react';
import { FiLoader } from 'react-icons/fi';
import { AutoSizer, Table, Column } from 'react-virtualized';
import 'react-virtualized/styles.css';

const SkinTestTable = ({ tests, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <FiLoader className="h-6 w-6 text-[#D3B04D] animate-spin" />
      </div>
    );
  }

  if (!tests.length) {
    return (
      <div className="text-center py-4 text-gray-500">
        No skin tests found
      </div>
    );
  }

  const getColumnWidth = (key) => {
    switch (key.toLowerCase()) {
      case 'token_no':
      case 'tokenno':
        return 80;
      case 'date':
        return 90;
      case 'time':
        return 90;
      case 'name':
        return 180;
      case 'weight':
        return 80;
      case 'sample':
        return 180;
      case 'highest':
      case 'average':
        return 100;
      case 'gold_fineness':
        return 120;
      case 'remarks':
        return 200;
      case 'silver':
      case 'copper':
      case 'zinc':
      case 'cadmium':
      case 'nickel':
      case 'tungsten':
      case 'others':
        return 80;
      default:
        return 100;
    }
  };

  const getTotalTableWidth = (columns) => {
    let totalWidth = 50;
    columns.forEach(key => {
      totalWidth += getColumnWidth(key) + 10;
    });
    return totalWidth + 50;
  };

  const getColumnAlignment = (key) => {
    const leftAlignedColumns = ['name', 'sample', 'remarks'];
    return leftAlignedColumns.includes(key.toLowerCase()) 
      ? 'text-left' 
      : 'text-center';
  };

  const formatValue = (value, key) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    if (key === 'time' && typeof value === 'string') {
      try {
        const [hours, minutes] = value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          const period = hours >= 12 ? 'PM' : 'AM';
          const hours12 = hours % 12 || 12;
          return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
        }
      } catch (e) {
        console.warn('Error formatting time:', e);
      }
      return value;
    }

    if (key === 'date') {
      try {
        const date = new Date(value);
        if (!isNaN(date)) {
          return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        console.warn('Error formatting date:', e);
      }
      return value;
    }

    if (key === 'weight') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num.toFixed(3);
    }

    const numericColumns = [
      'highest',
      'average',
      'gold_fineness',
      'silver',
      'copper',
      'zinc',
      'cadmium',
      'nickel',
      'tungsten',
      'others'
    ];

    if (numericColumns.includes(key.toLowerCase())) {
      const num = parseFloat(value);
      return isNaN(num) ? value : num.toFixed(2);
    }

    return value;
  };

  const filterColumns = (obj) => {
    const excludedColumns = [
      'id', 
      'created_at', 
      'updated_at', 
      'phone_number',
      'phonenumber',
      'phone',
      'phoneNumber'
    ];
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => 
        !excludedColumns.includes(key) && 
        !excludedColumns.includes(key.toLowerCase()) &&
        !key.toLowerCase().includes('phone')
      )
    );
  };

  const firstTest = filterColumns(tests[0] || {});
  const headers = Object.keys(firstTest);

  return (
    <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden h-[500px]">
      <AutoSizer>
        {({ width, height }) => (
          <div style={{ height, width, overflowX: 'auto', overflowY: 'hidden' }}>
            <Table
              width={Math.max(width, getTotalTableWidth(headers))}
              height={height}
              headerHeight={40}
              rowHeight={40}
              rowCount={tests.length}
              rowGetter={({ index }) => filterColumns(tests[index])}
              rowClassName={({ index }) => 
                `${index === -1 
                  ? 'bg-amber-500 text-white' 
                  : index % 2 === 0 
                    ? 'bg-white hover:bg-amber-100/40' 
                    : 'bg-amber-50/40 hover:bg-amber-100/40'} 
                transition-colors duration-150 text-sm`
              }
            >
              {headers.map(header => (
                <Column
                  key={header}
                  label={header.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                  dataKey={header}
                  width={getColumnWidth(header)}
                  flexGrow={0}
                  flexShrink={0}
                  cellRenderer={({ cellData, dataKey }) => (
                    <div 
                      className={`truncate whitespace-nowrap ${getColumnAlignment(dataKey)}`}
                      title={cellData}
                    >
                      {formatValue(cellData, dataKey)}
                    </div>
                  )}
                  headerClassName="bg-amber-500 text-white text-xs font-medium uppercase tracking-wider whitespace-nowrap text-center"
                />
              ))}
            </Table>
          </div>
        )}
      </AutoSizer>
    </div>
  );
};

export default SkinTestTable;
