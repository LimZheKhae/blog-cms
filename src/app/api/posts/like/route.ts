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
    
    // console.log('=== SESSION DEBUG ===');
    // console.log('Full session:', JSON.stringify(session, null, 2));
    // console.log('session.user:', session?.user);
    // console.log('session.user.id:', session?.user?.id);
    // console.log('session.user.email:', session?.user?.email);
    // console.log('session.user.name:', session?.user?.name);
    // console.log('session.user.role:', session?.user?.role);
    // console.log('=== END SESSION DEBUG ===');
    
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
    // console.log('Extracted userId:', userId);

    // Verify the post exists
    const posts = await sql`
      SELECT id, likes_count FROM posts WHERE id = ${postId} LIMIT 1
    `;

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0];

    // Check if user has already liked this post
    const existingLike = await sql`
      SELECT id FROM post_likes 
      WHERE post_id = ${postId} AND user_id = ${userId}
      LIMIT 1
    `;

    let isLiked = false;
    let newLikesCount = post.likes_count || 0;

    if (existingLike.length > 0) {
      // User has already liked - UNLIKE (remove like)
      const [, updatedPost] = await sql.transaction([
        sql`DELETE FROM post_likes WHERE post_id = ${postId} AND user_id = ${userId}`,
        sql`UPDATE posts SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = ${postId} RETURNING likes_count`
      ]);
      
      newLikesCount = updatedPost[0]?.likes_count || 0;
      isLiked = false;
    } else {
      // User hasn't liked yet - LIKE (add like)
      const [, updatedPost] = await sql.transaction([
        sql`INSERT INTO post_likes (post_id, user_id) VALUES (${postId}, ${userId}) ON CONFLICT (post_id, user_id) DO NOTHING`,
        sql`UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = ${postId} RETURNING likes_count`
      ]);
      
      newLikesCount = updatedPost[0]?.likes_count || 0;
      isLiked = true;
    }

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: newLikesCount,
      message: isLiked ? 'Post liked successfully' : 'Post unliked successfully'
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 