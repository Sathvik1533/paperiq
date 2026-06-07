/**
 * Animated Button Component
 * Spring-driven micro-interactions on all interactive buttons
 */

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion"
import { hoverScale, tapScale, SPRING_SNAPPY } from "../../lib/motion"

// Use framer-motion's own button props type to avoid event handler conflicts
interface AnimatedButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "ghost"
  children: React.ReactNode
}

export function AnimatedButton({ 
  variant = "secondary", 
  children, 
  className = "",
  ...props 
}: AnimatedButtonProps) {
  const shouldReduceMotion = useReducedMotion()

  const baseStyles = "inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
  
  const variantStyles = {
    primary: "bg-[#ff6600] text-white hover:bg-[#ff8533]",
    secondary: "border border-[#362f27] hover:border-[#ff6600] hover:text-[#ff6600]",
    ghost: "hover:bg-[#f5f0e8]"
  }

  if (shouldReduceMotion) {
    return (
      <button 
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        onClick={props.onClick as any}
        disabled={props.disabled}
        type={props.type}
        form={props.form}
        name={props.name}
        value={props.value as any}
        aria-label={props["aria-label"]}
      >
        {children}
      </button>
    )
  }

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      whileHover={hoverScale}
      whileTap={tapScale}
      transition={SPRING_SNAPPY}
      {...props}
    >
      {children}
    </motion.button>
  )
}
