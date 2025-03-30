import React from 'react';

const SimpleList = ({ data, rowComponent: RowComponent, height = 400 }) => {
  return (
    <div style={{ height, overflowY: 'auto' }}>
      {data.map((item, index) => (
        <RowComponent 
          key={item.id || index}
          data={data}
          index={index}
          style={{ position: 'relative' }}
        />
      ))}
    </div>
  );
};

export default SimpleList;
