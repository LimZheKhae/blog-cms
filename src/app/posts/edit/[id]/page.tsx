'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
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
  FileEdit, 
  Tag, 
  Clock, 
  User,
  Sparkles,
  X,
  Plus,
  Loader2,
  CheckCircle,
  Shield
} from 'lucide-react';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORIES, getCategoryInfo } from '@/lib/categories';
import Link from 'next/link';

interface PostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: "draft" | "published";
  category?: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  reading_time_minutes?: number;
  tags?: string[];
}

interface PostFormData {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  status: 'draft' | 'published';
  reading_time_minutes: number;
}

const EditPostPage = () => {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { data: session, status } = useSession();

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const hasFetched = useRef(false);
  
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    tags: [],
    category: 'Technology',
    status: 'draft',
    reading_time_minutes: 1
  });

  // Check authentication and permissions
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin?callbackUrl=/my-drafts');
      return;
    }

    // Only users with edit permission can edit posts
    if (!hasPermission(session.user.role, PERMISSIONS.EDIT_POSTS)) {
      toast.error('❌ You do not have permission to edit posts!', {
        className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
        progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
      });
      router.push('/posts');
      return;
    }
  }, [session, status, router]);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!postId || !session?.user || hasFetched.current) return;
      
      hasFetched.current = true;

      try {
        setLoading(true);
        const response = await fetch(`/api/posts/manage/${postId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          
          if (response.status === 404) {
            toast.error('❌ Post not found!', {
              className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
              progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
            });
            router.push('/my-drafts');
            return;
          }
          
          if (response.status === 403) {
            // Handle specific authorization errors
            const errorMessage = errorData.error || 'Access denied';
            
            if (errorMessage.includes('own posts')) {
              toast.error('❌ You can only edit your own draft posts!', {
                className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
                progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
              });
            } else if (errorMessage.includes('draft posts')) {
              toast.error('❌ Only draft posts can be edited. Published posts cannot be modified!', {
                className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
                progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
              });
            } else {
              toast.error(`❌ ${errorMessage}`, {
                className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
                progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
              });
            }
            router.push('/my-drafts');
            return;
          }
          
          throw new Error(errorData.error || 'Failed to fetch post');
        }

        const data = await response.json();
        
        if (data.success) {
          const postData = data.post;
          
          // Double-check on frontend: Ensure this is a draft post owned by current user
          if (postData.status !== 'draft') {
            toast.error('❌ Only draft posts can be edited!', {
              className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
              progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
            });
            router.push('/my-drafts');
            return;
          }
          
          if (postData.author_id !== session.user.id) {
            toast.error('❌ You can only edit your own posts!', {
              className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
              progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
            });
            router.push('/my-drafts');
            return;
          }

          setPost(postData);
          setFormData({
            title: postData.title,
            slug: postData.slug,
            content: postData.content,
            excerpt: postData.excerpt,
            tags: postData.tags || [],
            category: postData.category || 'Technology',
            status: postData.status,
            reading_time_minutes: postData.reading_time_minutes || 1
          });
          
          // Post data loaded - form will be populated automatically
          // No need for success toast as user can see the form is filled
        } else {
          toast.error('❌ Failed to load post!', {
            className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
            progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
          });
          router.push('/my-drafts');
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        toast.error('❌ Error loading post!', {
          className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
          progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
        });
        router.push('/my-drafts');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user && !hasFetched.current) {
      fetchPost();
    }
  }, [postId, session, router]);

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

  const handleSave = async (statusToSave: "draft" | "published") => {
    if (!validateForm()) return;

    const isPublishing = statusToSave === "published";
    if (isPublishing) {
      setPublishing(true);
    } else {
      setSaving(true);
    }

    const loadingToast = toast.loading(
      isPublishing ? '🚀 Publishing your post...' : '💾 Saving your draft...',
      {
        position: 'top-center',
        className: '!bg-gradient-to-r !from-blue-50 !to-indigo-50 !text-blue-800 !border-blue-200',
      }
    );

    try {
      const response = await fetch(`/api/posts/manage/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status: statusToSave,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (isPublishing) {
          toast.update(loadingToast, {
            render: '🎉 Post published successfully!',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
            className: '!bg-gradient-to-r !from-green-50 !to-emerald-50 !text-green-800 !border-green-200',
            progressClassName: '!bg-gradient-to-r !from-green-400 !to-emerald-500',
          });
          setTimeout(() => router.push('/posts'), 1500);
        } else {
          toast.update(loadingToast, {
            render: '💾 Draft saved successfully!',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
            className: '!bg-gradient-to-r !from-green-50 !to-emerald-50 !text-green-800 !border-green-200',
            progressClassName: '!bg-gradient-to-r !from-green-400 !to-emerald-500',
          });
          setPost(prev => prev ? { ...prev, status: statusToSave } : null);
          setFormData(prev => ({ ...prev, status: statusToSave }));
        }
      } else {
        // Handle specific error cases
        let errorMessage = data.error || `Failed to ${isPublishing ? 'publish' : 'save'} post`;
        
        if (response.status === 403) {
          if (data.error?.includes('own posts')) {
            errorMessage = 'You can only edit your own draft posts!';
          } else if (data.error?.includes('draft posts')) {
            errorMessage = 'Only draft posts can be edited. Published posts cannot be modified!';
          }
          
          // Redirect to drafts page for authorization errors
          setTimeout(() => router.push('/my-drafts'), 2000);
        } else if (response.status === 409) {
          errorMessage = 'A post with this URL slug already exists. Please choose a different title or modify the slug.';
        }
        
        toast.update(loadingToast, {
          render: `❌ ${errorMessage}`,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
          className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
          progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
        });
      }
    } catch (error) {
      console.error(`Error ${isPublishing ? 'publishing' : 'saving'} post:`, error);
      toast.update(loadingToast, {
        render: `❌ Error ${isPublishing ? 'publishing' : 'saving'} post`,
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        className: '!bg-gradient-to-r !from-red-50 !to-rose-50 !text-red-800 !border-red-200',
        progressClassName: '!bg-gradient-to-r !from-red-400 !to-rose-500',
      });
    } finally {
      setSaving(false);
      setPublishing(false);
    }
  };

  // Handle authentication states
  if (status === "loading" || loading) {
    return <LoadingScreen title="Loading Post" subtitle="Fetching post data..." />;
  }

  if (!session || !hasPermission(session.user.role, PERMISSIONS.EDIT_POSTS)) {
    return null;
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-rose-400/10 to-orange-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/my-drafts">
            <Button
              variant="ghost"
              className="mb-4 hover:bg-white/50 dark:hover:bg-slate-800/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Drafts
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-gradient-to-r from-orange-600 to-pink-600 rounded-lg">
                <FileEdit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                  Edit Draft Post
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Edit your draft content - only draft posts can be modified
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
              >
                📝 Draft Only
              </Badge>
              <Badge 
                variant="outline" 
                className="bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              >
                Your Post
              </Badge>
            </div>
          </div>
          
          {/* Security Notice */}
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Security Notice
                </h3>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  For security reasons, you can only edit your own draft posts. Published posts cannot be modified. 
                  This ensures content integrity and prevents unauthorized changes.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Slug */}
            <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-orange-500" />
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
                    disabled={saving || publishing}
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
                    disabled={saving || publishing}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    URL: {typeof window !== 'undefined' ? window.location.origin : ''}/posts/{formData.slug}
                  </p>
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                    disabled={saving || publishing}
                  >
                    <SelectTrigger className="mt-1 bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          <div className="flex items-center space-x-2">
                            <span>{getCategoryInfo(category).emoji}</span>
                            <span>{category}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose the most relevant category for your post.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card className="shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0">
              <CardHeader>
                <CardTitle>Content <span className="text-red-500">*</span></CardTitle>
                <CardDescription>
                  Edit your post content with our rich text editor. Supports formatting, links, and more.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => handleInputChange('content', content)}
                  placeholder="Continue writing your amazing content here..."
                  disabled={saving || publishing}
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
                  disabled={saving || publishing}
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
                <CardTitle className="text-lg">Update Draft</CardTitle>
                <CardDescription>
                  Save your changes or publish your draft
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4" />
                  <span>Author: {session.user.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                  <FileEdit className="w-4 h-4" />
                  <span>Status: Draft</span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button
                    onClick={() => handleSave("draft")}
                    disabled={saving || publishing}
                    variant="outline"
                    className="w-full"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Draft
                  </Button>
                  
                  <Button
                    onClick={() => handleSave("published")}
                    disabled={saving || publishing}
                    className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700"
                  >
                    {publishing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Publish Draft
                  </Button>
                </div>
                
                <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t">
                  💡 Once published, posts cannot be edited for security reasons
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
                    disabled={saving || publishing}
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    size="sm"
                    variant="outline"
                    disabled={saving || publishing}
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
                        className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
                          disabled={saving || publishing}
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
            <Card className="shadow-lg bg-gradient-to-r from-orange-50 to-pink-50 dark:from-slate-800 dark:to-slate-700 border-0">
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
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Last Updated:</span>
                  <span className="font-medium text-xs">
                    {post.updated_at ? new Date(post.updated_at).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {(saving || publishing) && (
        <LoadingScreen 
          title={publishing ? "Publishing Post" : "Saving Draft"} 
          subtitle={publishing ? "Making your content live..." : "Saving your changes..."} 
        />
      )}
    </div>
  );
};

export default EditPostPage;