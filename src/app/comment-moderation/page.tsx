"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { toast } from 'react-toastify'
import { hasPermission, PERMISSIONS } from "@/lib/permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Trash2, 
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
  Flag,
  ExternalLink,
  RefreshCw,
  Calendar
} from "lucide-react"
import { LoadingScreen } from '@/components/ui/loading-screen'

interface ModerationComment {
  id: string
  content: string
  created_at: string
  report_count: number
  is_reported: boolean
  is_hidden: boolean
  hidden_by?: string
  hidden_at?: string
  hidden_reason?: string
  hidden_by_name?: string
  author: {
    name: string
    avatar?: string
  }
  post: {
    id: string
    title: string
    slug: string
  }
  reports: Array<{
    reason: string
    description?: string
    created_at: string
    reporter_name?: string
  }>
}

interface ModerationStats {
  totalComments: number
  pendingReports: number
  hiddenComments: number
  reportedComments: number
}

interface ModerationData {
  comments: ModerationComment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: ModerationStats
}

export default function CommentModerationPage() {
  const { data: session, status } = useSession()
  const [data, setData] = useState<ModerationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('pending')
  const [selectedComment, setSelectedComment] = useState<ModerationComment | null>(null)
  const [showReportsDialog, setShowReportsDialog] = useState(false)
  const [showHideDialog, setShowHideDialog] = useState(false)
  const [hideReason, setHideReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Redirect if not authenticated or insufficient permissions
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      redirect('/auth/signin?callbackUrl=/comment-moderation')
      return
    }

    // Check if user has moderation permissions
    if (!hasPermission(session.user.role, PERMISSIONS.MODERATE_COMMENTS)) {
      redirect('/posts')
      return
    }
  }, [session, status])

  const fetchModerationData = async (filter = activeFilter) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/moderation?filter=${filter}&limit=20`)
      const result = await response.json()

      if (response.ok && result.success) {
        setData(result.data)
      } else {
        toast.error('Failed to fetch moderation data')
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error)
      toast.error('Error loading moderation data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user && hasPermission(session.user.role, PERMISSIONS.MODERATE_COMMENTS)) {
      fetchModerationData()
    }
  }, [session, activeFilter])

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    fetchModerationData(filter)
  }

  const handleViewReports = (comment: ModerationComment) => {
    setSelectedComment(comment)
    setShowReportsDialog(true)
  }

  const handleHideComment = (comment: ModerationComment) => {
    setSelectedComment(comment)
    setShowHideDialog(true)
  }

  const confirmHideComment = async () => {
    if (!selectedComment || !hideReason.trim()) return

    setActionLoading(true)
    try {
      const response = await fetch(`/api/comments/${selectedComment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'hide',
          reason: hideReason
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Comment hidden successfully')
        setShowHideDialog(false)
        setHideReason('')
        setSelectedComment(null)
        fetchModerationData()
      } else {
        toast.error(result.error || 'Failed to hide comment')
      }
    } catch (error) {
      console.error('Error hiding comment:', error)
      toast.error('Error hiding comment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnhideComment = async (commentId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unhide'
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Comment unhidden successfully')
        fetchModerationData()
      } else {
        toast.error(result.error || 'Failed to unhide comment')
      }
    } catch (error) {
      console.error('Error unhiding comment:', error)
      toast.error('Error unhiding comment')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to permanently delete this comment? This action cannot be undone.')) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success('Comment deleted successfully')
        fetchModerationData()
      } else {
        toast.error(result.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Error deleting comment')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getReasonBadgeColor = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'spam': return 'bg-orange-100 text-orange-800'
      case 'harassment': return 'bg-red-100 text-red-800'
      case 'inappropriate': return 'bg-purple-100 text-purple-800'
      case 'offensive': return 'bg-red-100 text-red-800'
      case 'misinformation': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return <LoadingScreen title="Loading Moderation" subtitle="Preparing moderation dashboard..." />
  }

  if (!session || !hasPermission(session.user.role, PERMISSIONS.MODERATE_COMMENTS)) {
    toast.error('You are not authorized to access this page')
    redirect('/posts')
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
        <h1 className="text-3xl font-bold flex items-center mb-2">
              <Shield className="h-8 w-8 mr-3 text-blue-600" />
          Comment Moderation
        </h1>
        <p className="text-gray-600">
          Manage reported comments and maintain community standards
        </p>
      </div>
          <Button
            onClick={() => fetchModerationData()}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-2xl font-bold">{data.stats.totalComments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Reports</p>
                  <p className="text-2xl font-bold text-orange-600">{data.stats.pendingReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Reported Comments</p>
                  <p className="text-2xl font-bold text-red-600">{data.stats.reportedComments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <EyeOff className="h-8 w-8 text-gray-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hidden Comments</p>
                  <p className="text-2xl font-bold text-gray-600">{data.stats.hiddenComments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Comments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Comments</CardTitle>
            <Tabs value={activeFilter} onValueChange={handleFilterChange}>
              <TabsList>
                <TabsTrigger value="pending">Pending ({data?.stats.pendingReports || 0})</TabsTrigger>
                <TabsTrigger value="reported">All Reported</TabsTrigger>
                <TabsTrigger value="hidden">Hidden</TabsTrigger>
                <TabsTrigger value="all">All Comments</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {data?.comments.length === 0 ? (
            <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comments to moderate</h3>
              <p className="text-gray-600">
                {activeFilter === 'pending' ? 'No pending reports at this time.' : 'No comments match the current filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {data?.comments.map((comment) => (
                <Card key={comment.id} className={`${comment.is_reported ? 'border-orange-200 bg-orange-50/30' : ''} ${comment.is_hidden ? 'border-gray-200 bg-gray-50/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.author.avatar} />
                        <AvatarFallback>{comment.author.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{comment.author.name || 'Anonymous'}</h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.created_at)}
                            </span>
                            {comment.is_reported && (
                              <Badge variant="destructive" className="text-xs">
                                {comment.report_count} Report{comment.report_count !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {comment.is_hidden && (
                              <Badge variant="secondary" className="text-xs">
                                Hidden
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-gray-700 mb-3 ${comment.is_hidden ? 'line-through opacity-60' : ''}`}>
                          {comment.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>Post:</span>
                            <Link 
                              href={`/posts/${comment.post.slug}`}
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              {comment.post.title}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {comment.reports.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewReports(comment)}
                              >
                                <Flag className="h-4 w-4 mr-1" />
                                View Reports ({comment.reports.length})
                              </Button>
                            )}
                            
                            {!comment.is_hidden ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleHideComment(comment)}
                                disabled={actionLoading}
                              >
                                <EyeOff className="h-4 w-4 mr-1" />
                                Hide
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnhideComment(comment.id)}
                                disabled={actionLoading}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Unhide
                              </Button>
                            )}
                            
                            {session.user.role === 'admin' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={actionLoading}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {comment.is_hidden && comment.hidden_by_name && (
                          <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                            <p className="text-gray-600">
                              Hidden by <strong>{comment.hidden_by_name}</strong> on {formatDate(comment.hidden_at!)}
                            </p>
                            {comment.hidden_reason && (
                              <p className="text-gray-600 mt-1">
                                Reason: {comment.hidden_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reports Dialog */}
      <Dialog open={showReportsDialog} onOpenChange={setShowReportsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Comment Reports</DialogTitle>
            <DialogDescription>
              Reports for this comment from community members
            </DialogDescription>
          </DialogHeader>
          
          {selectedComment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Original Comment:</p>
                <p className="text-gray-900">{selectedComment.content}</p>
              </div>
              
              <div className="space-y-3">
                {selectedComment.reports.map((report, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getReasonBadgeColor(report.reason)}>
                        {report.reason}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                    
                    {report.description && (
                      <p className="text-sm text-gray-700 mb-2">{report.description}</p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Reported by: {report.reporter_name || 'Anonymous'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hide Comment Dialog */}
      <Dialog open={showHideDialog} onOpenChange={setShowHideDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Hide Comment</DialogTitle>
            <DialogDescription>
              Provide a reason for hiding this comment. This action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Enter reason for hiding this comment..."
              value={hideReason}
              onChange={(e) => setHideReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHideDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmHideComment} 
              disabled={!hideReason.trim() || actionLoading}
            >
              {actionLoading ? 'Hiding...' : 'Hide Comment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
