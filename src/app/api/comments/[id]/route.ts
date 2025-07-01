import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import authConfig from '@/lib/auth';
import type { Session } from 'next-auth';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

// DELETE /api/comments/[id] - Delete a comment (editors/admins only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to delete comments
    const allowedRoles = ['editor', 'admin'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete comments' },
        { status: 403 }
      );
    }

    const commentId = parseInt(params.id);

    // Check if comment exists
    const commentExists = await sql`
      SELECT id FROM comments WHERE id = ${commentId} LIMIT 1
    `;

    if (commentExists.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Delete the comment
    await sql`DELETE FROM comments WHERE id = ${commentId}`;

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/comments/[id] - Update comment (hide/unhide, or report)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig) as Session | null;
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const commentId = parseInt(params.id);
    const body = await request.json();
    const { action, reason, description } = body;

    // Check if comment exists
    const commentResult = await sql`
      SELECT id, author_id, is_hidden FROM comments WHERE id = ${commentId} LIMIT 1
    `;

    if (commentResult.length === 0) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    const comment = commentResult[0];

    if (action === 'report') {
      // Any authenticated user can report a comment
      if (!reason) {
        return NextResponse.json(
          { error: 'Reason is required for reporting' },
          { status: 400 }
        );
      }

      // Check if user already reported this comment
      const existingReport = await sql`
        SELECT id FROM comment_reports 
        WHERE comment_id = ${commentId} AND reporter_id = ${session.user.id}
        LIMIT 1
      `;

      if (existingReport.length > 0) {
        return NextResponse.json(
          { error: 'You have already reported this comment' },
          { status: 409 }
        );
      }

      // Create the report
      await sql`
        INSERT INTO comment_reports (comment_id, reporter_id, reason, description)
        VALUES (${commentId}, ${session.user.id}, ${reason}, ${description || null})
      `;

      return NextResponse.json({
        success: true,
        message: 'Comment reported successfully'
      });

    } else if (action === 'hide' || action === 'unhide') {
      // Only editors/admins can hide/unhide comments
      const allowedRoles = ['editor', 'admin'];
      if (!allowedRoles.includes(session.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to hide/unhide comments' },
          { status: 403 }
        );
      }

      if (action === 'hide') {
        if (!reason) {
          return NextResponse.json(
            { error: 'Reason is required for hiding comment' },
            { status: 400 }
          );
        }

        // Hide the comment
        await sql`
          UPDATE comments 
          SET 
            is_hidden = true,
            hidden_by = ${session.user.id},
            hidden_at = CURRENT_TIMESTAMP,
            hidden_reason = ${reason}
          WHERE id = ${commentId}
        `;

        return NextResponse.json({
          success: true,
          message: 'Comment hidden successfully'
        });

      } else if (action === 'unhide') {
        // Unhide the comment
        await sql`
          UPDATE comments 
          SET 
            is_hidden = false,
            hidden_by = null,
            hidden_at = null,
            hidden_reason = null
          WHERE id = ${commentId}
        `;

        return NextResponse.json({
          success: true,
          message: 'Comment restored successfully'
        });
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "report", "hide", or "unhide"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 