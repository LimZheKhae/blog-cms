import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify the comment exists
    const comments = await sql`
      SELECT id, likes_count FROM comments WHERE id = ${commentId} LIMIT 1
    `;

    if (comments.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = comments[0];

    // Check if user has already liked this comment
    const existingLike = await sql`
      SELECT id FROM comment_likes 
      WHERE comment_id = ${commentId} AND user_id = ${userId}
      LIMIT 1
    `;

    let isLiked = false;
    let newLikesCount = comment.likes_count || 0;

    if (existingLike.length > 0) {
      // User has already liked - UNLIKE (remove like)
      const [, updatedComment] = await sql.transaction([
        sql`DELETE FROM comment_likes WHERE comment_id = ${commentId} AND user_id = ${userId}`,
        sql`UPDATE comments SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = ${commentId} RETURNING likes_count`
      ]);
      
      newLikesCount = updatedComment[0]?.likes_count || 0;
      isLiked = false;
    } else {
      // User hasn't liked yet - LIKE (add like)
      const [, updatedComment] = await sql.transaction([
        sql`INSERT INTO comment_likes (comment_id, user_id) VALUES (${commentId}, ${userId}) ON CONFLICT (comment_id, user_id) DO NOTHING`,
        sql`UPDATE comments SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = ${commentId} RETURNING likes_count`
      ]);
      
      newLikesCount = updatedComment[0]?.likes_count || 0;
      isLiked = true;
    }

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: newLikesCount,
      message: isLiked ? 'Comment liked successfully' : 'Comment unliked successfully'
    });

  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 