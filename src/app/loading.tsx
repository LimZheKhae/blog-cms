const Loading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center">
        {/* Animated loading spinner */}
        <div className="relative mb-8">
          <div className="w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-blue-200 dark:border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
          </div>
          
          {/* Pulsing dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce delay-200"></div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Loading...
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Please wait while we prepare your content
        </p>
      </div>
    </div>
  );
};

export default Loading; 