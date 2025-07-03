import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { CATEGORIES } from '@/lib/categories';
import type { Session } from 'next-auth';

const sql = neon(process.env.DATABASE_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow content creators to access this endpoint using RBAC
    if (!hasPermission(session.user.role, PERMISSIONS.CREATE_POST)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Fetch post with author information
    const postResult = await sql`
      SELECT 
        p.id, p.title, p.slug, p.content, p.excerpt, p.status, p.category,
        p.created_at, p.updated_at, p.author_id, p.reading_time_minutes,
        p.tags,
        u.name as author_name, u.email as author_email
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ${postId} 
      LIMIT 1
    `;

    if (postResult.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = postResult[0];

    // STRICT SECURITY RULE: Only allow access to own drafts
    // Users can only edit their own draft posts, regardless of role
    if (String(post.author_id) !== String(session.user.id)) {
      // console.log('post.author_id', post.author_id);
      // console.log('session.user.id', session.user.id);
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    // STRICT SECURITY RULE: Only allow editing of draft posts
    if (post.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft posts can be edited. Published posts cannot be modified.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id.toString(),
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status,
        category: post.category || 'Technology',
        created_at: post.created_at,
        updated_at: post.updated_at,
        author_id: post.author_id?.toString(),
        author_name: post.author_name,
        author_email: post.author_email,
        reading_time_minutes: post.reading_time_minutes || 1,
        tags: post.tags || []
      }
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow content creators to access this endpoint
    if (!hasPermission(session.user.role, PERMISSIONS.CREATE_POST)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Check if post exists and verify ownership/status
    const existingPost = await sql`
      SELECT id, author_id, status FROM posts WHERE id = ${postId} LIMIT 1
    `;

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = existingPost[0];

    // STRICT SECURITY RULE: Only allow users to edit their own posts
    if (String(post.author_id) !== String(session.user.id)) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    // STRICT SECURITY RULE: Only allow editing of draft posts
    if (post.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft posts can be edited. Published posts cannot be modified.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, slug, content, excerpt, status, reading_time_minutes, tags, category } = body;

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

    // Validate status - only allow draft or published
    if (status && !['draft', 'published'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "draft" or "published"' },
        { status: 400 }
      );
    }

    // Validate category
    if (category && !CATEGORIES.includes(category as any)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if slug already exists for other posts
    const slugCheck = await sql`
      SELECT id FROM posts WHERE slug = ${slug} AND id != ${postId} LIMIT 1
    `;

    if (slugCheck.length > 0) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    // Update the post
    const result = await sql`
      UPDATE posts 
      SET 
        title = ${title},
        slug = ${slug},
        content = ${content},
        excerpt = ${excerpt},
        status = ${status || 'draft'},
        reading_time_minutes = ${reading_time_minutes || 1},
        tags = ${tags || []},
        category = ${category || 'Technology'},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${postId}
      RETURNING id, title, slug, status, category, updated_at
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
      post: result[0]
    });

  } catch (error) {
    console.error('Error updating post:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only allow content creators to access this endpoint
    if (!hasPermission(session.user.role, PERMISSIONS.CREATE_POST)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Check if post exists and verify ownership
    const existingPost = await sql`
      SELECT id, author_id, status FROM posts WHERE id = ${postId} LIMIT 1
    `;

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = existingPost[0];

    // STRICT SECURITY RULE: Only allow users to delete their own drafts
    if (parseInt(post.author_id) !== parseInt(session.user.id)) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // STRICT SECURITY RULE: Only allow deletion of draft posts
    if (post.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft posts can be deleted. Published posts cannot be removed.' },
        { status: 403 }
      );
    }

    // Delete the post
    await sql`DELETE FROM posts WHERE id = ${postId}`;

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}