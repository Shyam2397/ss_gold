import React, { memo } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import ErrorBoundary from './ErrorBoundary';

const VirtualizedList = memo(({ 
  items, 
  itemHeight = 32, 
  renderItem, 
  minItems = 10,
  className = "" 
}) => {
  // For small lists, render normally
  if (items.length <= minItems) {
    return (
      <div className={className}>
        {items.map((item, index) => renderItem({ item, index }))}
      </div>
    );
  }

  const Row = ({ index, style }) => (
    <div style={style}>
      {renderItem({ item: items[index], index })}
    </div>
  );

  return (
    <ErrorBoundary>
      <div className={className} style={{ height: Math.min(items.length * itemHeight, 320) }}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={items.length}
              itemSize={itemHeight}
              overscanCount={5}
            >
              {Row}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </ErrorBoundary>
  );
});

export default VirtualizedList;
