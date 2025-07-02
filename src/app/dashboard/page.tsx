import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { Session } from "next-auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  MessageSquare, 
  Users, 
  Eye, 
  TrendingUp, 
  Calendar,
  Clock,
  Heart,
  Star,
  BarChart3,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  Target,
  Zap,
  Activity
} from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Dashboard() {
  const session = await getServerSession(authOptions) as Session & {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  } | null

  if (!session?.user) {
    redirect("/auth/signin")
  }

  // Redirect viewers to posts page - they don't have dashboard access
  if (session.user.role === "viewer") {
    redirect("/posts")
  }

  // Get comprehensive dashboard stats
  const [
    postsStats,
    commentsStats,
    usersStats,
    engagementStats,
    userSpecificStats
  ] = await Promise.all([
    // Posts statistics
    sql`
      SELECT 
        COUNT(*) as total_posts,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_posts,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_posts,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as posts_this_month
      FROM posts
    `,
    // Comments statistics
    sql`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_comments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_comments,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as comments_this_week
      FROM comments
    `,
    // Users statistics
    sql`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'viewer' THEN 1 END) as viewers,
        COUNT(CASE WHEN role = 'author' THEN 1 END) as authors,
        COUNT(CASE WHEN role = 'editor' THEN 1 END) as editors,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_this_month
      FROM users
    `,
    // Engagement statistics
    sql`
      SELECT 
        COALESCE(SUM(views_count), 0) as total_views,
        COALESCE(SUM(likes_count), 0) as total_likes,
        COALESCE(AVG(views_count), 0) as avg_views_per_post,
        COALESCE(AVG(likes_count), 0) as avg_likes_per_post
      FROM posts 
      WHERE status = 'published'
    `,
    // User-specific statistics
    sql`
      SELECT 
        COUNT(*) as user_posts,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as user_published,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as user_drafts,
        COALESCE(SUM(views_count), 0) as user_total_views,
        COALESCE(SUM(likes_count), 0) as user_total_likes
      FROM posts 
      WHERE author_id = ${session.user.id}
    `
  ])

  // Get top performing posts with engagement metrics
  const topPosts = await sql`
    SELECT 
      p.id,
      p.title,
      p.slug,
      p.views_count,
      p.likes_count,
      p.created_at,
      u.name as author_name,
      (
        SELECT COUNT(*) 
        FROM comments c 
        WHERE c.post_id = p.id AND c.status = 'approved'
      ) as comments_count,
      -- Calculate engagement score (views + likes*2 + comments*3)
      (COALESCE(p.views_count, 0) + COALESCE(p.likes_count, 0) * 2 + 
       (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') * 3
      ) as engagement_score
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    WHERE p.status = 'published'
    ORDER BY engagement_score DESC 
    LIMIT 5
  `

  // Get recent activity
  const recentActivity = await sql`
    SELECT 
      'post' as type,
      p.title as title,
      p.created_at as timestamp,
      u.name as author_name,
      p.status
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.created_at >= NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    SELECT 
      'comment' as type,
      CONCAT('Comment on "', p.title, '"') as title,
      c.created_at as timestamp,
      u.name as author_name,
      c.status
    FROM comments c
    JOIN posts p ON c.post_id = p.id
    JOIN users u ON c.author_id = u.id
    WHERE c.created_at >= NOW() - INTERVAL '7 days'
    
    ORDER BY timestamp DESC
    LIMIT 8
  `

  // Get pending comments (if user can moderate)
  const pendingComments =
    session.user.role === "admin" || session.user.role === "editor"
      ? await sql`
        SELECT c.*, p.title as post_title, u.name as author_name
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        JOIN users u ON c.author_id = u.id
        WHERE c.status = 'pending'
        ORDER BY c.created_at DESC
        LIMIT 5
      `
      : []

  const stats = {
    posts: postsStats[0],
    comments: commentsStats[0],
    users: usersStats[0],
    engagement: engagementStats[0],
    userStats: userSpecificStats[0]
  }

  // Calculate some percentages
  const publishedPercentage = stats.posts.total_posts > 0 
    ? Math.round((stats.posts.published_posts / stats.posts.total_posts) * 100) 
    : 0
  
  const approvedCommentsPercentage = stats.comments.total_comments > 0
    ? Math.round((stats.comments.approved_comments / stats.comments.total_comments) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {session.user.name}! Here's your content performance overview.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/posts/create">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </Link>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.posts.total_posts}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.posts.posts_this_month} this month
            </div>
            <Progress value={publishedPercentage} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {publishedPercentage}% published
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(stats.engagement.total_views).toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Eye className="h-3 w-3 mr-1" />
              {Math.round(Number(stats.engagement.avg_views_per_post))} avg per post
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center text-xs">
                <Heart className="h-3 w-3 mr-1 text-red-500" />
                {Number(stats.engagement.total_likes).toLocaleString()} likes
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.comments.total_comments}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3 mr-1" />
              {stats.comments.comments_this_week} this week
            </div>
            <Progress value={approvedCommentsPercentage} className="mt-3 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {approvedCommentsPercentage}% approved
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.users.total_users}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <Target className="h-3 w-3 mr-1" />
              {stats.users.new_users_this_month} new this month
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="text-center p-1 bg-gray-50 rounded">
                <div className="font-semibold">{stats.users.authors}</div>
                <div className="text-muted-foreground">Authors</div>
              </div>
              <div className="text-center p-1 bg-gray-50 rounded">
                <div className="font-semibold">{stats.users.viewers}</div>
                <div className="text-muted-foreground">Readers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Your Performance (Personal Stats) */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Your Performance
          </CardTitle>
          <CardDescription>Your content creation and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.userStats.user_posts}</div>
              <p className="text-sm text-muted-foreground">Total Posts</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.userStats.user_published}</div>
              <p className="text-sm text-muted-foreground">Published</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Number(stats.userStats.user_total_views).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Number(stats.userStats.user_total_likes).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Performing Posts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Top Performing Posts
            </CardTitle>
            <CardDescription>Posts ranked by engagement (views + likes + comments)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts.map((post: any, index: number) => (
                <div key={post.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="space-y-1">
                      <Link href={`/posts/${post.slug}`} className="font-medium hover:text-blue-600 transition-colors">
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        by {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-blue-600">
                      <Eye className="h-4 w-4" />
                      {(post.views_count || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-red-600">
                      <Heart className="h-4 w-4" />
                      {(post.likes_count || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <MessageSquare className="h-4 w-4" />
                      {post.comments_count}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest posts and comments this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                    activity.type === 'post' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {activity.type === 'post' ? <FileText className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium line-clamp-2">{activity.title}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        by {activity.author_name}
                      </p>
                      <Badge 
                        variant={
                          activity.status === 'published' ? 'default' :
                          activity.status === 'approved' ? 'default' :
                          activity.status === 'pending' ? 'secondary' : 'outline'
                        }
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Comments (for moderators) */}
      {pendingComments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Pending Comments
              <Badge variant="secondary">{pendingComments.length}</Badge>
            </CardTitle>
            <CardDescription>Comments awaiting your moderation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingComments.map((comment: any) => (
                <div key={comment.id} className="p-4 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {comment.author_name} commented on "{comment.post_title}"
                    </p>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      pending
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {comment.content.substring(0, 150)}
                    {comment.content.length > 150 && "..."}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link href="/comment-moderation">
                      <Button size="sm" variant="outline">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
