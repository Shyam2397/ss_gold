import React from 'react';

const GridOverlay = () => (
  <div className="absolute inset-0 pointer-events-none">
    {/* Vertical Lines */}
    {[...Array(7)].map((_, i) => (
      <div 
        key={`v-${i}`}
        className="absolute top-0 bottom-0 w-px bg-gray-200"
        style={{ left: `${(i / 6) * 100}%` }}
      >
        {i > 0 && i < 6 && (
          <span className="absolute -left-2 top-1 text-[8px] text-gray-400">{i}"</span>
        )}
      </div>
    ))}
    
    {/* Horizontal Lines */}
    {[...Array(5)].map((_, i) => (
      <div 
        key={`h-${i}`}
        className="absolute left-0 right-0 h-px bg-gray-200"
        style={{ top: `${(i / 4) * 100}%` }}
      >
        {i > 0 && i < 4 && (
          <span className="absolute -top-2 left-1 text-[8px] text-gray-400">{i}"</span>
        )}
      </div>
    ))}
    
    {/* Center Crosshair */}
    <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2">
      <div className="absolute top-1/2 left-0 right-0 h-px bg-red-500 -mt-px"></div>
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500 -ml-px"></div>
    </div>
  </div>
);

export default GridOverlay;
