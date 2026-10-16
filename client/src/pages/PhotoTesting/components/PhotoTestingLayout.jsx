import { useEffect, useRef, useState } from 'react';
import { Camera, Printer, ImagePlus, RefreshCw, Trash2, ZoomIn, ZoomOut, SlidersHorizontal } from 'lucide-react';
import PhotoArrows from './PhotoArrows';

// The card is authored at exactly 6in x 4in (96 CSS px per inch) so it matches
// the printed sheet 1:1. On smaller viewports we scale the whole card (never the
// print output) down about its top-left so it always fits the available width.
const CARD_W = 6 * 96;
const CARD_H = 4 * 96;
const CONTROLS_EXTRA = 60; // width of the photo-control column that sits right of the card

const PhotoTestingLayout = ({
  tokenNo,
  onTokenNoChange,
  onTokenSearch,
  onResetForm,
  onKeyDown,
  tokenInputRef,
  formData,
  onPrint,
  onPhotoChange,
  photoScale = 1,
  onZoomIn,
  onZoomOut,
  onEditImage,
  arrows = [],
  onArrowChange,
  components = {}
}) => {
  // Destructure the lazy-loaded components with default fallbacks
  const {
    Header,
    TokenSearchForm,
    TestResultForm,
    GridOverlay
  } = components;
  const photoAreaRef = useRef(null);
  const fitRef = useRef(null);
  const [cardScale, setCardScale] = useState(1);

  // Scale the fixed 6x4in card (plus its side controls) down to whatever width
  // the container can give, so the preview fits phones/tablets without changing
  // the card's internal geometry (arrows still map 1:1 to the print).
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return undefined;
    const compute = () => {
      const avail = el.clientWidth;
      const availH = el.clientHeight;
      if (!avail || !availH) return;
      const byWidth = avail / (CARD_W + CONTROLS_EXTRA);
      const byHeight = availH / CARD_H;
      setCardScale(Math.min(1, byWidth, byHeight));
    };
    compute();
    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(compute);
      observer.observe(el);
    } else {
      window.addEventListener('resize', compute);
    }
    return () => {
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', compute);
    };
  }, []);

  return (
    <div className="flex h-[calc(100dvh-4rem-1rem)] flex-col overflow-hidden rounded-xl border-2 border-amber-100 bg-white p-3 m-2 sm:h-[calc(100dvh-4rem-2rem)] sm:p-6 sm:m-4">
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
            inputRef={tokenInputRef}
          />
        )}
      </div>

      <div ref={fitRef} className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div
          style={{
            width: (CARD_W + CONTROLS_EXTRA) * cardScale,
            height: CARD_H * cardScale,
            position: 'relative',
          }}
        >
          <div
            className="relative"
            style={{
              width: CARD_W,
              height: CARD_H,
              transform: `scale(${cardScale})`,
              transformOrigin: 'top left',
            }}
          >
          <div
            className="bg-white shadow-2xl relative p-[12.4px] box-border"
            style={{ width: '6in', height: '4in', boxShadow: 'inset 0 0 0 1.4px #FFD700' }}
          >
            {GridOverlay && <GridOverlay />}
            <div
              className="w-full h-full flex p-[4px] box-border"
              style={{ boxShadow: 'inset 0 0 0 1px #FFD700' }}
            >
              {/* Left Wrapper */}
              <div
                className="w-1/2 h-full flex flex-col"
                style={{ boxShadow: 'inset 0 0 0 1px #FFD700' }}
              >
                {Header && <Header />}
                <div className="p-1 flex-grow">
                  {TestResultForm && <TestResultForm formData={formData} />}
                </div>
              </div>

              {/* Right Wrapper */}
              <div
                className="w-1/2 h-full flex flex-col p-[5px] box-border"
                style={{ boxShadow: 'inset 0 0 0 1px #FFD700' }}
              >
                <div
                  ref={photoAreaRef}
                  className="relative flex-grow max-h-[calc(100%-20px)] flex items-center justify-center overflow-hidden"
                >
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
                  {formData.photoUrl && (
                    <PhotoArrows arrows={arrows} onChange={onArrowChange} containerRef={photoAreaRef} />
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
                aria-label="Edit photo in Studio"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors hover:bg-indigo-700"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onZoomIn}
                title="Increase image size"
                aria-label="Zoom in"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-600 text-white shadow-lg transition-colors hover:bg-gray-700"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onZoomOut}
                title="Decrease image size"
                aria-label="Zoom out"
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
                aria-label="Change photo"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-600 text-white shadow-lg transition-colors hover:bg-amber-700"
              >
                <RefreshCw className="h-4 w-4" />
              </label>
              <button
                type="button"
                onClick={() => onPhotoChange(null)}
                title="Remove photo"
                aria-label="Remove photo"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-colors hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoTestingLayout;
