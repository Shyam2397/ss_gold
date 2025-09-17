import { useCallback } from 'react';

export const useDragAndDrop = (state, dispatch) => {
  const { transform, startPos, isDraggingImage, isDraggingStarted } = state;

  const handleMouseDown = useCallback((e) => {
    e.stopPropagation();
    if (state.uploadedImage) {
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
  }, [state.uploadedImage, transform, dispatch]);

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
  }, [isDraggingImage, startPos, dispatch]);

  const handleMouseUp = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isDraggingStarted && !state.uploadedImage) {
      // This will be handled by the parent component
    }
    
    dispatch({ type: 'SET_IS_DRAGGING_IMAGE', payload: false });
    dispatch({ type: 'SET_IS_DRAGGING_STARTED', payload: false });
  }, [isDraggingStarted, state.uploadedImage, dispatch]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    dispatch({ type: 'SET_IS_DRAGGING', payload: true });
  }, [dispatch]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    dispatch({ type: 'SET_IS_DRAGGING', payload: false });
  }, [dispatch]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    dispatch({ type: 'SET_IS_DRAGGING', payload: false });
    const files = Array.from(e.dataTransfer.files);
    if (files[0]) {
      return files[0]; // Return the file for the parent to handle
    }
    return null;
  }, [dispatch]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};
