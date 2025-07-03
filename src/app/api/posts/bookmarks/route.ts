import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';
    
    const offset = (page - 1) * limit;

    // Get bookmarked posts for the current user
    let bookmarkedPosts = await sql`
      SELECT 
        p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
        p.views_count, p.likes_count, p.reading_time_minutes,
        p.created_at, p.updated_at,
        u.id as author_id, u.name as author_name, u.email as author_email, 
        u.avatar_url as author_avatar,
        pb.created_at as bookmarked_at
      FROM posts p
      INNER JOIN post_bookmarks pb ON p.id = pb.post_id
      LEFT JOIN users u ON p.author_id = u.id
      WHERE pb.user_id = ${userId} AND p.status = 'published'
      ORDER BY pb.created_at DESC
    `;

    // Get comments count for each post
    const postsWithComments = await Promise.all(
      bookmarkedPosts.map(async (post: any) => {
        const commentsCount = await sql`
          SELECT COUNT(*) as count 
          FROM comments 
          WHERE post_id = ${post.id} AND is_hidden = false
        `;
        
        return {
          ...post,
          comments_count: parseInt(commentsCount[0].count) || 0
        };
      })
    );

    // Apply search filter
    let filteredPosts = postsWithComments;
    if (search) {
      filteredPosts = postsWithComments.filter((post: any) =>
        post.title.toLowerCase().includes(search.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        filteredPosts.sort((a: any, b: any) => new Date(a.bookmarked_at).getTime() - new Date(b.bookmarked_at).getTime());
        break;
      case 'popular':
        filteredPosts.sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0));
        break;
      case 'title':
        filteredPosts.sort((a: any, b: any) => a.title.localeCompare(b.title));
        break;
      default: // newest
        filteredPosts.sort((a: any, b: any) => new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime());
    }

    // Apply pagination
    const total = filteredPosts.length;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    // Format the response
    const formattedPosts = paginatedPosts.map((post: any) => ({
      id: post.id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      created_at: post.created_at,
      updated_at: post.updated_at,
      author_id: post.author_id?.toString(),
      author_name: post.author_name,
      author_avatar: post.author_avatar,
      views_count: post.views_count || 0,
      comments_count: post.comments_count || 0,
      likes_count: post.likes_count || 0,
      reading_time: post.reading_time_minutes || 1,
      bookmarked_at: post.bookmarked_at
    }));

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
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
    console.error('Error fetching bookmarked posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 