import React from 'react';
import { Camera } from 'lucide-react';

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
          <h2 className="text-xl font-bold text-amber-900">
            Photo Testing Module
          </h2>
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
          className="bg-white border-2 border-yellow-400 shadow-2xl relative" 
          style={{ width: '6in', height: '4in' }} 
          onMouseUp={onDragEnd}
        >
          {GridOverlay && <GridOverlay />}
          
          {Header && <Header />}

          <div className="px-2 py-1 flex gap-2">
            <div className="flex-1 space-y-2">
              {TestResultForm && <TestResultForm formData={formData} />}
            </div>

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
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoTestingLayout;
