import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { neon } from '@neondatabase/serverless'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    console.log('Moderation API - Full session:', JSON.stringify(session, null, 2))
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Moderation API - User object:', JSON.stringify(session.user, null, 2))
    console.log('Moderation API - User role:', session.user.role)
    
    // Check if user has moderation permissions
    if (!hasPermission(session.user.role as any, PERMISSIONS.MODERATE_COMMENTS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let whereClause = ''
    let params: any[] = []

    // Build where clause based on filter
    switch (filter) {
      case 'reported':
        whereClause = 'WHERE c.is_reported = true AND c.is_hidden = false'
        break
      case 'hidden':
        whereClause = 'WHERE c.is_hidden = true'
        break
      case 'pending':
        whereClause = 'WHERE c.is_reported = true AND c.is_hidden = false'
        break
      case 'all':
      default:
        whereClause = 'WHERE 1=1'
        break
    }

    // Get comments with related data using template literals for Neon
    const commentsResult = await sql`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        c.report_count,
        c.is_reported,
        c.is_hidden,
        c.hidden_by,
        c.hidden_at,
        c.hidden_reason,
        u.name as author_name,
        u.avatar_url as author_avatar,
        p.id as post_id,
        p.title as post_title,
        p.slug as post_slug,
        hb.name as hidden_by_name
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN posts p ON c.post_id = p.id
      LEFT JOIN users hb ON c.hidden_by = hb.id
      ORDER BY 
        CASE WHEN c.is_reported = true THEN 0 ELSE 1 END,
        c.report_count DESC,
        c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    console.log(commentsResult)

    // Get total count for pagination
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM comments c
    `
    const total = parseInt(countResult[0].total)

    // Get recent reports for each comment
    const commentIds = commentsResult.map(c => c.id)
    let reports: any[] = []

    if (commentIds.length > 0) {
      reports = await sql`
        SELECT 
          cr.comment_id,
          cr.reason,
          cr.description,
          cr.created_at,
          u.name as reporter_name
        FROM comment_reports cr
        LEFT JOIN users u ON cr.reporter_id = u.id
        WHERE cr.comment_id = ANY(${commentIds})
        ORDER BY cr.created_at DESC
      `
    }

    // Group reports by comment
    const reportsMap = reports.reduce((acc, report) => {
      if (!acc[report.comment_id]) {
        acc[report.comment_id] = []
      }
      acc[report.comment_id].push(report)
      return acc
    }, {})

    // Format response
    const comments = commentsResult.map(comment => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      report_count: comment.report_count || 0,
      is_reported: comment.is_reported || false,
      is_hidden: comment.is_hidden || false,
      hidden_by: comment.hidden_by,
      hidden_at: comment.hidden_at,
      hidden_reason: comment.hidden_reason,
      hidden_by_name: comment.hidden_by_name,
      author: {
        name: comment.author_name || 'Anonymous',
        avatar: comment.author_avatar
      },
      post: {
        id: comment.post_id,
        title: comment.post_title,
        slug: comment.post_slug
      },
      reports: reportsMap[comment.id] || []
    }))

    // Get summary statistics
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(CASE WHEN is_reported = true AND is_hidden = false THEN 1 END) as pending_reports,
        COUNT(CASE WHEN is_hidden = true THEN 1 END) as hidden_comments,
        COUNT(CASE WHEN is_reported = true THEN 1 END) as reported_comments
      FROM comments
    `
    const stats = statsResult[0]

    return NextResponse.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        stats: {
          totalComments: parseInt(stats.total_comments),
          pendingReports: parseInt(stats.pending_reports),
          hiddenComments: parseInt(stats.hidden_comments),
          reportedComments: parseInt(stats.reported_comments)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching moderation data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moderation data' },
      { status: 500 }
    )
  }
} 