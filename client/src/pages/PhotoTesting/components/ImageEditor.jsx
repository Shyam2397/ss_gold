import { useCallback, useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Upload, Sliders, Plus, Minus } from 'lucide-react';
import ImageAdjustmentPanel, { AdjustmentButton } from './ImageAdjustmentPanel';

const Arrow = ({ position, angle, isDragging, onMouseDown }) => (
  <div
    data-arrow="true"
    style={{
      position: 'absolute',
      left: position.x,
      top: position.y,
      transform: `rotate(${angle}deg)`,
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: 20,
      transformOrigin: '0 50%',
    }}
    onMouseDown={onMouseDown}
  >
    <div
      style={{
        width: '35px',
        height: '1.5px',
        backgroundColor: 'red',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          transform: 'translate(0, -50%)',
          width: '0',
          height: '0',
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: '8px solid red',
        }}
      />
    </div>
  </div>
);

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
  onFileSelect,
  onArrowsChange // New prop to pass arrows up
}) => {
  const [arrows, setArrows] = useState([
    { id: 1, x: 50, y: 50, angle: 0, isDragging: false },
    { id: 2, x: 150, y: 150, angle: 45, isDragging: false }
  ]);
  const [activeArrow, setActiveArrow] = useState(null);

  // Notify parent component when arrows change
  useEffect(() => {
    if (onArrowsChange) {
      onArrowsChange(arrows);
    }
  }, [arrows, onArrowsChange]);

  const addArrow = useCallback(() => {
    const newId = Math.max(0, ...arrows.map(a => a.id)) + 1;
    const newArrow = {
      id: newId,
      x: 100 + (newId * 20), // Offset new arrows
      y: 100 + (newId * 20),
      angle: 0,
      isDragging: false
    };
    setArrows([...arrows, newArrow]);
  }, [arrows]);

  const removeArrow = useCallback(() => {
    if (arrows.length > 0) {
      setArrows(arrows.slice(0, -1));
    }
  }, [arrows]);

  const handleArrowMouseDown = (e, arrowId) => {
    e.stopPropagation();
    if (e.shiftKey) {
      // Rotate on shift + drag
      setActiveArrow({ id: arrowId, type: 'rotate', startX: e.clientX });
    } else {
      // Move on normal drag
      setActiveArrow({ id: arrowId, type: 'move', startX: e.clientX, startY: e.clientY });
    }
    
    setArrows(arrows.map(arrow => 
      arrow.id === arrowId ? { ...arrow, isDragging: true } : arrow
    ));
  };

  const handleMouseMove = useCallback((e) => {
    if (!activeArrow) return;

    setArrows(arrows.map(arrow => {
      if (arrow.id === activeArrow.id) {
        if (activeArrow.type === 'rotate') {
          // Rotate arrow
          const rect = e.currentTarget.getBoundingClientRect();
          const centerX = rect.left + (rect.width / 2);
          const centerY = rect.top + (rect.height / 2);
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
          return {
            ...arrow,
            angle: angle
          };
        } else {
          // Move arrow
          const deltaX = e.clientX - activeArrow.startX;
          const deltaY = e.clientY - activeArrow.startY;
          return {
            ...arrow,
            x: Math.max(0, Math.min(arrow.x + deltaX, window.innerWidth - 100)),
            y: Math.max(0, Math.min(arrow.y + deltaY, window.innerHeight - 100))
          };
        }
      }
      return arrow;
    }));

    if (activeArrow.type === 'move') {
      activeArrow.startX = e.clientX;
      activeArrow.startY = e.clientY;
    } else {
      activeArrow.startX = e.clientX;
    }
  }, [activeArrow, arrows]);

  const handleMouseUp = useCallback((e) => {
    if (activeArrow) {
      setArrows(arrows.map(arrow => 
        arrow.id === activeArrow.id ? { ...arrow, isDragging: false } : arrow
      ));
      setActiveArrow(null);
    }
    onDragEnd && onDragEnd(e);
  }, [activeArrow, arrows, onDragEnd]);

  const handleImageDragStart = useCallback((e) => {
    e.stopPropagation();
    onDragStart && onDragStart(e);
  }, [onDragStart]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    onDragOver && onDragOver(e);
  }, [onDragOver]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    onDrop && onDrop(e);
  }, [onDrop]);

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
    <div 
      className="w-full h-full relative group flex flex-col"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {uploadedImage && (
        <div className="absolute right-2 z-10 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <AdjustmentButton
            onClick={(e) => { e.stopPropagation(); onToggleLevels(); }}
            isActive={showLevels}
            icon={Sliders}
            title="Adjust Levels"
          />
          <AdjustmentButton
            onClick={(e) => { e.stopPropagation(); addArrow(); }}
            isActive={false}
            icon={Plus}
            title="Add Arrow"
          />
          <AdjustmentButton
            onClick={(e) => { e.stopPropagation(); removeArrow(); }}
            isActive={false}
            icon={Minus}
            title="Remove Arrow"
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
        className={`flex-grow flex flex-col items-center justify-center cursor-pointer transition-all duration-200 border border-yellow-400 ${
          uploadedImage 
            ? 'border-0' 
            : 'border-2 border-black bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleDrop}
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
                onMouseDown={handleImageDragStart}
              />
              {arrows.map(arrow => (
                <Arrow
                  key={arrow.id}
                  position={{ x: arrow.x, y: arrow.y }}
                  angle={arrow.angle}
                  isDragging={arrow.isDragging}
                  onMouseDown={(e) => handleArrowMouseDown(e, arrow.id)}
                />
              ))}
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
    </div>
  );
};

export default ImageEditor;
