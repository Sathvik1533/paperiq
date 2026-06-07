/**
 * AnimatedCard — Dual-state ambient glow system
 * Static: obsidian base with very faint orange shimmer
 * Hover: full orange border glow + lift — hardware-accelerated
 * Reduced motion: pure CSS hover only, no Framer Motion
 */
import { motion, useReducedMotion } from 'framer-motion'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
  delay?: number
}

const BASE =
  'bg-[#111113] border border-[#1e1e22] rounded-2xl transition-all duration-500 ease-out ' +
  'shadow-[0_4px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(255,102,0,0.03)] ' +
  'hover:shadow-[0_0_25px_rgba(255,102,0,0.12)] hover:border-[#ff6600]/30'

export function AnimatedCard({
  children,
  className = '',
  onClick,
  hoverable = true,
  delay = 0,
}: AnimatedCardProps) {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion || !hoverable) {
    return (
      <div className={`${BASE} ${className}`} onClick={onClick}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={`${BASE} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay }}
      whileHover={{
        scale: 1.02,
        translateY: -3,
        boxShadow: '0 0 30px rgba(255,102,0,0.14), 0 4px 30px rgba(0,0,0,0.6)',
      }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  )
}
