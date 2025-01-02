export const transitionConfig = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

export const smoothSpringTransition = {
  type: "spring",
  stiffness: 120,
  damping: 10,
  mass: 0.5
};

export const pageVariants = {
  initial: { 
    opacity: 0, 
    x: '-5%',
    transition: {
      ...transitionConfig,
      duration: 0.4
    }
  },
  in: { 
    opacity: 1, 
    x: 0,
    transition: {
      ...transitionConfig,
      duration: 0.5
    }
  },
  out: { 
    opacity: 0, 
    x: '5%',
    transition: {
      ...transitionConfig,
      duration: 0.4
    }
  }
};

export const componentVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.98,
    transition: {
      ...transitionConfig
    }
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      ...smoothSpringTransition,
      delay: 0.1
    }
  }
};

export const formVariants = {
  initial: { 
    opacity: 0, 
    y: 10,
    transition: transitionConfig
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      ...smoothSpringTransition,
      delay: 0.2
    }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: transitionConfig
  }
};

export const headingIconVariants = {
  initial: { 
    scale: 0.7, 
    opacity: 0,
    rotate: -15,
    transition: transitionConfig
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    rotate: 0,
    transition: {
      ...smoothSpringTransition,
      delay: 0.3
    }
  },
  hover: {
    scale: 1.1,
    rotate: 10,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 5
    }
  }
};
