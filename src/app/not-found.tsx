'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  Search, 
  ArrowLeft, 
  BookOpen, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

const NotFoundPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsAnimating(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirect to search results or posts page with query
      window.location.href = `/posts?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-cyan-600/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Animated 404 */}
        <div className={`transition-all duration-1000 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="relative mb-8">
            <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 text-9xl md:text-[12rem] font-black text-blue-600/10 dark:text-blue-400/10 blur-sm">
              404
            </div>
            {/* Floating sparkles */}
            <Sparkles className="absolute top-4 left-1/4 w-8 h-8 text-yellow-400 animate-bounce delay-300" />
            <Sparkles className="absolute top-16 right-1/3 w-6 h-6 text-pink-400 animate-bounce delay-700" />
            <Sparkles className="absolute bottom-8 left-1/3 w-7 h-7 text-blue-400 animate-bounce delay-1000" />
          </div>
        </div>

        {/* Main content */}
        <div className={`transition-all duration-1000 delay-300 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="space-y-6 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">
              Oops! Page Not Found
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              The page you're looking for seems to have wandered off into the digital void. 
              Don't worry though – let's get you back on track!
            </p>
          </div>

          {/* Search section */}
          <Card className="mb-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-slate-400" />
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    Search for something else
                  </h3>
                </div>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 h-12 text-base bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  <Button 
                    type="submit" 
                    size="lg"
                    className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 group"
              >
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold">Go Home</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Back to homepage</div>
                </div>
              </Button>
            </Link>

            <Link href="/posts">
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-slate-700 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 group"
              >
                <BookOpen className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="font-semibold">Browse Posts</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Explore our content</div>
                </div>
              </Button>
            </Link>

            <Button 
              variant="outline" 
              size="lg" 
              onClick={handleRefresh}
              className="w-full h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200 group"
            >
              <RefreshCw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
              <div className="text-left">
                <div className="font-semibold">Try Again</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Refresh this page</div>
              </div>
            </Button>
          </div>

          {/* Popular posts suggestion */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-0 shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center justify-center">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                Popular Content
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link 
                  href="/posts/welcome-to-company-blog"
                  className="block p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group"
                >
                  <h4 className="font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Welcome to Our Company Blog
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Getting started with our platform
                  </p>
                  <div className="flex items-center mt-2 text-xs text-slate-400">
                    <span>1,234 views</span>
                    <span className="mx-2">•</span>
                    <span>3 min read</span>
                  </div>
                </Link>

                <Link 
                  href="/posts/getting-started-guide"
                  className="block p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 group"
                >
                  <h4 className="font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Getting Started Guide
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Comprehensive guide to our features
                  </p>
                  <div className="flex items-center mt-2 text-xs text-slate-400">
                    <span>567 views</span>
                    <span className="mx-2">•</span>
                    <span>8 min read</span>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Back link */}
          <div className={`mt-8 transition-all duration-1000 delay-700 ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button 
              variant="ghost" 
              onClick={() => window.history.back()}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-transparent group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go back to previous page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 