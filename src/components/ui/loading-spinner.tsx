"use client"

import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  showText?: boolean
  text?: string
}

const sizeConfig = {
  sm: {
    container: "w-8 h-8",
    center: "w-1.5 h-1.5",
    dots: "w-1 h-1 space-x-0.5"
  },
  md: {
    container: "w-12 h-12", 
    center: "w-2 h-2",
    dots: "w-1.5 h-1.5 space-x-0.5"
  },
  lg: {
    container: "w-16 h-16",
    center: "w-2.5 h-2.5", 
    dots: "w-1.5 h-1.5 space-x-1"
  },
  xl: {
    container: "w-20 h-20",
    center: "w-3 h-3",
    dots: "w-2 h-2 space-x-1"
  }
}

export const LoadingSpinner = ({ 
  size = "md", 
  className,
  showText = false,
  text = "Loading..."
}: LoadingSpinnerProps) => {
  const config = sizeConfig[size]
  
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {/* Modern loading spinner */}
      <div className="relative mb-4">
        <div className={cn("mx-auto relative", config.container)}>
          {/* Outer ring */}
          <div className="absolute inset-0 border-2 border-slate-200/50 dark:border-slate-700/50 rounded-full"></div>
          {/* Spinning gradient ring */}
          <div className="absolute inset-0 border-2 border-transparent border-t-blue-600 border-r-blue-600/60 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          {/* Inner ring with slower spin */}
          <div className="absolute inset-1 border border-transparent border-t-purple-500 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]"></div>
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse", config.center)}></div>
          </div>
        </div>
        
        {/* Elegant loading dots */}
        <div className={cn("flex justify-center items-center mt-2", config.dots)}>
          <div className={cn("bg-blue-500 rounded-full animate-pulse", config.dots.includes('w-1 ') ? 'w-1 h-1' : config.dots.includes('w-1.5') ? 'w-1.5 h-1.5' : 'w-2 h-2')}></div>
          <div className={cn("bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]", config.dots.includes('w-1 ') ? 'w-1 h-1' : config.dots.includes('w-1.5') ? 'w-1.5 h-1.5' : 'w-2 h-2')}></div>
          <div className={cn("bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]", config.dots.includes('w-1 ') ? 'w-1 h-1' : config.dots.includes('w-1.5') ? 'w-1.5 h-1.5' : 'w-2 h-2')}></div>
        </div>
      </div>

      {/* Optional text */}
      {showText && (
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 opacity-0 animate-[fadeIn_0.6s_ease-out_0.3s_forwards]">
            {text}
          </p>
        </div>
      )}
    </div>
  )
} 