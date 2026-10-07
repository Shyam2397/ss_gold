import React, { memo } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const Row = ({ index, style, data }) => (
  <div style={style}>
    {data.renderItem(data.items[index], index)}
  </div>
);

export const VirtualizedMenuItems = memo(({ items, itemHeight = 32, renderItem }) => {
  // If few items, render directly without virtualization for simplicity and performance
  if (items.length <= 10) {
    return items.map((item, index) => renderItem(item, index)); // Pass index if needed by key
  }

  const itemData = { items, renderItem };

  return (
    <div style={{ height: Math.min(items.length * itemHeight, 320), minHeight: itemHeight }}> {/* Ensure min height */}
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList height={height} width={width} itemCount={items.length} itemSize={itemHeight} itemData={itemData} overscanCount={5}>
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
});