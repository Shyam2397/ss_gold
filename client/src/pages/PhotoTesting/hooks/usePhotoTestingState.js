import { useReducer } from 'react';

// Initial state factory so every reset returns a fresh, independent object.
const createInitialState = () => ({
  tokenNo: '',
  formData: {
    name: '',
    sample: '',
    weight: '',
    date: '',
    goldFineness: '',
    karat: '',
    silver: '',
    copper: '',
    zinc: '',
    cadmium: '',
    remarks: '',
    photoUrl: null
  }
});

// Reducer function
const photoTestingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TOKEN_NO':
      return { ...state, tokenNo: action.payload };
    case 'UPDATE_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'RESET_FORM_DATA':
      return createInitialState();
    default:
      return state;
  }
};

export const usePhotoTestingState = () => {
  return useReducer(photoTestingReducer, undefined, createInitialState);
};
