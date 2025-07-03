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

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4');

    // First, get the current post to analyze its tags and category
    const currentPost = await sql`
      SELECT id, title, tags, status
      FROM posts 
      WHERE slug = ${slug} AND status = 'published'
      LIMIT 1
    `;

    if (currentPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = currentPost[0];
    const postTags = post.tags || [];

    // Get related posts using multiple criteria:
    // 1. Posts with overlapping tags (weighted by number of shared tags)
    // 2. Same category posts
    // 3. Recent published posts as fallback

    let relatedPosts: any[] = [];

    if (postTags.length > 0) {
      // Method 1: Find posts with overlapping tags
      relatedPosts = await sql`
        WITH tag_similarity AS (
          SELECT 
            p.id, p.title, p.slug, p.excerpt, p.tags, p.views_count, p.likes_count, 
            p.reading_time_minutes, p.created_at,
            u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
            -- Calculate tag overlap score
            COALESCE(
              ARRAY_LENGTH(
                ARRAY(
                  SELECT UNNEST(p.tags) 
                  INTERSECT 
                  SELECT UNNEST(${postTags}::text[])
                ), 1
              ), 0
            ) as tag_overlap_count
          FROM posts p
          LEFT JOIN users u ON p.author_id = u.id
          WHERE p.status = 'published' 
          AND p.id != ${post.id}
        )
        SELECT * FROM tag_similarity
        WHERE tag_overlap_count > 0
        ORDER BY tag_overlap_count DESC, views_count DESC, created_at DESC
        LIMIT ${limit}
      `;
    }

    // If we don't have enough related posts from tags, fill with recent popular posts
    if (relatedPosts.length < limit) {
      const remainingLimit = limit - relatedPosts.length;
      const existingIds = relatedPosts.map(p => p.id);

      const fallbackPosts = await sql`
        SELECT 
          p.id, p.title, p.slug, p.excerpt, p.tags, p.views_count, p.likes_count, 
          p.reading_time_minutes, p.created_at,
          u.id as author_id, u.name as author_name, u.avatar_url as author_avatar,
          0 as tag_overlap_count
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'published' 
        AND p.id != ${post.id}
        ${existingIds.length > 0 ? sql`AND p.id NOT IN (${existingIds})` : sql``}
        ORDER BY 
          (p.views_count * 0.7 + p.likes_count * 0.3) DESC,
          p.created_at DESC
        LIMIT ${remainingLimit}
      `;

      relatedPosts = [...relatedPosts, ...fallbackPosts];
    }

    // Get comments count for each related post
    const postsWithComments = await Promise.all(
      relatedPosts.map(async (relatedPost: any) => {
        const commentsCount = await sql`
          SELECT COUNT(*) as count 
          FROM comments 
          WHERE post_id = ${relatedPost.id} AND is_hidden = false
        `;
        
        return {
          ...relatedPost,
          comments_count: parseInt(commentsCount[0].count) || 0
        };
      })
    );

    // Format the response
    const formattedPosts = postsWithComments.map((relatedPost: any) => ({
      id: relatedPost.id.toString(),
      title: relatedPost.title,
      slug: relatedPost.slug,
      excerpt: relatedPost.excerpt,
      tags: relatedPost.tags || [],
      created_at: relatedPost.created_at,
      author_id: relatedPost.author_id?.toString(),
      author_name: relatedPost.author_name,
      author_avatar: relatedPost.author_avatar,
      views_count: relatedPost.views_count || 0,
      comments_count: relatedPost.comments_count || 0,
      likes_count: relatedPost.likes_count || 0,
      reading_time: relatedPost.reading_time_minutes || 1,
      tag_overlap_count: relatedPost.tag_overlap_count || 0,
      similarity_score: relatedPost.tag_overlap_count || 0
    }));

    return NextResponse.json({
      success: true,
      relatedPosts: formattedPosts,
      totalFound: formattedPosts.length
    });

  } catch (error) {
    console.error('Error fetching related posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 