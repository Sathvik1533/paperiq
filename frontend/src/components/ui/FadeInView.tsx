/**
 * Fade In View Component
 * Viewport-triggered animations for scroll-based reveals
 */

import { motion, useReducedMotion } from "framer-motion"
import { viewportFadeIn } from "../../lib/motion"

interface FadeInViewProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function FadeInView({ 
  children, 
  className = "",
  delay = 0
}: FadeInViewProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={viewportFadeIn}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}
