// Available categories for blog posts
export const CATEGORIES = [
  'Technology',
  'Programming',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'AI & Machine Learning',
  'DevOps',
  'Design',
  'Business',
  'Startup',
  'Career',
  'Tutorial',
  'News',
  'Opinion',
  'Review',
  'Lifestyle',
  'Health',
  'Finance',
  'Education',
  'Science',
  'Other'
] as const;

export type Category = typeof CATEGORIES[number];

// Category metadata for enhanced display
export const CATEGORY_METADATA: Record<string, { emoji: string; description: string; color: string }> = {
  'Technology': { 
    emoji: '💻', 
    description: 'Tech trends, innovations, and insights',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'Programming': { 
    emoji: '👨‍💻', 
    description: 'Coding, algorithms, and best practices',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  'Web Development': { 
    emoji: '🌐', 
    description: 'Frontend, backend, and full-stack development',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  'Mobile Development': { 
    emoji: '📱', 
    description: 'iOS, Android, and cross-platform apps',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  'Data Science': { 
    emoji: '📊', 
    description: 'Analytics, visualization, and insights',
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200'
  },
  'AI & Machine Learning': { 
    emoji: '🤖', 
    description: 'Artificial intelligence and ML algorithms',
    color: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  'DevOps': { 
    emoji: '⚙️', 
    description: 'Deployment, infrastructure, and automation',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  'Design': { 
    emoji: '🎨', 
    description: 'UI/UX, graphics, and visual design',
    color: 'bg-pink-100 text-pink-800 border-pink-200'
  },
  'Business': { 
    emoji: '💼', 
    description: 'Strategy, management, and entrepreneurship',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  'Startup': { 
    emoji: '🚀', 
    description: 'Entrepreneurship, funding, and growth',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  'Career': { 
    emoji: '💼', 
    description: 'Professional development and job advice',
    color: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  'Tutorial': { 
    emoji: '📚', 
    description: 'Step-by-step guides and how-tos',
    color: 'bg-lime-100 text-lime-800 border-lime-200'
  },
  'News': { 
    emoji: '📰', 
    description: 'Industry news and updates',
    color: 'bg-slate-100 text-slate-800 border-slate-200'
  },
  'Opinion': { 
    emoji: '💭', 
    description: 'Thoughts, perspectives, and commentary',
    color: 'bg-violet-100 text-violet-800 border-violet-200'
  },
  'Review': { 
    emoji: '⭐', 
    description: 'Product and service reviews',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  'Lifestyle': { 
    emoji: '🌱', 
    description: 'Work-life balance and personal development',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  'Health': { 
    emoji: '🏥', 
    description: 'Health, wellness, and medical topics',
    color: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  'Finance': { 
    emoji: '💰', 
    description: 'Money, investing, and financial advice',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  'Education': { 
    emoji: '🎓', 
    description: 'Learning, teaching, and academic topics',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  'Science': { 
    emoji: '🔬', 
    description: 'Research, discoveries, and scientific topics',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  },
  'Other': { 
    emoji: '📝', 
    description: 'Miscellaneous topics and general content',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
};

// Helper function to get category display information
export const getCategoryInfo = (category: string) => {
  return CATEGORY_METADATA[category] || CATEGORY_METADATA['Other'];
}; 