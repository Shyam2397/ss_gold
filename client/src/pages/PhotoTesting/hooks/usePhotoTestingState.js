import { useReducer } from 'react';

// Reducer function
const photoTestingReducer = (state, action) => {
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

// Initial state
export const initialState = {
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

export const usePhotoTestingState = () => {
  return useReducer(photoTestingReducer, initialState);
};
