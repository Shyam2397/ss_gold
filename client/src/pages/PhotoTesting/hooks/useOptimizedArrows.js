import { useCallback, useState, useEffect, useRef, useMemo } from 'react';

/**
 * Performance-optimized arrow management hook
 * Reduces re-renders and optimizes drag operations
 */
export const useOptimizedArrows = (onArrowsChange) => {
  const [arrows, setArrows] = useState([
    { id: 1, x: 80, y: 80, angle: 0, isDragging: false },
    { id: 2, x: 180, y: 180, angle: 45, isDragging: false }
  ]);
  
  const [activeArrow, setActiveArrow] = useState(null);
  const rafRef = useRef();
  const lastNotifyTime = useRef(0);
  
  // Throttled notification to parent to prevent excessive re-renders
  const throttledNotify = useCallback((newArrows) => {
    const now = Date.now();
    if (now - lastNotifyTime.current > 16) { // ~60fps limit
      lastNotifyTime.current = now;
      onArrowsChange?.(newArrows);
    }
  }, [onArrowsChange]);

  // Memoized arrow operations
  const arrowOperations = useMemo(() => ({
    addArrow: () => {
      setArrows(currentArrows => {
        const newId = Math.max(0, ...currentArrows.map(a => a.id)) + 1;
        const container = document.querySelector('.w-full.h-full.overflow-hidden.relative') ||
                         document.querySelector('.relative.w-full.h-full.group');
        
        let containerWidth = 300, containerHeight = 300;
        if (container) {
          const rect = container.getBoundingClientRect();
          containerWidth = rect.width;
          containerHeight = rect.height;
        }
        
        const newArrow = {
          id: newId,
          x: Math.min(50 + (newId * 30), containerWidth - 100),
          y: Math.min(50 + (newId * 30), containerHeight - 50),
          angle: 0,
          isDragging: false
        };
        
        const updatedArrows = [...currentArrows, newArrow];
        throttledNotify(updatedArrows);
        return updatedArrows;
      });
    },

    removeArrow: () => {
      setArrows(currentArrows => {
        if (currentArrows.length === 0) return currentArrows;
        const updatedArrows = currentArrows.slice(0, -1);
        throttledNotify(updatedArrows);
        return updatedArrows;
      });
    }
  }), [throttledNotify]);

  // Optimized mouse handlers with RAF
  const handleArrowMouseDown = useCallback((e, arrowId) => {
    e.stopPropagation();
    
    const imageContainer = e.currentTarget.closest('.w-full.h-full.overflow-hidden.relative');
    const containerRect = imageContainer ? imageContainer.getBoundingClientRect() : 
                         e.currentTarget.closest('.relative.w-full.h-full.group').getBoundingClientRect();
    
    if (e.shiftKey) {
      setActiveArrow({ 
        id: arrowId, 
        type: 'rotate', 
        startX: e.clientX,
        containerRect
      });
    } else {
      const containerX = e.clientX - containerRect.left;
      const containerY = e.clientY - containerRect.top;
      
      setActiveArrow({ 
        id: arrowId, 
        type: 'move', 
        startX: e.clientX, 
        startY: e.clientY,
        containerRect,
        startContainerX: containerX,
        startContainerY: containerY
      });
    }
    
    setArrows(currentArrows => 
      currentArrows.map(arrow => 
        arrow.id === arrowId ? { ...arrow, isDragging: true } : arrow
      )
    );
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!activeArrow) return;

    // Cancel any pending RAF
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Use RAF for smooth dragging
    rafRef.current = requestAnimationFrame(() => {
      setArrows(currentArrows => {
        const updatedArrows = currentArrows.map(arrow => {
          if (arrow.id === activeArrow.id) {
            if (activeArrow.type === 'rotate') {
              const containerRect = activeArrow.containerRect;
              const centerX = containerRect.left + (containerRect.width / 2);
              const centerY = containerRect.top + (containerRect.height / 2);
              const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
              return { ...arrow, angle };
            } else {
              const containerRect = activeArrow.containerRect;
              const newContainerX = e.clientX - containerRect.left;
              const newContainerY = e.clientY - containerRect.top;
              
              const arrowWidth = 43;
              const maxX = containerRect.width - arrowWidth;
              const maxY = containerRect.height - 10;
              
              const finalX = Math.max(0, Math.min(newContainerX, maxX));
              const finalY = Math.max(0, Math.min(newContainerY, maxY));
              
              return { ...arrow, x: finalX, y: finalY };
            }
          }
          return arrow;
        });
        
        // Throttled notification during drag
        throttledNotify(updatedArrows);
        return updatedArrows;
      });
    });
  }, [activeArrow, throttledNotify]);

  const handleMouseUp = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    if (activeArrow) {
      setArrows(currentArrows => 
        currentArrows.map(arrow => 
          arrow.id === activeArrow.id ? { ...arrow, isDragging: false } : arrow
        )
      );
      setActiveArrow(null);
    }
  }, [activeArrow]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    arrows,
    activeArrow,
    handleArrowMouseDown,
    handleMouseMove,
    handleMouseUp,
    addArrow: arrowOperations.addArrow,
    removeArrow: arrowOperations.removeArrow
  };
};