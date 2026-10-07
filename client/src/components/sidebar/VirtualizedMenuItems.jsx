import React, { memo } from 'react';

// Sidebar menus are small fixed lists (main 6, data 5, expenses 3), so a plain
// map renders them directly. The react-window path it replaced never triggered
// because every section stayed well under the >10 item threshold.
export const VirtualizedMenuItems = memo(({ items, renderItem }) =>
  items.map((item, index) => renderItem(item, index))
);