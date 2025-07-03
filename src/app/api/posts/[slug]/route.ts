import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    // console.log('Extracted userId:', userId);
    const { slug } = await params;

    // Get the post with author information using slug
    const posts = await sql`
      SELECT 
        p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, p.category,
        p.views_count, p.likes_count, p.reading_time_minutes,
        p.created_at, p.updated_at,
        u.id as author_id, u.name as author_name, u.email as author_email, 
        u.image as author_avatar
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.slug = ${slug}
      LIMIT 1
    `;

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = posts[0];

    // Check if current user has liked this post
    const userLike = await sql`
      SELECT id FROM post_likes 
      WHERE post_id = ${post.id} AND user_id = ${userId}
      LIMIT 1
    `;

    const isLikedByUser = userLike.length > 0;

    // Check if current user has bookmarked this post
    const userBookmark = await sql`
      SELECT id FROM post_bookmarks 
      WHERE post_id = ${post.id} AND user_id = ${userId}
      LIMIT 1
    `;

    const isBookmarkedByUser = userBookmark.length > 0;

    // Get comments for the post (excluding hidden ones)
    const comments = await sql`
      SELECT 
        c.id, c.content, c.created_at, c.likes_count, c.report_count, c.is_reported, c.is_hidden,
        u.id as author_id, u.name as author_name, u.image as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ${post.id} AND c.is_hidden = false
      ORDER BY c.created_at DESC
    `;

    // Check which comments the current user has liked
    const userCommentLikes = await sql`
      SELECT comment_id FROM comment_likes 
      WHERE user_id = ${userId}
    `;
    console.log('userCommentLikes', userCommentLikes);
    const userLikedCommentIds = new Set(userCommentLikes.map((like: any) => like.comment_id));

    // Get client IP for view tracking (to prevent duplicate views from same user/IP)
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    // Check if this user/IP has already viewed this post recently (within last hour)
    const existingView = await sql`
      SELECT id FROM post_views 
      WHERE post_id = ${post.id} 
      AND (
        (user_id = ${userId}) 
        OR (ip_address = ${ip})
      )
      AND viewed_at > NOW() - INTERVAL '1 hour'
      LIMIT 1
    `;

    // Only increment view if no recent view found
    let newViewCount = post.views_count || 0;
    if (existingView.length === 0) {
      // Insert new view record
      await sql`
        INSERT INTO post_views (post_id, user_id, ip_address, user_agent)
        VALUES (${post.id}, ${userId}, ${ip}, ${userAgent})
        ON CONFLICT (post_id, user_id, ip_address) DO NOTHING
      `;

      // Update post view count
      const updatedPost = await sql`
        UPDATE posts 
        SET views_count = COALESCE(views_count, 0) + 1 
        WHERE id = ${post.id}
        RETURNING views_count
      `;
      
      newViewCount = updatedPost[0]?.views_count || newViewCount + 1;
    }

    // Format the response
    const formattedPost = {
      id: post.id.toString(),
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      category: post.category || 'Technology',
      created_at: post.created_at,
      updated_at: post.updated_at,
      author_id: post.author_id?.toString(),
      author_name: post.author_name,
      author_bio: `${post.author_name} is a contributor to our blog.`, // Default bio
      author_avatar: post.author_avatar,
      views_count: newViewCount,
      comments_count: comments.length,
      likes_count: post.likes_count || 0,
      reading_time: post.reading_time_minutes || 1,
      tags: post.tags || [],
      is_liked_by_user: isLikedByUser,
      is_bookmarked_by_user: isBookmarkedByUser
    };

    const formattedComments = comments.map((comment: any) => ({
      id: comment.id.toString(),
      content: comment.content,
      author_name: comment.author_name,
      author_avatar: comment.author_avatar,
      created_at: comment.created_at,
      likes: comment.likes_count || 0,
      report_count: comment.report_count || 0,
      is_reported: comment.is_reported || false,
      is_hidden: comment.is_hidden || false,
      is_liked_by_user: userLikedCommentIds.has(comment.id)
    }));

    return NextResponse.json({
      success: true,
      post: formattedPost,
      comments: formattedComments,
      is_liked_by_user: isLikedByUser,
      is_bookmarked_by_user: isBookmarkedByUser
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}