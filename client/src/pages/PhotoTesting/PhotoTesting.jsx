import React, { useReducer, useRef, useCallback, useEffect } from 'react';
import { Upload, ZoomIn, ZoomOut, RotateCcw, Camera, Sliders } from 'lucide-react';
import logo from '../../assets/logo.png';
import skinTestService from '../../services/skinTestService';
import LevelsAdjustment from './LevelsAdjustment';

// Initial state
const initialState = {
  uploadedImage: null,
  isDragging: false,
  transform: { scale: 1, x: 0, y: 0 },
  isDraggingImage: false,
  isDraggingStarted: false,
  startPos: { x: 0, y: 0 },
  tokenNo: '',
  showLevels: false,
  originalImage: null,
  adjustedImage: null,
  formData: {
    name: '',
    sample: '',
    weight: '',
    goldFineness: '',
    karat: '',
    silver: '',
    copper: '',
    zinc: '',
    cadmium: '',
    remarks: ''
  }
};

// Reducer function
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_UPLOADED_IMAGE':
      return { ...state, uploadedImage: action.payload };
    case 'SET_IS_DRAGGING':
      return { ...state, isDragging: action.payload };
    case 'SET_TRANSFORM':
      return { ...state, transform: { ...state.transform, ...action.payload } };
    case 'SET_IS_DRAGGING_IMAGE':
      return { ...state, isDraggingImage: action.payload };
    case 'SET_IS_DRAGGING_STARTED':
      return { ...state, isDraggingStarted: action.payload };
    case 'SET_START_POS':
      return { ...state, startPos: { ...state.startPos, ...action.payload } };
    case 'SET_TOKEN_NO':
      return { ...state, tokenNo: action.payload };
    case 'SET_SHOW_LEVELS':
      return { ...state, showLevels: action.payload };
    case 'SET_ORIGINAL_IMAGE':
      return { ...state, originalImage: action.payload };
    case 'SET_ADJUSTED_IMAGE':
      return { ...state, adjustedImage: action.payload };
    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'RESET_FORM_DATA':
      return { ...initialState };
    default:
      return state;
  }
};

