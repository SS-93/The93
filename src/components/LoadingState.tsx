import React from 'react'
import { motion } from 'framer-motion'

interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="mb-4"
      >
        <svg className={`${sizeClasses[size]} text-accent-yellow`} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="16" strokeDashoffset="12" strokeLinecap="round"/>
        </svg>
      </motion.div>
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}

export default LoadingState 