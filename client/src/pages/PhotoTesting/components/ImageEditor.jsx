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
    { id: 1, x: 80, y: 80, angle: 0, isDragging: false },
    { id: 2, x: 180, y: 180, angle: 45, isDragging: false }
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
    
    // Get container bounds to place new arrow in a reasonable position
    const imageContainer = document.querySelector('.w-full.h-full.overflow-hidden.relative');
    const fallbackContainer = document.querySelector('.relative.w-full.h-full.group');
    const container = imageContainer || fallbackContainer;
    let containerWidth = 300, containerHeight = 300; // defaults
    
    if (container) {
      const rect = container.getBoundingClientRect();
      containerWidth = rect.width;
      containerHeight = rect.height;
    }
    
    const newArrow = {
      id: newId,
      x: Math.min(50 + (newId * 30), containerWidth - 100), // Container-relative positioning
      y: Math.min(50 + (newId * 30), containerHeight - 50),
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
    
    // Get the image container bounds for proper coordinate conversion
    const imageContainer = e.currentTarget.closest('.w-full.h-full.overflow-hidden.relative');
    const containerRect = imageContainer ? imageContainer.getBoundingClientRect() : 
                         e.currentTarget.closest('.relative.w-full.h-full.group').getBoundingClientRect();
    
    if (e.shiftKey) {
      // Rotate on shift + drag
      setActiveArrow({ 
        id: arrowId, 
        type: 'rotate', 
        startX: e.clientX,
        containerRect
      });
    } else {
      // Move on normal drag - store container-relative coordinates
      const containerX = e.clientX - containerRect.left;
      const containerY = e.clientY - containerRect.top;
      
      setActiveArrow({ 
        id: arrowId, 
        type: 'move', 
        startX: e.clientX, 
        startY: e.clientY,
        containerRect,
        startContainerX: containerX,
        startContainerY: containerY
      });
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
          // Rotate arrow - use container center as rotation center
          const containerRect = activeArrow.containerRect;
          const centerX = containerRect.left + (containerRect.width / 2);
          const centerY = containerRect.top + (containerRect.height / 2);
          const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
          return {
            ...arrow,
            angle: angle
          };
        } else {
          // Move arrow - calculate new container-relative position
          const containerRect = activeArrow.containerRect;
          const newContainerX = e.clientX - containerRect.left;
          const newContainerY = e.clientY - containerRect.top;
          
          // Constrain to container bounds with arrow dimensions
          const arrowWidth = 43; // 35px shaft + 8px head
          const maxX = containerRect.width - arrowWidth;
          const maxY = containerRect.height - 10; // account for arrow height
          
          const finalX = Math.max(0, Math.min(newContainerX, maxX));
          const finalY = Math.max(0, Math.min(newContainerY, maxY));
          
          return {
            ...arrow,
            x: finalX,
            y: finalY
          };
        }
      }
      return arrow;
    }));

    // Update active arrow tracking (no need to update coordinates as they're recalculated)
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
            <div className="w-full h-full overflow-hidden relative">
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
              {/* Arrows positioned relative to the image container */}
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
