import React, { memo } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

export const VirtualizedMenuItems = memo(({ items, itemHeight = 32, renderItem }) => {
  // If few items, render directly without virtualization for simplicity and performance
  if (items.length <= 10) {
    return items.map((item, index) => renderItem(item, index)); // Pass index if needed by key
  }

  const Row = ({ index, style }) => (
    <div style={style}>
      {renderItem(items[index], index)} {/* Pass index if needed by key */}
    </div>
  );

  return (
    <div style={{ height: Math.min(items.length * itemHeight, 320), minHeight: itemHeight }}> {/* Ensure min height */}
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList height={height} width={width} itemCount={items.length} itemSize={itemHeight} overscanCount={5}>
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
});