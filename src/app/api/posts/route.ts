import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import { authOptions } from '@/lib/auth';
import type { Session } from 'next-auth';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    // Get the session to verify authentication
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('Posts API - Full session:', JSON.stringify(session, null, 2))
    console.log('Posts API - User object:', JSON.stringify(session.user, null, 2))
    console.log('Posts API - User role:', session.user.role);

    // Check if user has permission to create posts
    const allowedRoles = ['author', 'editor', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create posts' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      tags,
      status,
      reading_time_minutes,
      author_id
    } = body;

    // Validate required fields
    if (!title || !content || !excerpt || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, excerpt, and slug are required' },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be less than 255 characters' },
        { status: 400 }
      );
    }

    // Validate status
    if (status && !['draft', 'published'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "draft" or "published"' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingPost = await sql`
      SELECT id FROM posts WHERE slug = ${slug} LIMIT 1
    `;

    if (existingPost.length > 0) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Use the authenticated user's ID as author_id
    const finalAuthorId = session.user.id;

    // Insert the new post
    const result = await sql`
      INSERT INTO posts (
        title, 
        slug, 
        content, 
        excerpt, 
        tags, 
        status, 
        author_id, 
        reading_time_minutes,
        views_count,
        likes_count
      ) VALUES (
        ${title},
        ${slug},
        ${content},
        ${excerpt},
        ${tags || []},
        ${status || 'draft'},
        ${finalAuthorId},
        ${reading_time_minutes || 1},
        0,
        0
      )
      RETURNING id, title, slug, content, excerpt, tags, status, author_id, reading_time_minutes, views_count, likes_count, created_at, updated_at
    `;
    // console.log(result);
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 }
      );
    }

    const newPost = result[0];

    // Get author information
    const authorResult = await sql`
      SELECT id, name, email FROM users WHERE id = ${finalAuthorId} LIMIT 1
    `;

    const author = authorResult.length > 0 ? authorResult[0] : null;

    // Return the created post with author info
    return NextResponse.json({
      message: 'Post created successfully',
      post: {
        ...newPost,
        author: author
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating post:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('duplicate key')) {
        return NextResponse.json(
          { error: 'A post with this slug already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/posts - Get all posts with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const draftsOnly = searchParams.get('draftsOnly') === 'true'; // New parameter for drafts
    
    const offset = (page - 1) * limit;

    let posts;
    
    if (draftsOnly) {
      // Special endpoint for user's own drafts only
      posts = await sql`
        SELECT 
          p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
          p.views_count, p.likes_count, p.reading_time_minutes,
          p.created_at, p.updated_at,
          u.id as author_id, u.name as author_name, u.email as author_email, 
          u.avatar_url as author_avatar
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.status = 'draft' AND p.author_id = ${session.user.id}
        ORDER BY p.updated_at DESC
      `;
    } else {
      // For main posts listing - implement proper access control
      if (status === 'draft') {
        // Only editors/admins can see all drafts, authors see only their own
        if (['editor', 'admin'].includes(session.user.role)) {
          posts = await sql`
            SELECT 
              p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
              p.views_count, p.likes_count, p.reading_time_minutes,
              p.created_at, p.updated_at,
              u.id as author_id, u.name as author_name, u.email as author_email, 
              u.avatar_url as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.status = 'draft'
            ORDER BY p.created_at DESC
          `;
        } else {
          // Authors see only their own drafts
          posts = await sql`
            SELECT 
              p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
              p.views_count, p.likes_count, p.reading_time_minutes,
              p.created_at, p.updated_at,
              u.id as author_id, u.name as author_name, u.email as author_email, 
              u.avatar_url as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.status = 'draft' AND p.author_id = ${session.user.id}
            ORDER BY p.created_at DESC
          `;
        }
      } else if (status === 'published') {
        // Everyone can see published posts
        posts = await sql`
          SELECT 
            p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
            p.views_count, p.likes_count, p.reading_time_minutes,
            p.created_at, p.updated_at,
            u.id as author_id, u.name as author_name, u.email as author_email, 
            u.avatar_url as author_avatar
          FROM posts p
          LEFT JOIN users u ON p.author_id = u.id
          WHERE p.status = 'published'
          ORDER BY p.created_at DESC
        `;
      } else {
        // "all" filter - show published posts + user's own drafts
        if (['editor', 'admin'].includes(session.user.role)) {
          // Editors/admins see everything
          posts = await sql`
            SELECT 
              p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
              p.views_count, p.likes_count, p.reading_time_minutes,
              p.created_at, p.updated_at,
              u.id as author_id, u.name as author_name, u.email as author_email, 
              u.avatar_url as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
          `;
        } else {
          // Authors see published posts + their own drafts
          posts = await sql`
            SELECT 
              p.id, p.title, p.slug, p.content, p.excerpt, p.tags, p.status, 
              p.views_count, p.likes_count, p.reading_time_minutes,
              p.created_at, p.updated_at,
              u.id as author_id, u.name as author_name, u.email as author_email, 
              u.avatar_url as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.status = 'published' OR (p.status = 'draft' AND p.author_id = ${session.user.id})
            ORDER BY p.created_at DESC
          `;
        }
      }
    }
    // console.log(posts);

    // Get comments count for each post
    const postsWithComments = await Promise.all(
      posts.map(async (post: any) => {
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
        filteredPosts.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'popular':
        filteredPosts.sort((a: any, b: any) => (b.views_count || 0) - (a.views_count || 0));
        break;
      case 'title':
        filteredPosts.sort((a: any, b: any) => a.title.localeCompare(b.title));
        break;
      default: // newest
        filteredPosts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Apply pagination
    const total = filteredPosts.length;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    // Format the response to match the expected interface
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
      reading_time: post.reading_time_minutes || 1
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
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 