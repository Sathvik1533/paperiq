/**
 * Motion Design System - Spring Physics & Animation Tokens
 * Adheres to interaction-patterns.md governance
 */

import { Transition, Variants } from "framer-motion"

// SPRING PHYSICS TOKENS - Snappy, premium feel
export const SPRING_SNAPPY: Transition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
}

export const SPRING_SMOOTH: Transition = {
  type: "spring" as const,
  stiffness: 200,
  damping: 25,
}

export const SPRING_BOUNCY: Transition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 18,
}

// Helper: spring token with an optional delay — preserves the literal type through spreads
export const springDelay = (delay: number, base: Transition = SPRING_SNAPPY): Transition => ({
  ...base,
  delay,
})

// DURATION TOKENS - Never exceed 800ms (DESIGN-BIBLE Part 5)
export const DURATION_FAST = 0.2
export const DURATION_NORMAL = 0.35
export const DURATION_SLOW = 0.5

// EASING TOKENS (fallback for tween animations)
export const EASE_OUT = [0.16, 1, 0.3, 1] // Canonical ease-out-expo
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] // Smooth in-out

// PAGE TRANSITION VARIANTS
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: SPRING_SNAPPY
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: DURATION_FAST }
  }
}

// STAGGER CHILDREN VARIANTS (for lists, grids)
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: SPRING_SNAPPY
  }
}

// VIEWPORT FADE-IN (for scroll-triggered elements)
export const viewportFadeIn: Variants = {
  initial: { opacity: 0, y: 20 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: SPRING_SMOOTH
  }
}

// HOVER & TAP INTERACTIONS (for buttons, cards, interactive elements)
export const hoverScale = {
  scale: 1.03,
  translateY: -2,
  transition: SPRING_SNAPPY
}

export const tapScale = {
  scale: 0.97,
  transition: SPRING_SNAPPY
}

// GLOW EFFECT (technical orange highlight on hover)
export const glowHover = {
  boxShadow: "0 0 20px rgba(255, 102, 0, 0.4)",
  transition: { duration: DURATION_NORMAL }
}

// NAVIGATION TAB VARIANTS
export const navTabVariants: Variants = {
  initial: { opacity: 0.7 },
  hover: { 
    opacity: 1,
    scale: 1.03,
    translateY: -2,
    transition: SPRING_SNAPPY
  },
  tap: { 
    scale: 0.97,
    transition: SPRING_SNAPPY
  },
  active: {
    opacity: 1,
    scale: 1,
  }
}

// MODAL/DIALOG VARIANTS
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: DURATION_FAST } },
  exit: { opacity: 0, transition: { duration: DURATION_FAST } }
}

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: SPRING_SMOOTH
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: { duration: DURATION_FAST }
  }
}

// CARD VARIANTS
export const cardHover: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: SPRING_SNAPPY
  }
}

// REDUCED MOTION UTILITIES
export const getReducedMotionVariants = (variants: Variants): Variants => {
  const reduced: Variants = {}
  Object.keys(variants).forEach(key => {
    reduced[key] = { opacity: 1, x: 0, y: 0, scale: 1 }
  })
  return reduced
}
