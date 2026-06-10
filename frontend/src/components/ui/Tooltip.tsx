import { ReactNode, useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface TooltipProps {
  content: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ content, children, placement = 'top', delay = 300, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | null>(null)
  const shouldReduceMotion = useReducedMotion()

  const updatePosition = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    
    // Add offset for the scroll position since it's a portal but we'll use fixed positioning
    // Wait, if it's fixed positioning we don't need scroll offset, we just use rect.
    
    // Calculate tooltip dimensions (approximate, since it's not rendered yet we'll adjust via CSS transform later, 
    // but we need to give it a base position relative to the trigger).
    // Let's set the origin point exactly at the edge of the trigger.
    
    let top = 0
    let left = 0

    const GAP = 8

    switch (placement) {
      case 'top':
        top = rect.top - GAP
        left = rect.left + rect.width / 2
        break
      case 'bottom':
        top = rect.bottom + GAP
        left = rect.left + rect.width / 2
        break
      case 'left':
        top = rect.top + rect.height / 2
        left = rect.left - GAP
        break
      case 'right':
        top = rect.top + rect.height / 2
        left = rect.right + GAP
        break
    }

    setCoords({ top, left })
  }

  const handleMouseEnter = () => {
    updatePosition()
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
    }
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isVisible])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  // Framer motion variants based on placement
  const getVariants = () => {
    if (shouldReduceMotion) return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    
    switch (placement) {
      case 'top': return { initial: { opacity: 0, y: 5, x: '-50%', scale: 0.95 }, animate: { opacity: 1, y: 0, x: '-50%', scale: 1 }, exit: { opacity: 0, y: 2, x: '-50%', scale: 0.95 } }
      case 'bottom': return { initial: { opacity: 0, y: -5, x: '-50%', scale: 0.95 }, animate: { opacity: 1, y: 0, x: '-50%', scale: 1 }, exit: { opacity: 0, y: -2, x: '-50%', scale: 0.95 } }
      case 'left': return { initial: { opacity: 0, x: 5, y: '-50%', scale: 0.95 }, animate: { opacity: 1, x: 0, y: '-50%', scale: 1 }, exit: { opacity: 0, x: 2, y: '-50%', scale: 0.95 } }
      case 'right': return { initial: { opacity: 0, x: -5, y: '-50%', scale: 0.95 }, animate: { opacity: 1, x: 0, y: '-50%', scale: 1 }, exit: { opacity: 0, x: -2, y: '-50%', scale: 0.95 } }
    }
  }

  return (
    <>
      <div 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex w-full"
      >
        {children}
      </div>

      {createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={getVariants()}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`fixed z-[9999] pointer-events-none px-3 py-1.5 bg-[#1a1a1e]/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl shadow-black/50 text-xs text-white max-w-[250px] text-center ${className}`}
              style={{
                top: coords.top,
                left: coords.left,
                // Adjust transform origin for scale animations based on placement
                transformOrigin: placement === 'top' ? 'bottom center' : placement === 'bottom' ? 'top center' : placement === 'left' ? 'center right' : 'center left'
              }}
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
