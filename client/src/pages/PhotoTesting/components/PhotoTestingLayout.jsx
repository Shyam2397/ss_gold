import React from 'react';
import { Camera, Printer, ImagePlus, RefreshCw, Trash2, ZoomIn, ZoomOut, SlidersHorizontal } from 'lucide-react';

const PhotoTestingLayout = ({
  tokenNo,
  onTokenNoChange,
  onTokenSearch,
  onResetForm,
  onKeyDown,
  formData,
  onPrint,
  onPhotoChange,
  photoScale = 1,
  onZoomIn,
  onZoomOut,
  onEditImage,
  components = {}
}) => {
  // Destructure the lazy-loaded components with default fallbacks
  const {
    Header,
    TokenSearchForm,
    TestResultForm,
    GridOverlay
  } = components;
  return (
    <div className="min-h-[660px] border-2 border-amber-100 bg-white p-6 m-4 rounded-xl flex flex-col">
      <div className="mb-6">
        <div className="flex items-center mb-4 border-b-2 border-amber-400 pb-2">
          <Camera className="w-6 h-6 text-amber-600 mr-3" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-amber-900">
              Photo Testing
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
        <div className="relative">
          <div
            className="bg-white shadow-2xl relative p-[12.4px] box-border"
            style={{ width: '6in', height: '4in', boxShadow: 'inset 0 0 0 1.4px #FFD700' }}
          >
            {GridOverlay && <GridOverlay />}
            <div
              className="w-full h-full flex p-[4px] box-border"
              style={{ boxShadow: 'inset 0 0 0 1px #dc2626' }}
            >
              {/* Left Wrapper */}
              <div
                className="w-1/2 h-full flex flex-col"
                style={{ boxShadow: 'inset 0 0 0 1px #dc2626' }}
              >
                {Header && <Header />}
                <div className="p-1 flex-grow">
                  {TestResultForm && <TestResultForm formData={formData} />}
                </div>
              </div>

              {/* Right Wrapper */}
              <div
                className="w-1/2 h-full flex flex-col p-[5px] box-border"
                style={{ boxShadow: 'inset 0 0 0 1px #dc2626' }}
              >
                <div className="relative flex-grow max-h-[calc(100%-20px)] flex items-center justify-center overflow-hidden">
                  {formData.photoUrl ? (
                    <img
                      src={formData.photoUrl}
                      alt="Sample"
                      className="absolute left-1/2 top-1/2 object-contain transition-all duration-150"
                      style={{
                        width: `${photoScale * 100}%`,
                        height: `${photoScale * 100}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ) : (
                    <label
                      htmlFor="photo-upload"
                      className="flex h-full w-full cursor-pointer flex-col items-center justify-center text-amber-600 transition-colors hover:text-amber-700"
                    >
                      <ImagePlus className="mb-1 h-8 w-8" />
                      <span className="text-[11px] font-semibold">Upload Photo</span>
                    </label>
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onPhotoChange(file);
                      e.target.value = '';
                    }}
                  />
                </div>
                <div className="text-red-600 font-bold text-[10px] text-center mt-auto">
                  Result are only for skin of the sample.
                </div>
              </div>
            </div>
          </div>

          {/* Photo controls (overlaid on the z-axis, outside the card) */}
          {formData.photoUrl && (
            <div className="absolute left-full top-1/2 z-10 ml-4 flex -translate-y-1/2 flex-col gap-2">
              <button
                type="button"
                onClick={onEditImage}
                title="Edit with Studio"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors hover:bg-indigo-700"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onZoomIn}
                title="Increase image size"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-colors hover:bg-gray-700"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onZoomOut}
                title="Decrease image size"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-colors hover:bg-gray-700"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-center text-[9px] font-semibold text-gray-500">
                {Math.round(photoScale * 100)}%
              </span>
              <label
                htmlFor="photo-upload"
                title="Change photo"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-600 text-white shadow-lg transition-colors hover:bg-amber-700"
              >
                <RefreshCw className="h-4 w-4" />
              </label>
              <button
                type="button"
                onClick={() => onPhotoChange(null)}
                title="Remove photo"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoTestingLayout;
