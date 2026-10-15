import { useReducer } from 'react';

// Reducer function
const photoTestingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TOKEN_NO':
      return { ...state, tokenNo: action.payload };
    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'RESET_FORM_DATA':
      return { ...initialState };
    default:
      return state;
  }
};

// Initial state
const initialState = {
  tokenNo: '',
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
    remarks: '',
    photoUrl: null
  }
};

export const usePhotoTestingState = () => {
  return useReducer(photoTestingReducer, initialState);
};
