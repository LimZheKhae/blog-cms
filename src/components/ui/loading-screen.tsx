"use client"

interface LoadingScreenProps {
  title?: string
  subtitle?: string
}

export const LoadingScreen = ({ 
  title = "Loading",
  subtitle = "Preparing your experience..."
}: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 rounded-full blur-2xl animate-pulse [animation-delay:1s]" />
      </div>

      <div className="relative z-10 text-center">
        {/* Modern loading spinner */}
        <div className="relative mb-8">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            {/* Outer ring */}
            <div className="absolute inset-0 border-4 border-slate-200/50 dark:border-slate-700/50 rounded-full"></div>
            {/* Spinning gradient ring */}
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 border-r-blue-600/60 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            {/* Inner ring with slower spin */}
            <div className="absolute inset-2 border-2 border-transparent border-t-purple-500 rounded-full animate-spin [animation-duration:2s] [animation-direction:reverse]"></div>
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Elegant loading dots */}
          <div className="flex justify-center items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]">
            {title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 opacity-0 animate-[fadeIn_0.6s_ease-out_0.3s_forwards]">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  )
} 