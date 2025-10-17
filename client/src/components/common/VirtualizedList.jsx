import React, { memo, useMemo } from 'react';
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
  // Memoize the items array to prevent unnecessary re-renders
  const memoizedItems = useMemo(() => items, [JSON.stringify(items)]);
  
  // For small lists, render normally
  if (memoizedItems.length <= minItems) {
    return (
      <div className={className}>
        {memoizedItems.map((item, index) => renderItem({ item, index }))}
      </div>
    );
  }

  // Memoize the Row component
  const Row = memo(({ index, style }) => (
    <div style={style}>
      {renderItem({ item: memoizedItems[index], index })}
    </div>
  ));

  // Calculate dynamic height based on container
  const containerHeight = useMemo(() => {
    return Math.min(memoizedItems.length * itemHeight, 320);
  }, [memoizedItems.length, itemHeight]);

  return (
    <ErrorBoundary>
      <div className={className} style={{ height: containerHeight }}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={memoizedItems.length}
              itemSize={itemHeight}
              overscanCount={10} // Increased overscan for smoother scrolling
              useIsScrolling // Enable isScrolling optimization
            >
              {Row}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </ErrorBoundary>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.itemHeight === nextProps.itemHeight &&
    prevProps.minItems === nextProps.minItems &&
    prevProps.className === nextProps.className &&
    JSON.stringify(prevProps.items) === JSON.stringify(nextProps.items) &&
    prevProps.renderItem === nextProps.renderItem
  );
});

export default VirtualizedList;
