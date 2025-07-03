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
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify the post exists
    const posts = await sql`
      SELECT id FROM posts WHERE id = ${postId} LIMIT 1
    `;

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user has already bookmarked this post
    const existingBookmark = await sql`
      SELECT id FROM post_bookmarks 
      WHERE post_id = ${postId} AND user_id = ${userId}
      LIMIT 1
    `;

    let isBookmarked = false;

    if (existingBookmark.length > 0) {
      // User has already bookmarked - REMOVE BOOKMARK
      await sql`DELETE FROM post_bookmarks WHERE post_id = ${postId} AND user_id = ${userId}`;
      isBookmarked = false;
    } else {
      // User hasn't bookmarked yet - ADD BOOKMARK
      await sql`INSERT INTO post_bookmarks (post_id, user_id) VALUES (${postId}, ${userId}) ON CONFLICT (post_id, user_id) DO NOTHING`;
      isBookmarked = true;
    }

    return NextResponse.json({
      success: true,
      isBookmarked,
      message: isBookmarked ? 'Post bookmarked successfully' : 'Post removed from bookmarks'
    });

  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 