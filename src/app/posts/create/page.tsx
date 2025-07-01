'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  FileText, 
  Tag, 
  Clock, 
  User,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { LoadingScreen } from '@/components/ui/loading-screen';

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: 'draft' | 'published';
  reading_time_minutes: number;
}

const CreatePostPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: [],
    status: 'draft',
    reading_time_minutes: 0
  });

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/posts/create');
      return;
    }

    // Check if user has permission to create posts (author, editor, admin)
    const allowedRoles = ['author', 'editor', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
      toast.error('You don\'t have permission to create posts!');
      router.push('/posts');
      return;
    }
  }, [session, status, router]);

  // Auto-generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Calculate reading time based on content (strips HTML tags)
  const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    // Strip HTML tags and count words
    const textContent = content.replace(/<[^>]*>/g, '').trim();
    const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  // Handle form field changes
  const handleInputChange = (field: keyof PostFormData, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug when title changes
      if (field === 'title') {
        updated.slug = generateSlug(value);
      }
      
      // Auto-calculate reading time when content changes
      if (field === 'content') {
        updated.reading_time_minutes = calculateReadingTime(value);
      }
      
      return updated;
    });
  };

  // Handle tag addition
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
      toast.success(`🏷️ Tag "${tag}" added!`, {
        className: '!bg-gradient-to-r !from-green-50 !to-emerald-50 !text-green-800 !border-green-200',
        progressClassName: '!bg-gradient-to-r !from-green-400 !to-emerald-500',
      });
    } else if (formData.tags.includes(tag)) {
      toast.warn('⚠️ Tag already exists!', {
        className: '!bg-gradient-to-r !from-amber-50 !to-yellow-50 !text-amber-800 !border-amber-200',
        progressClassName: '!bg-gradient-to-r !from-amber-400 !to-yellow-500',
      });
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    toast.info(`🗑️ Tag "${tagToRemove}" removed`, {
      className: '!bg-gradient-to-r !from-blue-50 !to-indigo-50 !text-blue-800 !border-blue-200',
      progressClassName: '!bg-gradient-to-r !from-blue-400 !to-indigo-500',
    });
  };

  // Handle tag input key press
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('❌ Title is required!', {
        className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
        progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
      });
      return false;
    }
    
    if (!formData.content.trim()) {
      toast.error('❌ Content is required!', {
        className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
        progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
      });
      return false;
    }
    
    if (!formData.excerpt.trim()) {
      toast.error('❌ Excerpt is required!', {
        className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
        progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
      });
      return false;
    }
    
    if (formData.title.length > 255) {
      toast.error('❌ Title must be less than 255 characters!', {
        className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
        progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
      });
      return false;
    }
    
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const submitToast = toast.loading('✨ Creating your post...', {
      position: 'top-center',
      className: '!bg-gradient-to-r !from-blue-50 !to-indigo-50 !text-blue-800 !border-blue-200',
    });

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          author_id: session?.user.id
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.update(submitToast, {
          render: `🎉 Post "${formData.title}" created successfully!`,
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          className: '!bg-gradient-to-r !from-green-50 !to-emerald-50 !text-green-800 !border-green-200',
          progressClassName: '!bg-gradient-to-r !from-green-400 !to-emerald-500',
        });
        
        // Redirect to the new post
        setTimeout(() => {
          router.push(`/posts/${result.post.slug}`);
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.update(submitToast, {
        render: `❌ Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
        progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    const draftData = { ...formData, status: 'draft' as const };
    setFormData(draftData);
    
    // Trigger form submission with draft status
    const form = document.getElementById('post-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  // Handle publish
  const handlePublish = async () => {
    const publishData = { ...formData, status: 'published' as const };
    setFormData(publishData);
    
    // Trigger form submission with published status
    const form = document.getElementById('post-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  if (status === 'loading') {
    return <LoadingScreen title="Preparing Editor" subtitle="Setting up your writing environment..." />
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-400/10 to-orange-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 hover:bg-white/50 dark:hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                Create New Post
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Share your thoughts with the world
              </p>
            </div>
          </div>
        </div>

        <form id="post-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Slug */}
              <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span>Post Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter an engaging title..."
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="mt-1 h-12 text-lg bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug" className="text-sm font-medium">
                      URL Slug
                    </Label>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="auto-generated-from-title"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className="mt-1 bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Auto-generated from title. You can customize it.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Content */}
              <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle>Content <span className="text-red-500">*</span></CardTitle>
                  <CardDescription>
                    Write your post content with our rich text editor. Supports formatting, links, and more.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => handleInputChange('content', content)}
                    placeholder="Start writing your amazing content here..."
                    disabled={isLoading}
                  />
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>HTML: {formData.content.length} characters</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formData.reading_time_minutes} min read</span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Excerpt */}
              <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle>Excerpt <span className="text-red-500">*</span></CardTitle>
                  <CardDescription>
                    A brief summary that appears in post previews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Write a compelling excerpt that makes people want to read more..."
                    value={formData.excerpt}
                    onChange={(e) => handleInputChange('excerpt', e.target.value)}
                    className="h-24 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {formData.excerpt.length}/200 characters recommended
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Publish Actions */}
              <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                    <User className="w-4 h-4" />
                    <span>Author: {session.user.name}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button
                      type="button"
                      onClick={handleSaveAsDraft}
                      variant="outline"
                      className="w-full"
                      disabled={isLoading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save as Draft
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={handlePublish}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isLoading}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Publish Post
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="w-5 h-5" />
                    <span>Tags</span>
                  </CardTitle>
                  <CardDescription>
                    Add tags to help categorize your post
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Add a tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagKeyPress}
                      className="flex-1 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      onClick={handleAddTag}
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                            disabled={isLoading}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Post Stats Preview */}
              <Card className="shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Post Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Reading Time:</span>
                    <span className="font-medium">{formData.reading_time_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Word Count:</span>
                    <span className="font-medium">{formData.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tags:</span>
                    <span className="font-medium">{formData.tags.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Status:</span>
                    <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                      {formData.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {isLoading && <LoadingScreen />}
    </div>
  );
};

export default CreatePostPage; 