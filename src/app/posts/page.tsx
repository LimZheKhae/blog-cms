/**
 * Posts Listing Page
 * Beautiful grid layout showcasing all blog posts with search and filtering
 */

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Calendar, 
  User, 
  Eye, 
  MessageSquare, 
  Clock,
  Filter,
  Grid3X3,
  List,
  ArrowRight,
  Sparkles,
  Heart,
  Bookmark
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  status: "draft" | "published"
  created_at: string
  updated_at: string
  author_id: string
  author_name: string
  author_avatar?: string
  views_count?: number
  comments_count?: number
  likes_count?: number
  reading_time?: number
}

export default function PostsPage() {
  const { data: session, status } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [bookmarksLoading, setBookmarksLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("published")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [activeTab, setActiveTab] = useState<string>("all")

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        status: statusFilter,
        search: searchTerm,
        sortBy: sortBy
      });

      // Remove empty parameters
      Object.keys(Object.fromEntries(params)).forEach(key => {
        if (!params.get(key)) {
          params.delete(key);
        }
      });

      const response = await fetch(`/api/posts?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      
      if (data.success) {
        setPosts(data.posts);
      } else {
        console.error('API returned error:', data.error);
        // Fallback to empty array
        setPosts([]);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      // Fallback to empty array on error
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchBookmarkedPosts = async () => {
    if (!session) return;
    
    setBookmarksLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        search: searchTerm,
        sortBy: sortBy
      });

      // Remove empty parameters
      Object.keys(Object.fromEntries(params)).forEach(key => {
        if (!params.get(key)) {
          params.delete(key);
        }
      });

      const response = await fetch(`/api/posts/bookmarks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookmarked posts');
      }

      const data = await response.json();
      
      if (data.success) {
        setBookmarkedPosts(data.posts);
      } else {
        console.error('API returned error:', data.error);
        setBookmarkedPosts([]);
      }
    } catch (error) {
      console.error("Error fetching bookmarked posts:", error);
      setBookmarkedPosts([]);
    } finally {
      setBookmarksLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [searchTerm, statusFilter, sortBy])

  useEffect(() => {
    if (activeTab === "saved") {
      fetchBookmarkedPosts()
    }
  }, [activeTab, searchTerm, sortBy, session])

  // Handle authentication states
  if (status === "loading") {
    return <LoadingScreen />
  }

  if (!session) {
    redirect("/auth/signin")
    return null
  }

  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = post.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "popular":
          return (b.views_count || 0) - (a.views_count || 0)
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  // Filter bookmarked posts (they come pre-sorted from API)
  const filteredBookmarkedPosts = bookmarkedPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default"
      case "draft":
        return "secondary"
      default:
        return "outline"
    }
  }

  const renderPostsList = (postsToRender: Post[], isLoading: boolean = false) => {
    if (isLoading) {
      return (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h3>
          <p className="text-gray-500">Fetching posts...</p>
        </div>
      )
    }

    if (postsToRender.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-500">
            {activeTab === "saved" 
              ? "You haven't bookmarked any posts yet." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
        </div>
      )
    }

    return (
      <div className={cn(
        "gap-6",
        viewMode === "grid" 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
          : "space-y-4"
      )}>
        {postsToRender.map((post) => (
          <Card 
            key={post.id} 
            className={cn(
              "group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-gray-300",
              viewMode === "list" ? "flex flex-row overflow-hidden" : "overflow-hidden"
            )}
          >
            {viewMode === "grid" ? (
              <>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-sm line-clamp-2">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author_avatar} />
                        <AvatarFallback>{post.author_name?.charAt(0) || 'Anonymous'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{post.author_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(post.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {post.views_count}
                      </div>
                      <div className="flex items-center">
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {post.comments_count}
                      </div>
                      <div className="flex items-center">
                        <Heart className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
                        {post.likes_count || 0}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.reading_time} min read
                    </div>
                  </div>

                  <Link href={`/posts/${post.slug}`}>
                    <Button className="w-full group/btn">
                      Read Article
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </>
            ) : (
              <>
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getStatusBadgeVariant(post.status)}>
                      {post.status === 'draft' ? '📝 Draft' : '✅ Published'}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={post.author_avatar} />
                        <AvatarFallback>{post.author_name?.charAt(0) || 'Anonymous'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">{post.author_name}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{formatDate(post.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {post.views_count}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {post.comments_count}
                        </div>
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 mr-1 text-red-500 fill-red-500" />
                          {post.likes_count || 0}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.reading_time} min read
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-48 p-6 flex items-center">
                  <Link href={`/posts/${post.slug}`} className="w-full">
                    <Button className="w-full group/btn">
                      Read
                      <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    )
  }

  if (loading) {
    return <LoadingScreen title="Loading Posts" subtitle="Fetching latest articles..." />
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-yellow-300 mr-2" />
              <h1 className="text-4xl md:text-6xl font-bold text-white">
                Discover Stories
              </h1>
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Explore our collection of insightful articles, tutorials, and stories 
              crafted by our community of writers and experts.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Controls Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 backdrop-blur-sm border-gray-200"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* Create New Post Button */}
              {session?.user?.role && hasPermission(session.user.role, PERMISSIONS.CREATE_POST) && (
                <Link href="/posts/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Post
                  </Button>
                </Link>
              )}
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-36 bg-white/70 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="popular">Popular</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Separator orientation="vertical" className="h-6" />

              {/* View Mode Toggle */}
              <div className="flex border rounded-lg bg-white/70 backdrop-blur-sm">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              All Posts
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {renderPostsList(filteredPosts)}
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            {renderPostsList(filteredBookmarkedPosts, bookmarksLoading)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 