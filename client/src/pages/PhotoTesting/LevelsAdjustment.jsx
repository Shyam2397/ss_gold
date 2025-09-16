import React, { useRef, useEffect, useState } from 'react';

const LevelsAdjustment = ({ image, onApply, onReset }) => {
  const canvasRef = useRef(null);
  const [histogramData, setHistogramData] = useState(null);
  const [levels, setLevels] = useState({
    black: 0,
    white: 1,
    gamma: 1,
  });
  
  // Track if we've made any changes to levels
  const [hasLevelsChanged, setHasLevelsChanged] = useState(false);

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

  // Apply level adjustments in real-time when they change
  useEffect(() => {
    if (hasLevelsChanged) {
      onApply({ type: 'levels', ...levels });
    }
  }, [levels, hasLevelsChanged]);
  
  const handleLevelChange = (type, value) => {
    const newLevels = {
      ...levels,
      [type]: parseFloat(value)
    };
    setLevels(newLevels);
    setHasLevelsChanged(true);
  };
  
  const handleReset = () => {
    setLevels({
      black: 0,
      white: 1,
      gamma: 1,
    });
    setHasLevelsChanged(true);
    onReset();
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100 w-full max-w-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Levels Adjustment</h3>
        
        {/* Histogram Preview */}
        <div className="h-28 bg-gray-50 rounded-lg overflow-hidden border border-gray-200 mb-5">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        <div className="space-y-5">
          {/* Black Point */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">Blacks</label>
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                {Math.round(levels.black * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={levels.black}
              onChange={(e) => handleLevelChange('black', e.target.value)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                background: `linear-gradient(to right, #000000 ${levels.black * 100}%, #e5e7eb ${levels.black * 100}%)`
              }}
            />
          </div>

          {/* White Point */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">Whites</label>
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                {Math.round(levels.white * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={levels.white}
              onChange={(e) => handleLevelChange('white', e.target.value)}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              style={{
                background: `linear-gradient(to right, #e5e7eb ${levels.white * 100}%, #000000 ${levels.white * 100}%)`
              }}
            />
          </div>

          {/* Gamma */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">Gamma</label>
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                {levels.gamma.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={levels.gamma}
              onChange={(e) => handleLevelChange('gamma', e.target.value)}
              className="w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default LevelsAdjustment;
