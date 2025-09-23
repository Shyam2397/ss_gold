import React from 'react';
import { Camera, Printer } from 'lucide-react';

const PhotoTestingLayout = ({
  tokenNo,
  onTokenNoChange,
  onTokenSearch,
  onResetForm,
  onKeyDown,
  formData,
  onImageUpload,
  transform,
  isDraggingImage,
  showLevels,
  originalImage,
  adjustedImage,
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
  uploadedImage,
  isDragging,
  onPrint,
  onArrowsChange,
  components = {}
}) => {
  // Destructure the lazy-loaded components with default fallbacks
  const {
    Header,
    TokenSearchForm,
    TestResultForm,
    ImageEditor,
    GridOverlay
  } = components;
  return (
    <div className="min-h-[700px] border-2 border-amber-100 bg-white p-6 m-4 rounded-xl flex flex-col">
      <div className="mb-6">
        <div className="flex items-center mb-4 border-b-2 border-amber-400 pb-2">
          <Camera className="w-6 h-6 text-amber-600 mr-3" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-amber-900">
              Photo Testing Module
            </h2>
          </div>
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            title="Print Report"
          >
            <Printer className="w-5 h-5" />
            <span>Print</span>
          </button>
        </div>
        
        {TokenSearchForm && (
          <TokenSearchForm 
            tokenNo={tokenNo}
            onTokenNoChange={onTokenNoChange}
            onSearch={onTokenSearch}
            onReset={onResetForm}
            onKeyDown={onKeyDown}
          />
        )}
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="bg-white shadow-2xl relative p-[12.4px] box-border"
          style={{ width: '6in', height: '4in', boxShadow: 'inset 0 0 0 1.4px #FFD700' }}
          onMouseUp={onDragEnd}
        >
          {GridOverlay && <GridOverlay />}
          <div className="w-full h-full flex border border-yellow-400 p-[4px] box-border">
            {/* Left Wrapper */}
            <div className="w-1/2 h-full border border-yellow-400 flex flex-col">
              {Header && <Header />}
              <div className="p-1 flex-grow">
                {TestResultForm && <TestResultForm formData={formData} />}
              </div>
            </div>

            {/* Right Wrapper */}
            <div className="w-1/2 h-full border border-yellow-400 flex flex-col p-[5px] box-border">
              <div className="flex-grow max-h-[calc(100%-20px)]">
                {ImageEditor && (
                  <ImageEditor
                    uploadedImage={uploadedImage}
                    transform={{ ...transform, isDragging: isDraggingImage }}
                    showLevels={showLevels}
                    originalImage={originalImage}
                    onImageUpload={onImageUpload}
                    onZoom={onZoom}
                    onResetTransform={onResetTransform}
                    onToggleLevels={onToggleLevels}
                    onApplyLevels={onApplyLevels}
                    onResetLevels={onResetLevels}
                    onCloseAdjustment={onCloseAdjustment}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    fileInputRef={fileInputRef}
                    onFileSelect={onFileSelect}
                    isDragging={isDragging}
                    onArrowsChange={onArrowsChange}
                  />
                )}
              </div>
              <div className="text-red-600 font-bold text-[10px] text-center mt-auto">
                Result are only for skin of the sample.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoTestingLayout;
