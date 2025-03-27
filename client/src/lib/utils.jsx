import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Add debounce utility for performance
export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// Add throttle utility for scroll events
export const throttle = (fn, delay) => {
  let lastCall = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      fn(...args);
      lastCall = now;
    }
  };
};

export const TRANSITIONS = {
  sidebar: {
    type: "tween",
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1], // Custom easing curve
  },
  smooth: {
    type: "tween",
    duration: 0.15,
    ease: "easeInOut",
  }
};
