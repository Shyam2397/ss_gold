import React, { useRef, useEffect, useCallback, useState } from 'react';

const LevelsAdjustment = ({ image, onApply, onReset }) => {
  const [activeTab, setActiveTab] = useState('levels');
  const canvasRef = useRef(null);
  const curveCanvasRef = useRef(null);
  const [histogramData, setHistogramData] = useState(null);
  const [levels, setLevels] = useState({
    black: 0,
    white: 1,
    gamma: 1,
  });
  
  // Curve points for RGB channel
  const [curvePoints, setCurvePoints] = useState([
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ]);
  
  // Active point being dragged
  const [activePoint, setActivePoint] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate histogram when image changes
  useEffect(() => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const histogram = new Array(256).fill(0);
        
        // Calculate grayscale histogram
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Convert to grayscale using luminance formula
          const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          histogram[gray]++;
        }
        
        // Normalize histogram
        const max = Math.max(...histogram);
        const normalized = histogram.map(value => value / max);
        setHistogramData(normalized);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    };
    
    img.src = image;
    
    return () => {
      img.onload = null;
    };
  }, [image]);

  // Draw histogram
  useEffect(() => {
    if (!histogramData || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw histogram
    ctx.fillStyle = 'rgba(66, 153, 225, 0.7)';
    const barWidth = width / histogramData.length;
    
    histogramData.forEach((value, index) => {
      const barHeight = value * height * 0.9;
      const x = (index / 255) * width;
      const y = height - barHeight;
      
      ctx.fillRect(x, y, barWidth + 0.5, barHeight);
    });
    
    // Draw level markers
    const drawMarker = (x, color) => {
      const posX = x * width;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(posX, 0);
      ctx.lineTo(posX, height);
      ctx.stroke();
    };
    
    drawMarker(levels.black, '#000');
    drawMarker(levels.white, '#fff');
    
  }, [histogramData, levels]);

  // Track if we've made any changes to levels
  const [hasLevelsChanged, setHasLevelsChanged] = useState(false);
  
  // Apply level adjustments in real-time when they change
  useEffect(() => {
    if (activeTab === 'levels' && hasLevelsChanged) {
      onApply({ type: 'levels', ...levels });
    }
  }, [levels, activeTab, hasLevelsChanged]);
  
  const handleLevelChange = (type, value) => {
    const newLevels = {
      ...levels,
      [type]: parseFloat(value)
    };
    setLevels(newLevels);
    setHasLevelsChanged(true);
  };
  
  // Update curve in real-time with debounce
  useEffect(() => {
    if (activeTab === 'curves') {
      const timer = setTimeout(() => {
        onApply({ 
          type: 'curves',
          curveLUT: generateCurveLUT()
        });
      }, 100); // Small delay to improve performance
      
      return () => clearTimeout(timer);
    }
  }, [curvePoints, activeTab]);
  
  const handleApply = () => {
    // Already applying in real-time, this is just for consistency
    if (activeTab === 'curves') {
      onApply({ 
        type: 'curves',
        curveLUT: generateCurveLUT()
      });
    }
  };
  
  const handleReset = () => {
    if (activeTab === 'curves') {
      resetCurve();
      // Apply reset immediately
      onApply({ 
        type: 'curves',
        curveLUT: Array.from({ length: 256 }, (_, i) => i)
      });
    } else {
      onReset();
    }
  };

 

  // Draw curve on canvas
  useEffect(() => {
    if (activeTab !== 'curves' || !curveCanvasRef.current) return;
    
    const canvas = curveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // Draw vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw main diagonal
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();
    
    // Sort points by x-coordinate
    const sortedPoints = [...curvePoints].sort((a, b) => a.x - b.x);
    
    // Draw curve
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Start from first point
    ctx.moveTo(sortedPoints[0].x * width, (1 - sortedPoints[0].y) * height);
    
    // Draw curve using quadratic bezier for smooth curves
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const xc = (sortedPoints[i].x + sortedPoints[i + 1].x) / 2;
      const yc = (sortedPoints[i].y + sortedPoints[i + 1].y) / 2;
      
      if (i === 0) {
        ctx.quadraticCurveTo(
          sortedPoints[i].x * width,
          (1 - sortedPoints[i].y) * height,
          xc * width,
          (1 - yc) * height
        );
      } else {
        ctx.quadraticCurveTo(
          sortedPoints[i].x * width,
          (1 - sortedPoints[i].y) * height,
          xc * width,
          (1 - yc) * height
        );
      }
    }
    
    // Connect to last point
    const last = sortedPoints[sortedPoints.length - 1];
    ctx.lineTo(last.x * width, (1 - last.y) * height);
    
    ctx.stroke();
    
    // Draw control points
    ctx.fillStyle = '#3b82f6';
    sortedPoints.forEach((point, index) => {
      const x = point.x * width;
      const y = (1 - point.y) * height;
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw white border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [activeTab, curvePoints]);
  
  const handleCurveMouseDown = (e) => {
    if (activeTab !== 'curves') return;
    
    const rect = curveCanvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    
    // Check if clicking near an existing point
    const pointIndex = curvePoints.findIndex(
      point => 
        Math.abs(point.x - x) < 0.05 && 
        Math.abs(point.y - y) < 0.05
    );
    
    if (pointIndex !== -1) {
      // Start dragging existing point
      setActivePoint(pointIndex);
      setIsDragging(true);
      return;
    }
    
    // Add new point if not too close to existing points
    const isNearExisting = curvePoints.some(
      point => Math.abs(point.x - x) < 0.1
    );
    
    if (!isNearExisting) {
      const newPoint = { x, y };
      const newPoints = [...curvePoints, newPoint].sort((a, b) => a.x - b.x);
      setCurvePoints(newPoints);
      const newIndex = newPoints.findIndex(p => p === newPoint);
      setActivePoint(newIndex);
      setIsDragging(true);
    }
  };
  
  const handleCurveMouseMove = (e) => {
    if (!isDragging || activePoint === null || activeTab !== 'curves') return;
    
    const rect = curveCanvasRef.current.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    let y = 1 - (e.clientY - rect.top) / rect.height;
    
    // Clamp values
    x = Math.max(0, Math.min(1, x));
    y = Math.max(0, Math.min(1, y));
    
    // Don't allow points to cross each other
    const newPoints = [...curvePoints];
    const prevPoint = newPoints[activePoint - 1];
    const nextPoint = newPoints[activePoint + 1];
    
    if (prevPoint) x = Math.max(x, prevPoint.x + 0.01);
    if (nextPoint) x = Math.min(x, nextPoint.x - 0.01);
    
    newPoints[activePoint] = { x, y };
    setCurvePoints(newPoints);
  };
  
  const handleCurveMouseUp = () => {
    setIsDragging(false);
    setActivePoint(null);
  };
  
  const handleDeletePoint = (index) => {
    if (curvePoints.length <= 2) return; // Keep at least 2 points
    setCurvePoints(curvePoints.filter((_, i) => i !== index));
  };
  
  const resetCurve = () => {
    setCurvePoints([
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ]);
  };
  
  // Generate curve lookup table
  const generateCurveLUT = () => {
    const sortedPoints = [...curvePoints].sort((a, b) => a.x - b.x);
    const lut = new Array(256);
    
    for (let i = 0; i < 256; i++) {
      const x = i / 255;
      
      // Find the segment this x falls into
      let left = 0;
      let right = sortedPoints.length - 1;
      
      for (let j = 0; j < sortedPoints.length - 1; j++) {
        if (x >= sortedPoints[j].x && x <= sortedPoints[j + 1].x) {
          left = j;
          right = j + 1;
          break;
        }
      }
      
      // Linear interpolation
      const x0 = sortedPoints[left].x;
      const y0 = sortedPoints[left].y;
      const x1 = sortedPoints[right].x;
      const y1 = sortedPoints[right].y;
      
      let y;
      if (x0 === x1) {
        y = y0;
      } else {
        const t = (x - x0) / (x1 - x0);
        y = y0 + t * (y1 - y0);
      }
      
      lut[i] = Math.round(y * 255);
    }
    
    return lut;
  };
  

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow w-full">
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'levels' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('levels')}
        >
          Levels
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'curves' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('curves')}
        >
          Curves
        </button>
      </div>
      
      {activeTab === 'levels' && (
        <div className="space-y-4">
          <div className="h-32 bg-gray-100 rounded overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={400} 
              height={128}
              className="w-full h-full"
            />
          </div>
      
      </div>
      )}
      
      {activeTab === 'curves' && (
        <div className="space-y-4">
          <div className="relative h-48 bg-gray-100 rounded overflow-hidden">
            <canvas
              ref={curveCanvasRef}
              width={400}
              height={192}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleCurveMouseDown}
              onMouseMove={handleCurveMouseMove}
              onMouseUp={handleCurveMouseUp}
              onMouseLeave={handleCurveMouseUp}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500">
              Tip: Click to add points, drag to adjust
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>Input</span>
            <span>Output</span>
          </div>
          
          <div className="space-y-2">
            {curvePoints.map((point, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  Point {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs w-16">
                    {Math.round(point.x * 255)} → {Math.round(point.y * 255)}
                  </span>
                  {curvePoints.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePoint(index);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-3 mt-4">
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Black Point</span>
            <span>{Math.round(levels.black * 255)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.99"
            step="0.01"
            value={levels.black}
            onChange={(e) => handleLevelChange('black', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>White Point</span>
            <span>{Math.round(levels.white * 255)}</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={levels.white}
            onChange={(e) => handleLevelChange('white', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Gamma</span>
            <span>{levels.gamma.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={levels.gamma}
            onChange={(e) => handleLevelChange('gamma', e.target.value)}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      
      <div className="flex justify-between mt-4">
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        >
          {activeTab === 'curves' ? 'Reset Curve' : 'Reset'}
        </button>
        <button
          onClick={handleApply}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default LevelsAdjustment;
