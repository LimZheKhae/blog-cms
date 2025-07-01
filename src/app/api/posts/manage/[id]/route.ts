import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import { authOptions } from '@/lib/auth';
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

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    const postResult = await sql`
      SELECT 
        id, title, slug, content, excerpt, status, 
        created_at, updated_at, author_id, reading_time_minutes 
      FROM posts 
      WHERE id = ${postId} 
      LIMIT 1
    `;

    if (postResult.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = postResult[0];

    // Check if user has permission to view this post
    if (post.status === 'draft') {
      if (post.author_id !== session.user.id && 
          !['editor', 'admin'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        );
      }
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
        created_at: post.created_at,
        updated_at: post.updated_at,
        author_id: post.author_id?.toString(),
        reading_time_minutes: post.reading_time_minutes || 1
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

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Check if post exists and user has permission to edit
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

    // Check permissions
    if (post.author_id !== session.user.id && 
        !['editor', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'You can only edit your own posts' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, slug, content, excerpt, status, reading_time_minutes } = body;

    if (!title || !content || !excerpt || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        status = ${status || post.status},
        reading_time_minutes = ${reading_time_minutes || 1},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${postId}
      RETURNING id, title, slug, status, updated_at
    `;

    return NextResponse.json({
      success: true,
      message: 'Post updated successfully',
      post: result[0]
    });

  } catch (error) {
    console.error('Error updating post:', error);
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

    const { id } = await params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Check if post exists and user has permission to delete
    const existingPost = await sql`
      SELECT id, author_id FROM posts WHERE id = ${postId} LIMIT 1
    `;

    if (existingPost.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const post = existingPost[0];

    // Check permissions
    if (post.author_id !== session.user.id && 
        !['editor', 'admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Delete associated comments first
    await sql`DELETE FROM comments WHERE post_id = ${postId}`;

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