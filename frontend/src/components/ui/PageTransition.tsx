/**
 * PageTransition — Liquid-smooth page context routing
 * Wraps every route's content for seamless tab switching (Dashboard → Analysis → Papers)
 * Spring-physics enter: opacity 0→1 + y 16→0
 * Instant exit: opacity 1→0 in 150ms to avoid linger
 * Reduced-motion: renders static div, no animation
 */
import { motion, useReducedMotion } from 'framer-motion'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
  id?: string
}

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}

export function PageTransition({ children, className = '', id }: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className} id={id}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      id={id}
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  )
}
