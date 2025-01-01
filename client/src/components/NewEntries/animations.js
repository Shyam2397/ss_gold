// Animation variants for page transitions
export const pageVariants = {
  initial: { 
    opacity: 0, 
    x: '-5%',
    transition: { 
      duration: 0.4,
      ease: 'easeInOut'
    }
  },
  in: { 
    opacity: 1, 
    x: 0,
    transition: { 
      duration: 0.5,
      ease: 'easeOut'
    }
  },
  out: { 
    opacity: 0, 
    x: '5%',
    transition: { 
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
};

// Animation variants for form sections
export const formSectionVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.98
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 10,
      delay: 0.2
    }
  }
};

// Animation variants for input fields
export const inputVariants = {
  initial: { 
    opacity: 0, 
    x: -10
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 10
    }
  },
  focus: {
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 300
    }
  }
};

// Animation variants for heading icons
export const headingIconVariants = {
  initial: { 
    scale: 0.8, 
    opacity: 0,
    rotate: -20 
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 10
    }
  },
  hover: {
    scale: 1.1,
    rotate: 15,
    transition: {
      type: "spring",
      stiffness: 300
    }
  }
};

// Animation variants for buttons
export const buttonVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: { 
      type: "spring", 
      stiffness: 300 
    }
  },
  tap: { 
    scale: 0.95,
    transition: { 
      type: "spring", 
      stiffness: 500 
    }
  }
};

// Animation variants for delete buttons
export const deleteButtonVariants = {
  initial: { opacity: 0.7, scale: 1 },
  hover: { 
    opacity: 1, 
    scale: 1.1,
    transition: { 
      type: "spring", 
      stiffness: 300 
    }
  },
  tap: { 
    scale: 0.9,
    transition: { 
      type: "spring", 
      stiffness: 500 
    }
  }
};

// Animation variants for container elements
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.2,
      staggerChildren: 0.1
    }
  }
};

// Animation variants for list items
export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: {
      type: "tween",
      duration: 0.2
    }
  }
};

// Animation variants for search section
export const searchVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  }
};
