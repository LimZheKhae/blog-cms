/**
 * Individual Post Page - Dynamic Route [post_id]
 * Stunning magazine-style layout for displaying blog posts
 */

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

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
  author_name: string
  author_avatar?: string
  created_at: string
  likes: number
}

interface Props {
  params: {
    post_id: string
  }
}

export default function PostPage({ params }: Props) {
  const { data: session } = useSession()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [readingProgress, setReadingProgress] = useState(0)

  useEffect(() => {
    fetchPost()
    fetchComments()
    
    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrolled / maxHeight) * 100
      setReadingProgress(Math.min(progress, 100))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [params.post_id])

  const fetchPost = async () => {
    try {
      const mockPost: Post = {
        id: params.post_id,
        title: "The Future of Web Development: Trends to Watch in 2024",
        content: `# Introduction

The web development landscape is constantly evolving, and 2024 promises to be a year of significant transformation. From artificial intelligence integration to new architectural patterns, developers are witnessing unprecedented changes that will shape how we build and interact with web applications.

## The Rise of AI-Powered Development

Artificial Intelligence is no longer just a buzzword—it's becoming an integral part of the development workflow. **GitHub Copilot**, **ChatGPT**, and other AI tools are revolutionizing how developers write code, debug issues, and even architect solutions.

### Key AI Integration Points:

- **Code Generation**: AI can generate boilerplate code, saving hours of development time
- **Bug Detection**: Advanced static analysis powered by machine learning  
- **Performance Optimization**: AI-driven suggestions for code improvements
- **Documentation**: Automated generation of comprehensive documentation

## Modern JavaScript Frameworks

The JavaScript ecosystem continues to mature with frameworks focusing on performance and developer experience.

### Next.js 14 and the App Router

The new App Router in Next.js represents a paradigm shift toward server components and streaming, offering:

\`\`\`javascript
// Server Component Example
async function ProductList() {
  const products = await fetch('/api/products')
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  )
}
\`\`\`

### TypeScript Dominance

TypeScript adoption has reached new heights, with major frameworks and libraries providing first-class TypeScript support. The benefits are clear:

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Enhanced autocomplete and refactoring
- **Improved Code Quality**: Self-documenting code through types

## The Component-First Web

Web Components and modern component libraries are changing how we think about reusable UI:

### Design Systems at Scale

Companies are investing heavily in design systems that provide:

1. **Consistent UI/UX** across products
2. **Faster Development** cycles  
3. **Better Accessibility** by default
4. **Brand Coherence** across teams

## WebAssembly (WASM) Revolution

WebAssembly is opening new possibilities for web applications:

- **Performance**: Near-native speed for compute-intensive tasks
- **Language Diversity**: Run code written in Rust, Go, C++ in the browser
- **New Use Cases**: CAD tools, image/video processing, gaming

### WASM Example

\`\`\`rust
#[wasm_bindgen]
pub fn fibonacci(n: i32) -> i32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}
\`\`\`

## Conclusion

The future of web development is bright, with AI augmentation, improved frameworks, and new technologies like **WebAssembly** paving the way for more powerful and efficient web applications. 

> Developers who embrace these trends will be well-positioned to build the next generation of web experiences.

As we move forward, the key is to balance innovation with proven practices, ensuring that we're not just chasing the latest trends but building sustainable, maintainable, and performant applications.`,
        excerpt: "Explore the cutting-edge trends that will shape web development in 2024, from AI integration to new frameworks.",
        status: "published",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
        author_id: "1",
        author_name: "John Smith",
        author_bio: "Senior Full-Stack Developer with 8+ years of experience building scalable web applications.",
        author_avatar: "/placeholder-user.jpg",
        author_twitter: "@johnsmith_dev",
        views_count: 1234,
        comments_count: 23,
        likes_count: 89,
        reading_time: 8,
        tags: ["JavaScript", "React", "AI", "WebDev", "2024"],
        featured_image: "/placeholder.jpg",
        category: "Technology"
      }

      if (mockPost.id !== params.post_id) {
        notFound()
      }

      setPost(mockPost)
    } catch (error) {
      console.error("Error fetching post:", error)
      notFound()
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const mockComments: Comment[] = [
        {
          id: "1",
          content: "Great article! The section on AI-powered development really resonates with my recent experience.",
          author_name: "Sarah Johnson",
          author_avatar: "/placeholder-user.jpg",
          created_at: "2024-01-16T09:15:00Z",
          likes: 12
        },
        {
          id: "2",
          content: "The WebAssembly section was particularly interesting. Performance gains are incredible.",
          author_name: "Mike Chen",
          author_avatar: "/placeholder-user.jpg",
          created_at: "2024-01-16T14:22:00Z",
          likes: 8
        }
      ]
      setComments(mockComments)
    } catch (error) {
      console.error("Error fetching comments:", error)
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
        alert("Link copied to clipboard!")
        break
    }
    setShowShareMenu(false)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      content: newComment,
      author_name: session?.user?.name || "Anonymous",
      author_avatar: session?.user?.image || undefined,
      created_at: new Date().toISOString(),
      likes: 0
    }

    setComments([newCommentObj, ...comments])
    setNewComment("")
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
                    <AvatarFallback>{post.author_name.charAt(0)}</AvatarFallback>
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
              <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:italic">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code: ({ children, className, ...props }: any) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !match
                      
                      if (isInline) {
                        return (
                          <code className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-sm" {...props}>
                            {children}
                          </code>
                        )
                      }
                      
                      return (
                        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      )
                    },
                    blockquote: ({ children, ...props }: any) => (
                      <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 italic text-blue-800 my-4" {...props}>
                        {children}
                      </blockquote>
                    ),
                    h1: ({ children, ...props }: any) => (
                      <h1 className="text-4xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200" {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }: any) => (
                      <h2 className="text-3xl font-semibold text-gray-900 mb-5 mt-8" {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }: any) => (
                      <h3 className="text-2xl font-semibold text-gray-900 mb-4 mt-6" {...props}>
                        {children}
                      </h3>
                    ),
                    ul: ({ children, ...props }: any) => (
                      <ul className="list-disc list-inside space-y-2 mb-4 ml-4" {...props}>
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }: any) => (
                      <ol className="list-decimal list-inside space-y-2 mb-4 ml-4" {...props}>
                        {children}
                      </ol>
                    ),
                    p: ({ children, ...props }: any) => (
                      <p className="text-gray-700 leading-relaxed mb-4" {...props}>
                        {children}
                      </p>
                    ),
                    strong: ({ children, ...props }: any) => (
                      <strong className="font-semibold text-gray-900" {...props}>
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
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
                          <AvatarFallback>{session.user?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            placeholder="Share your thoughts..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end mt-3">
                            <Button type="submit" disabled={!newComment.trim()}>
                              <Send className="h-4 w-4 mr-2" />
                              Post Comment
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
                {comments.map((comment) => (
                  <Card key={comment.id} className="bg-white/60 backdrop-blur-sm border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={comment.author_avatar} />
                          <AvatarFallback>{comment.author_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">{comment.author_name}</h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
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
    </div>
  )
} 