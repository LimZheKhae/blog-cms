import { getServerSession } from "next-auth"
import authOptions from "@/lib/auth"
import type { Session } from "next-auth"
import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, MessageSquare, Users, Eye } from "lucide-react"
import { redirect } from "next/navigation"

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

  // Get dashboard stats
  const [postsCount, commentsCount, usersCount] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM posts`,
    sql`SELECT COUNT(*) as count FROM comments`,
    sql`SELECT COUNT(*) as count FROM users`,
  ])

  // Get recent posts
  const recentPosts = await sql`
    SELECT p.*, u.name as author_name 
    FROM posts p 
    JOIN users u ON p.author_id = u.id 
    ORDER BY p.created_at DESC 
    LIMIT 5
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}! Here's what's happening.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postsCount[0].count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commentsCount[0].count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usersCount[0].count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-sm">
              {session.user.role}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Latest blog posts from your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={post.status === "published" ? "default" : "secondary"}>{post.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Comments (for moderators) */}
        {pendingComments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Comments</CardTitle>
              <CardDescription>Comments awaiting moderation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingComments.map((comment: any) => (
                  <div key={comment.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {comment.author_name} on "{comment.post_title}"
                      </p>
                      <Badge variant="outline">pending</Badge>
                    </div>
                    <p className="text-sm">{comment.content.substring(0, 100)}...</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
