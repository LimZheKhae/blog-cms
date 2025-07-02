import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { neon } from '@neondatabase/serverless';
import { authOptions } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import type { Session } from 'next-auth';

// Initialize database connection
const sql = neon(process.env.DATABASE_URL!);

// DELETE /api/comments/[id] - Delete a comment (editors/admins only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    console.log('DELETE Comment - Session:', {
      user: session?.user,
      role: session?.user?.role
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has permission to delete comments using RBAC
    if (!hasPermission(session.user.role, PERMISSIONS.DELETE_COMMENTS)) {
      console.log('DELETE Comment - Permission denied:', {
        userRole: session.user.role,
        requiredPermission: PERMISSIONS.DELETE_COMMENTS
      });
      
      return NextResponse.json(
        { error: 'Insufficient permissions to delete comments' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const commentId = parseInt(id);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session | null;
    
    console.log('PATCH Comment - Session:', {
      user: session?.user,
      role: session?.user?.role
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const commentId = parseInt(id);
    const body = await request.json();
    const { action, reason, description } = body;

    console.log('PATCH Comment - Request:', {
      commentId,
      action,
      reason,
      userRole: session.user.role
    });

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

      // Update the comment's report count and mark as reported
      await sql`
        UPDATE comments 
        SET 
          report_count = report_count + 1,
          is_reported = true
        WHERE id = ${commentId}
      `;

      return NextResponse.json({
        success: true,
        message: 'Comment reported successfully'
      });

    } else if (action === 'hide' || action === 'unhide') {
      // Only users with moderation permissions can hide/unhide comments
      if (!hasPermission(session.user.role, PERMISSIONS.MODERATE_COMMENTS)) {
        console.log('PATCH Comment - Permission denied:', {
          userRole: session.user.role,
          requiredPermission: PERMISSIONS.MODERATE_COMMENTS,
          action
        });
        
        return NextResponse.json(
          { error: `Insufficient permissions to ${action} comments. Required: comment moderation permission` },
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

        console.log('Comment hidden successfully by:', session.user.role);

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

        console.log('Comment unhidden successfully by:', session.user.role);

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