import React from 'react';
import LevelsAdjustment from '../LevelsAdjustment';

const ImageAdjustmentPanel = ({
  showLevels,
  onToggleLevels,
  originalImage,
  onApplyLevels,
  onResetLevels,
  onClose
}) => {
  if (!showLevels) return null;
  
  return (
    <div 
      className="absolute left-full -top-48 ml-4 w-72 bg-white rounded-lg shadow-lg p-4 z-20"
      onClick={(e) => e.stopPropagation()} // Prevent click from closing the panel
    >
      <LevelsAdjustment 
        image={originalImage}
        onApply={onApplyLevels}
        onReset={onResetLevels}
      />
      <div className="mt-2 flex justify-end space-x-2">
        <button 
          onClick={onClose}
          className="px-3 py-1 text-sm text-red-600 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export const AdjustmentButton = ({ onClick, isActive, icon: Icon, title }) => (
  <button
    onClick={onClick}
    className={`p-2 rounded-full transition-all ${
      isActive ? 'bg-blue-100 text-blue-600' : 'bg-white/80 hover:bg-gray-100'
    } shadow-md hover:scale-110`}
    title={title}
  >
    <Icon size={16} className="text-gray-700" />
  </button>
);

export default ImageAdjustmentPanel;
