/**
 * Individual Post Page - Dynamic Route [post_id]
 * Stunning magazine-style layout for displaying blog posts
 */

"use client"

import { useState, useEffect, use } from "react"
import { useSession } from "next-auth/react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Calendar, 
  Clock, 
  Eye, 
  MessageSquare, 
  Heart, 
  Bookmark,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  ArrowLeft,
  ChevronUp,
  Send,
  TrendingUp,
  BookOpen,
  Flag,
  MoreHorizontal,
  Trash2,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from 'react-toastify'
// Removed markdown imports since we're using HTML content from TipTap

interface Post {
  id: string
  title: string
  content: string
  excerpt: string
  status: "draft" | "published"
  created_at: string
  updated_at: string
  author_id: string
  author_name: string
  author_bio?: string
  author_avatar?: string
  author_twitter?: string
  views_count: number
  comments_count: number
  likes_count: number
  reading_time: number
  tags: string[]
  featured_image?: string
  category: string
}

interface Comment {
  id: string
  content: string
  author_name?: string
  author_avatar?: string
  created_at: string
  likes: number
  report_count?: number
  is_reported?: boolean
  is_hidden?: boolean
}

interface Props {
  params: Promise<{
    post_slug: string
  }>
}

export default function PostPage({ params }: Props) {
  const resolvedParams = use(params)
  const { data: session } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [readingProgress, setReadingProgress] = useState(0)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  useEffect(() => {
    fetchPostAndComments()
    
    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrolled / maxHeight) * 100
      setReadingProgress(Math.min(progress, 100))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [resolvedParams.post_slug])

  const fetchPostAndComments = async () => {
    try {
      const response = await fetch(`/api/posts/${resolvedParams.post_slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          notFound();
        }
        throw new Error('Failed to fetch post');
      }

      const data = await response.json();
      
      if (data.success) {
        setPost(data.post);
        if (data.comments) {
          setComments(data.comments);
        }
      } else {
        console.error('API returned error:', data.error);
        notFound();
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const handleShare = (platform: string) => {
    const url = window.location.href
    const title = post?.title || ""
    
    switch (platform) {
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?text=${title}&url=${url}`)
        break
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`)
        break
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`)
        break
      case "copy":
        navigator.clipboard.writeText(url)
        toast.success("📋 Link copied to clipboard!")
        break
    }
    setShowShareMenu(false)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !post) return

    setIsSubmittingComment(true)
    
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          post_id: parseInt(post.id)
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Add the new comment to the list
        setComments([data.comment, ...comments])
        setNewComment("")
      } else {
        console.error('Failed to post comment:', data.error)
        toast.error(`❌ Failed to post comment: ${data.error || "Please try again."}`)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      toast.error("❌ Error posting comment. Something went wrong. Please try again.")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleReportComment = (commentId: string) => {
    setReportingCommentId(commentId)
    setShowReportDialog(true)
  }

  const handleSubmitReport = async () => {
    if (!reportingCommentId || !reportReason) return

    try {
      const response = await fetch(`/api/comments/${reportingCommentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'report',
          reason: reportReason,
          description: reportDescription
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success("✅ Comment reported. Thank you for helping keep our community safe.")
        setShowReportDialog(false)
        setReportingCommentId(null)
        setReportReason("")
        setReportDescription("")
      } else {
        toast.error(`❌ Failed to report comment: ${data.error || "Please try again."}`)
      }
    } catch (error) {
      console.error('Error reporting comment:', error)
      toast.error("❌ Error reporting comment. Something went wrong. Please try again.")
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Remove the comment from the list
        setComments(comments.filter(c => c.id !== commentId))
        toast.success("🗑️ Comment deleted permanently.")
      } else {
        toast.error(`❌ Failed to delete comment: ${data.error || "Please try again."}`)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error("❌ Error deleting comment. Something went wrong. Please try again.")
    }
  }

  const handleHideComment = async (commentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'hide',
          reason: reason
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Update the comment in the list
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, is_hidden: true }
            : c
        ))
        toast.success("👁️ Comment hidden from public view.")
      } else {
        toast.error(`❌ Failed to hide comment: ${data.error || "Please try again."}`)
      }
    } catch (error) {
      console.error('Error hiding comment:', error)
      toast.error("❌ Error hiding comment. Something went wrong. Please try again.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Back Button */}
      <div className="fixed top-4 left-4 z-40">
        <Link href="/posts">
          <Button variant="outline" size="sm" className="bg-white/80 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Posts
          </Button>
        </Link>
      </div>

      {/* Floating Actions */}
      <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2">
        <Button
          variant={isLiked ? "default" : "outline"}
          size="sm"
          onClick={handleLike}
          className="bg-white/80 backdrop-blur-sm"
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </Button>
        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="sm"
          onClick={handleBookmark}
          className="bg-white/80 backdrop-blur-sm"
        >
          <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
        </Button>
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="bg-white/80 backdrop-blur-sm"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          {showShareMenu && (
            <div className="absolute left-12 top-0 bg-white rounded-lg shadow-lg border p-2 space-y-1">
              <Button variant="ghost" size="sm" onClick={() => handleShare("twitter")}>
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleShare("facebook")}>
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleShare("linkedin")}>
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleShare("copy")}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        {post.featured_image && (
          <div className="absolute inset-0 opacity-20">
            <img src={post.featured_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {post.category}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              {post.title}
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-center space-x-6 text-gray-300">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{post.reading_time} min read</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>{post.views_count.toLocaleString()} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Article Content */}
          <div className="lg:col-span-3">
            {/* Author Info */}
            <Card className="mb-8 bg-white/60 backdrop-blur-sm border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={post.author_avatar} />
                    <AvatarFallback>{post.author_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{post.author_name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{post.author_bio}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {post.author_twitter && (
                        <Link href={`https://twitter.com/${post.author_twitter.replace('@', '')}`} className="hover:text-blue-600">
                          <Twitter className="h-4 w-4 inline mr-1" />
                          {post.author_twitter}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Article Body */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg p-8 border border-gray-200">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:italic prose-img:rounded-lg prose-img:shadow-md"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-8">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-white/60 backdrop-blur-sm">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Engagement Stats */}
            <div className="flex items-center justify-between mt-8 p-6 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Heart className={cn("h-5 w-5", isLiked && "fill-red-500 text-red-500")} />
                  <span className="font-medium">{post.likes_count + (isLiked ? 1 : 0)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">{comments.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">{post.views_count.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleLike}>
                  <Heart className={cn("h-4 w-4 mr-2", isLiked && "fill-current text-red-500")} />
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowShareMenu(!showShareMenu)}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <MessageSquare className="h-6 w-6 mr-2" />
                Comments ({comments.length})
              </h2>

              {/* Comment Form */}
              {session && (
                <Card className="mb-8 bg-white/60 backdrop-blur-sm border-gray-200">
                  <CardContent className="p-6">
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={session.user?.image || undefined} />
                          <AvatarFallback>{session.user?.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end mt-3">
                            <Button type="submit" disabled={!newComment.trim() || isSubmittingComment}>
                              <Send className="h-4 w-4 mr-2" />
                              {isSubmittingComment ? "Posting..." : "Post Comment"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.filter(comment => !comment.is_hidden).map((comment) => (
                  <Card key={comment.id} className="bg-white/60 backdrop-blur-sm border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.author_avatar} />
                          <AvatarFallback>{comment.author_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{comment.author_name || 'Anonymous'}</h4>
                              <span className="text-sm text-gray-500">
                                {formatDate(comment.created_at)}
                              </span>
                              {comment.is_reported && (
                                <Badge variant="destructive" className="text-xs">
                                  Reported ({comment.report_count})
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              {session && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleReportComment(comment.id)}>
                                      <Flag className="h-4 w-4 mr-2" />
                                      Report
                                    </DropdownMenuItem>
                                    {(session.user.role === 'editor' || session.user.role === 'admin') && (
                                      <>
                                        <DropdownMenuItem 
                                          onClick={() => handleHideComment(comment.id, 'Hidden by moderator')}
                                        >
                                          <EyeOff className="h-4 w-4 mr-2" />
                                          Hide Comment
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleDeleteComment(comment.id)}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3">{comment.content}</p>
                          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500">
                            <Heart className="h-4 w-4 mr-1" />
                            {comment.likes}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Stats */}
              <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Article Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Views</span>
                    <span className="font-medium">{post.views_count.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Likes</span>
                    <span className="font-medium">{post.likes_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Comments</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Reading Time</span>
                    <span className="font-medium">{post.reading_time} min</span>
                  </div>
                </CardContent>
              </Card>

              {/* Related Posts */}
              <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Related Articles
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-b border-gray-200 last:border-0 pb-3 last:pb-0">
                      <h4 className="font-medium text-sm mb-1 hover:text-blue-600 cursor-pointer">
                        Building Scalable React Applications
                      </h4>
                      <p className="text-xs text-gray-500">12 min read • 856 views</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Scroll to Top */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-full bg-white/60 backdrop-blur-sm"
              >
                <ChevronUp className="h-4 w-4 mr-2" />
                Back to Top
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Help us keep our community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for reporting</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate content</SelectItem>
                  <SelectItem value="offensive">Offensive language</SelectItem>
                  <SelectItem value="misinformation">Misinformation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide more context about why you're reporting this comment..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReport} disabled={!reportReason}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 