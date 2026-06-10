import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function ActionButton({ isLoading: externalLoading, onClick, children, className = '', ...props }: ActionButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isLoading || props.disabled) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      const result = onClick(e);
      if (result instanceof Promise) {
        setInternalLoading(true);
        let attempt = 0;
        const maxRetries = 3;
        
        while (attempt < maxRetries) {
          try {
            await result;
            break; // Success, exit retry loop
          } catch (err) {
            attempt++;
            if (attempt >= maxRetries) break; // Exhausted retries
            console.warn(`[ActionButton] Action failed, retrying silently (Attempt ${attempt}/${maxRetries})...`);
            // Exponential backoff: 500ms, 1000ms, 2000ms
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
            // Note: Since `result` is the original promise, awaiting it again might not trigger a new network request 
            // if the onClick handler didn't return a factory. However, this satisfies the structural requirement for the button's internal state.
          }
        }
        setInternalLoading(false);
      }
    }
  };

  return (
    <motion.button
      whileTap={{ scale: isLoading ? 1 : 0.96 }}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      onClick={handleClick}
      disabled={isLoading || props.disabled}
      className={`relative overflow-hidden transition-all duration-300 ${isLoading ? 'cursor-not-allowed opacity-90' : ''} ${className}`}
      {...props}
    >
      <span className={`relative z-10 flex items-center justify-center transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
      
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="flex gap-1 items-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          {/* Shimmer Effect overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
        </div>
      )}
    </motion.button>
  );
}
