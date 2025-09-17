import React, { useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Upload, Sliders } from 'lucide-react';
import ImageAdjustmentPanel, { AdjustmentButton } from './ImageAdjustmentPanel';

const ImageEditor = ({
  uploadedImage,
  transform,
  showLevels,
  originalImage,
  onImageUpload,
  onZoom,
  onResetTransform,
  onToggleLevels,
  onApplyLevels,
  onResetLevels,
  onCloseAdjustment,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
  onFileSelect
}) => {
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    onDragOver(e);
  }, [onDragOver]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    onDrop(e);
  }, [onDrop]);

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    onDragStart(e);
  }, [onDragStart]);

  const handleMouseUp = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    onDragEnd(e);
  }, [onDragEnd]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = null;
  }, [onFileSelect]);

  const handleUploadAreaClick = useCallback((e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="w-[275px] relative group">
      {uploadedImage && (
        <div className="absolute -top-10 right-2 z-10 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <AdjustmentButton
            onClick={(e) => { e.stopPropagation(); onToggleLevels(); }}
            isActive={showLevels}
            icon={Sliders}
            title="Adjust Levels"
          />
        </div>
      )}

      <ImageAdjustmentPanel
        showLevels={showLevels}
        onToggleLevels={onToggleLevels}
        originalImage={originalImage}
        onApplyLevels={onApplyLevels}
        onResetLevels={onResetLevels}
        onClose={onCloseAdjustment}
      />

      <div
        onClick={() => showLevels && onCloseAdjustment()}
        className={`h-72 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          uploadedImage 
            ? 'border-0' 
            : 'border-2 border-black bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleDrop}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        {uploadedImage ? (
          <div className="relative w-full h-full group">
            <div className="w-full h-full overflow-hidden">
              <div 
                className="absolute inset-0"
                style={{
                  transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                  cursor: transform.isDragging ? 'grabbing' : 'grab',
                  touchAction: 'none',
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${uploadedImage})`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center',
                }}
              />
            </div>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button 
                onClick={(e) => { e.stopPropagation(); onZoom(0.05); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all bg-white/80 backdrop-blur-sm shadow-md hover:scale-110"
                title="Zoom In"
              >
                <ZoomIn size={16} className="text-gray-700" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onZoom(-0.05); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all bg-white/80 backdrop-blur-sm shadow-md hover:scale-110"
                title="Zoom Out"
              >
                <ZoomOut size={16} className="text-gray-700" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); onResetTransform(); }}
                className="p-2 hover:bg-gray-100 rounded-full transition-all bg-white/80 backdrop-blur-sm shadow-md hover:scale-110"
                title="Reset"
              >
                <RotateCcw size={16} className="text-gray-700" />
              </button>
            </div>
          </div>
        ) : (
          <div 
            className="text-center p-8 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded"
            onClick={handleUploadAreaClick}
          >
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 mb-1">photo upload area</p>
            <p className="text-xs text-gray-500">Click or drag image</p>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
      
      <div className="px-3 pb-2">
        <p className="text-center text-red-600 font-medium text-xs">
          Result are only for skin of the sample.
        </p>
      </div>
    </div>
  );
};

export default ImageEditor;
