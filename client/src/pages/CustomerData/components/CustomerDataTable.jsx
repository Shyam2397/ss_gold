import React, { useMemo } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Base row height for mobile
const MOBILE_ROW_HEIGHT = 75;
// Row height for sm breakpoint and above
const DESKTOP_ROW_HEIGHT = 42;

// Function to get row height based on screen width
const getRowHeight = (width) => {
  return width >= 535 ? DESKTOP_ROW_HEIGHT : MOBILE_ROW_HEIGHT;
};

const Row = ({ index, style, data }) => {
  const { entries, onDelete } = data;
  const entry = entries[index];

  return (
    <div 
      style={style}
      className="border-b border-amber-100 hover:bg-amber-50/70 transition-colors duration-150 text-amber-900 flex items-center"
    >
      <div className="flex-1 min-w-0 px-5 py-2.5 whitespace-nowrap font-medium text-sm">
        {entry.name}
        <dl className="sm:hidden mt-0.5">
          <dd className="text-xs">{entry.phoneNumber}</dd>
          <dd className="text-xs">{entry.code}</dd>
          <dd className="text-xs">{entry.place}</dd>
        </dl>
      </div>
      <div className="hidden sm:table-cell flex-1 min-w-0 px-5 py-2.5 whitespace-nowrap text-center text-sm">
        {entry.phoneNumber}
      </div>
      <div className="hidden sm:table-cell flex-1 min-w-0 px-5 py-2.5 whitespace-nowrap text-center text-sm">
        {entry.code}
      </div>
      <div className="hidden sm:table-cell flex-1 min-w-0 px-5 py-2.5 whitespace-nowrap text-left text-sm">
        {entry.place}
      </div>
      <div className="px-5 py-2.5 text-center whitespace-nowrap">
        <button
          onClick={() => onDelete(entry.id)}
          className="text-red-500 hover:text-red-700 transition-colors duration-150"
        >
          <FiTrash2 className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
};

const TableHeader = () => (
  <div className="flex bg-amber-500 text-white rounded-t-xl">
    <div className="flex-1 min-w-0 px-5 py-2.5 text-center font-semibold text-sm">
      Name
    </div>
    <div className="hidden sm:block flex-1 min-w-0 px-5 py-2.5 text-center font-semibold text-sm">
      Phone Number
    </div>
    <div className="hidden sm:block flex-1 min-w-0 px-5 py-2.5 text-center font-semibold text-sm">
      Code
    </div>
    <div className="hidden sm:block flex-1 min-w-0 px-5 py-2.5 text-center font-semibold text-sm">
      Place
    </div>
    <div className="px-5 py-2.5 text-center font-semibold text-sm">
      Actions
    </div>
  </div>
);

const CustomerDataTable = ({ entries, onDelete }) => {
  const itemData = useMemo(() => ({
    entries,
    onDelete,
  }), [entries, onDelete]);

  return (
    <div className="mt-3 bg-white rounded-xl shadow-inner overflow-hidden">
      <div className="overflow-x-auto">
        <TableHeader />
        <div className="relative h-[500px] md:h-[555px] sm:h-[525px]">
          <AutoSizer>
            {({ width, height }) => (
              <List
                height={height}
                itemCount={entries.length}
                itemSize={getRowHeight(width)}
                width={width}
                itemData={itemData}
              >
                {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>
    </div>
  );
};

export default CustomerDataTable;