const PhotoTesting = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const {
    uploadedImage,
    isDragging,
    transform,
    isDraggingImage,
    isDraggingStarted,
    startPos,
    tokenNo,
    showLevels,
    originalImage,
    adjustedImage,
    formData
  } = state;
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleTokenSearch = async () => {
    if (!tokenNo) return;
    
    try {
      // First try to get the token data
      const tokenData = await skinTestService.getTokenData(tokenNo);
      
      // Then get the skin test data for this token
      const skinTests = await skinTestService.getSkinTests();
      const skinTestData = skinTests.find(test => 
        (test.tokenNo === tokenNo || test.token_no === tokenNo)
      );

      if (tokenData || skinTestData) {
        dispatch({
          type: 'UPDATE_FORM_DATA',
          payload: {
            tokenNo: tokenData?.tokenNo || skinTestData?.tokenNo || skinTestData?.token_no || '',
            date: tokenData?.date || skinTestData?.date || '',
            name: tokenData?.name || skinTestData?.name || '',
            sample: tokenData?.sample || skinTestData?.sample || '',
            weight: tokenData?.weight || skinTestData?.weight || '',
            goldFineness: tokenData?.gold_fineness || tokenData?.goldFineness || 
                          skinTestData?.gold_fineness || skinTestData?.goldFineness || '',
            karat: tokenData?.karat || skinTestData?.karat || '',
            silver: tokenData?.silver || skinTestData?.silver || '0.00',
            copper: tokenData?.copper || skinTestData?.copper || '0.00',
            zinc: tokenData?.zinc || skinTestData?.zinc || '0.00',
            cadmium: tokenData?.cadmium || skinTestData?.cadmium || '0.00',
            remarks: tokenData?.remarks || skinTestData?.remarks || ''
          }
        });
      } else {
        // If no data found, update just the token number
        dispatch({
          type: 'UPDATE_FORM_DATA',
          payload: { tokenNo: tokenNo }
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleTokenSearch();
    }
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgUrl = e.target.result;
        dispatch({ type: 'SET_ORIGINAL_IMAGE', payload: imgUrl });
        dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: imgUrl });
        dispatch({ type: 'SET_UPLOADED_IMAGE', payload: imgUrl });
        // Reset transform when new image is uploaded
        dispatch({ type: 'SET_TRANSFORM', payload: { scale: 1, x: 0, y: 0 } });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    if (uploadedImage) {
      dispatch({ type: 'SET_IS_DRAGGING_IMAGE', payload: true });
      dispatch({ type: 'SET_IS_DRAGGING_STARTED', payload: false });
      dispatch({
        type: 'SET_START_POS',
        payload: {
          x: e.clientX - transform.x,
          y: e.clientY - transform.y
        }
      });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (isDraggingImage) {
      dispatch({ type: 'SET_IS_DRAGGING_STARTED', payload: true });
      dispatch({
        type: 'SET_TRANSFORM',
        payload: {
          x: e.clientX - startPos.x,
          y: e.clientY - startPos.y
        }
      });
    }
  }, [isDraggingImage, startPos, transform]);

  const handleMouseUp = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Only trigger file select if there was no dragging and no image is uploaded
    if (!isDraggingStarted && !uploadedImage) {
      triggerFileSelect(e);
    }
    
    dispatch({ type: 'SET_IS_DRAGGING_IMAGE', payload: false });
    dispatch({ type: 'SET_IS_DRAGGING_STARTED', payload: false });
  };

  const zoom = (factor) => {
    const newScale = Math.max(0.5, Math.min(transform.scale + factor, 3));
    dispatch({
      type: 'SET_TRANSFORM',
      payload: { scale: newScale }
    });
  };

  const resetTransform = () => {
    dispatch({ type: 'SET_TRANSFORM', payload: { scale: 1, x: 0, y: 0 } });
  };

  const resetForm = () => {
    dispatch({ type: 'RESET_FORM_DATA' });
  };

  const handleApplyLevels = (adjustment) => {
    if (!originalImage) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      if (adjustment.type === 'levels') {
        const { black, white, gamma } = adjustment;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Calculate lookup table for levels adjustment
        const lut = new Array(256);
        const blackPoint = Math.round(black * 255);
        const whitePoint = Math.round(white * 255);
        
        for (let i = 0; i < 256; i++) {
          // Apply black and white points
          let value = (i - blackPoint) * (255 / (whitePoint - blackPoint));
          // Apply gamma correction
          value = Math.pow(value / 255, 1 / gamma) * 255;
          // Clamp to 0-255
          lut[i] = Math.max(0, Math.min(255, Math.round(value)));
        }
        
        // Apply the lookup table to the image
        for (let i = 0; i < data.length; i += 4) {
          data[i] = lut[data[i]];         // R
          data[i + 1] = lut[data[i + 1]]; // G
          data[i + 2] = lut[data[i + 2]]; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
      } 
      else if (adjustment.type === 'curves') {
        const { curveLUT } = adjustment;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Apply the curve lookup table to each RGB channel
        for (let i = 0; i < data.length; i += 4) {
          data[i] = curveLUT[data[i]];         // R
          data[i + 1] = curveLUT[data[i + 1]]; // G
          data[i + 2] = curveLUT[data[i + 2]]; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      
      // Update the displayed image
      const adjustedUrl = canvas.toDataURL('image/png');
      dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: adjustedUrl });
      dispatch({ type: 'SET_UPLOADED_IMAGE', payload: adjustedUrl });
    };
    
    img.src = originalImage;
  };
  
  const resetLevels = () => {
    if (originalImage) {
      dispatch({ type: 'SET_UPLOADED_IMAGE', payload: originalImage });
      dispatch({ type: 'SET_ADJUSTED_IMAGE', payload: originalImage });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_IS_DRAGGING', payload: true });
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_IS_DRAGGING', payload: false });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_IS_DRAGGING', payload: false });
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset the file input to allow selecting the same file again
    e.target.value = null;
  };

  const triggerFileSelect = (e) => {
    e.stopPropagation();
    e.preventDefault();
    fileInputRef.current?.click();
  };

  // Add event listeners for mouse move and up
  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDraggingImage) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isDraggingImage) {
        handleMouseUp(e);
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDraggingImage, handleMouseMove]);

  return (
    <div className="min-h-[700px] border-2 border-amber-100 bg-white p-6 m-4 rounded-xl flex flex-col">
      <div className="mb-6">
        <div className="flex items-center mb-4 border-b-2 border-amber-400 pb-2">
          <Camera className="w-6 h-6 text-amber-600 mr-3" />
          <h2 className="text-xl font-bold text-amber-900">
            Photo Testing Module
          </h2>
        </div>
        <div className="space-y-1">
          <label htmlFor="tokenInput" className="block text-sm font-medium text-amber-700">
            Token Number
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="tokenInput"
              type="text"
              value={tokenNo}
              onChange={(e) => dispatch({ type: 'SET_TOKEN_NO', payload: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Enter Token No"
              className="px-3 py-1.5 border border-amber-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm w-40 text-amber-900"
            />
            <button 
              onClick={handleTokenSearch}
              className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors hover:from-amber-700 hover:to-yellow-600 transition-all"
            >
              Add
            </button>

            <button 
              onClick={resetForm}
              className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white px-4 py-1.5 rounded-xl text-sm font-medium transition-colors hover:from-amber-700 hover:to-yellow-600 transition-all"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
      <div className="bg-white border-2 border-yellow-400 shadow-2xl relative" style={{ width: '6in', height: '4in' }} onMouseUp={handleMouseUp}>
        {/* Grid Overlay */}
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
        {/* Header Section */}
        <div className="p-0 m-0">
          <div className="flex items-start h-[65px]">
            <div className="w-[95px] h-[95px] flex-shrink-0 -mt-3">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="pt-2 -ml-2">
              <h1 
                className="text-[48px] font-bold leading-none"
                style={{
                  background: 'linear-gradient(90deg, rgba(214, 164, 6, 1) 0%, rgba(255, 215, 0, 1) 50%, rgba(214, 164, 6, 1) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                SS GOLD
              </h1>
              <h2 className="text-[14px] font-bold text-red-600 -mt-1 text-right">Computer X-ray Testing</h2>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-2 py-1 flex gap-2">
          {/* Left Side - Form */}
          <div className="flex-1 space-y-2">
            {/* Address and Phone */}
            <div className="text-green-600 font-medium text-xs pt-2">
              <p>59, Main Bazaar, Nilakottai - 624 208</p>
              <p>Ph.No - 8903225544</p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center">
                <span className="text-blue-700 font-medium w-16">Token No</span>
                <span className="mx-2">:</span>
                <span className="text-blue-700 font-medium">{formData.tokenNo || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-700 font-medium w-12">Date</span>
                <span className="mx-2">:</span>
                <span className="text-blue-700 font-medium">
                  {formData.date ? new Date(formData.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                  }).replace(/\//g, '-') : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center text-xs">
              <span className="text-blue-700 font-medium w-16">Name</span>
              <span className="mx-2">:</span>
              <span className="text-blue-700 font-medium">{formData.name || 'N/A'}</span>
            </div>

            <div className="flex items-center text-xs">
              <span className="text-blue-700 font-medium w-16">Sample</span>
              <span className="mx-2">:</span>
              <span className="text-blue-700 font-medium">{formData.sample || 'N/A'}</span>
            </div>

            <div className="flex items-center text-xs">
              <span className="text-blue-700 font-medium w-16">weight</span>
              <span className="mx-2">:</span>
              <span className="text-blue-700 font-medium">{formData.weight != null ? parseFloat(formData.weight).toFixed(3) : '-'}</span>
            </div>

            {/* Results Table */}
            <div className="mt-3">
              <table className="border-2 border-yellow-500 w-[264px]">
                <thead>
                  <tr>
                    <th className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 w-20">
                      GOLD %
                    </th>
                    <th className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 w-20">
                      KARAT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 text-center">
                      {formData.goldFineness || '0.00'}
                    </td>
                    <td className="bg-green-500 text-yellow-300 text-lg font-bold p-1.5 border border-yellow-500 text-center">
                      {formData.karat || '0.00'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Additional Test Results */}
            <div className="mt-3 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-12">Silver</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.silver != null ? formData.silver : '-'}</span>
                </div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-12">Copper</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.copper != null ? formData.copper : '-'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-16">Cadmium</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.cadmium != null ? formData.cadmium : '-'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <span className="text-blue-700 font-medium w-12">Zinc</span>
                  <span className="mx-2">:</span>
                  <span className="text-blue-700 font-medium">{formData.zinc != null ? formData.zinc : '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-medium w-12">Remark</span>
                  <span className="ml-4">:</span>
                  <span className="text-red-600 font-bold">{formData.remarks || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Photo Upload Area */}
          <div className="w-[275px] relative group">
            {uploadedImage && (
              <div className="absolute -top-10 right-2 z-10 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'SET_SHOW_LEVELS', payload: !showLevels }); }}
                  className={`p-2 rounded-full transition-all ${showLevels ? 'bg-blue-100 text-blue-600' : 'bg-white/80 hover:bg-gray-100'} shadow-md hover:scale-110`}
                  title="Adjust Levels"
                >
                  <Sliders size={16} className="text-gray-700" />
                </button>
              </div>
            )}
            {showLevels && (
              <div 
                className="absolute left-full -top-48 ml-4 w-72 bg-white rounded-lg shadow-lg p-4 z-20"
                onClick={(e) => e.stopPropagation()} // Prevent click from closing the panel
              >
                <LevelsAdjustment 
                  image={originalImage}
                  onApply={(levels) => {
                    handleApplyLevels(levels);
                    // Don't close on apply to allow real-time adjustments
                  }}
                  onReset={() => {
                    resetLevels();
                    // Optionally close on reset if desired
                    // setShowLevels(false);
                  }}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button 
                    onClick={() => dispatch({ type: 'SET_SHOW_LEVELS', payload: false })}
                    className="px-3 py-1 text-sm text-red-600 bg-gray-200 hover:bg-gray-300 rounded"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
            <div
              onClick={() => showLevels && dispatch({ type: 'SET_SHOW_LEVELS', payload: false })}
              className={`h-72 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                uploadedImage 
                  ? 'border-0' 
                  : `border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-black bg-gray-50 hover:bg-gray-100'}`
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
            >
              {uploadedImage ? (
                <div className="relative w-full h-full group">
                  <div 
                    className="w-full h-full overflow-hidden"
                  >
                    <div 
                      className="absolute inset-0"
                      style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        cursor: isDraggingImage ? 'grabbing' : 'grab',
                        touchAction: 'none',
                        width: '100%',
                        height: '100%',
                        backgroundImage: `url(${uploadedImage})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                      }}
                      ref={imageRef}
                    />
                  </div>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={(e) => { e.stopPropagation(); zoom(0.05); }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-all bg-white/80 backdrop-blur-sm shadow-md hover:scale-110"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} className="text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); zoom(-0.05); }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-all bg-white/80 backdrop-blur-sm shadow-md hover:scale-110"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} className="text-gray-700" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resetTransform(); }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-all bg-white/80 backdrop-blur-sm shadow-md hover:scale-110"
                      title="Reset"
                    >
                      <RotateCcw size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
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
        </div>
      </div>
    </div>
    </div>
  );
};

export default PhotoTesting;
