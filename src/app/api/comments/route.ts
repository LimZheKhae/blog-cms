import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import authConfig from '@/lib/auth';
import type { Session } from 'next-auth';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

// POST /api/comments - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, post_id } = body;

    // Validate required fields
    if (!content || !post_id) {
      return NextResponse.json(
        { error: 'Content and post_id are required' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be less than 2000 characters' },
        { status: 400 }
      );
    }

    // Check if post exists
    const postExists = await sql`
      SELECT id FROM posts WHERE id = ${post_id} LIMIT 1
    `;

    if (postExists.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Insert the new comment (status defaults to 'approved')
    const result = await sql`
      INSERT INTO comments (content, post_id, author_id, status)
      VALUES (${content}, ${post_id}, ${session.user.id}, 'approved')
      RETURNING id, content, created_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    const newComment = result[0];

    // Return the created comment with author info
    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id.toString(),
        content: newComment.content,
        author_name: session.user.name,
        author_avatar: session.user.image,
        created_at: newComment.created_at,
        likes: 0,
        report_count: 0,
        is_reported: false,
        is_hidden: false
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/comments - Get comments for moderation (editors/admins only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has moderation permissions
    const allowedRoles = ['editor', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'reported'; // 'reported', 'all', 'hidden'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let whereClause = '';
    if (type === 'reported') {
      whereClause = 'WHERE c.is_reported = true AND c.is_hidden = false';
    } else if (type === 'hidden') {
      whereClause = 'WHERE c.is_hidden = true';
    }
    // 'all' has no where clause

    const comments = await sql`
      SELECT 
        c.id, c.content, c.created_at, c.report_count, c.is_reported, c.is_hidden,
        c.hidden_by, c.hidden_at, c.hidden_reason,
        u.id as author_id, u.name as author_name, u.image as author_avatar,
        p.id as post_id, p.title as post_title, p.slug as post_slug,
        hb.name as hidden_by_name
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      LEFT JOIN posts p ON c.post_id = p.id
      LEFT JOIN users hb ON c.hidden_by = hb.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination
    const totalResult = await sql`
      SELECT COUNT(*) as count
      FROM comments c
      ${whereClause}
    `;

    const total = parseInt(totalResult[0].count);

    return NextResponse.json({
      success: true,
      comments: comments.map((comment: any) => ({
        id: comment.id.toString(),
        content: comment.content,
        created_at: comment.created_at,
        report_count: comment.report_count,
        is_reported: comment.is_reported,
        is_hidden: comment.is_hidden,
        hidden_by: comment.hidden_by,
        hidden_at: comment.hidden_at,
        hidden_reason: comment.hidden_reason,
        hidden_by_name: comment.hidden_by_name,
        author: {
          id: comment.author_id?.toString(),
          name: comment.author_name,
          avatar: comment.author_avatar
        },
        post: {
          id: comment.post_id?.toString(),
          title: comment.post_title,
          slug: comment.post_slug
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 