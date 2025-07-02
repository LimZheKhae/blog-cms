import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { neon } from '@neondatabase/serverless'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS, getValidRoles } from '@/lib/permissions'
import type { Session } from 'next-auth'

const sql = neon(process.env.DATABASE_URL!)

// GET /api/users/[id] - Get specific user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params

    // Get user with detailed statistics
    const userResult = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar_url,
        u.is_active,
        u.last_login_at,
        u.created_at,
        u.updated_at
      FROM users u
      WHERE u.id = ${userId}
      LIMIT 1
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult[0]

    // Get user's posts
    const posts = await sql`
      SELECT 
        id,
        title,
        slug,
        status,
        views_count,
        likes_count,
        created_at
      FROM posts
      WHERE author_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Get user's comments
    const comments = await sql`
      SELECT 
        c.id,
        c.content,
        c.created_at,
        p.title as post_title,
        p.slug as post_slug
      FROM comments c
      LEFT JOIN posts p ON c.post_id = p.id
      WHERE c.author_id = ${userId}
      ORDER BY c.created_at DESC
      LIMIT 10
    `

    // Get activity statistics
    const stats = await sql`
      SELECT 
        COUNT(DISTINCT p.id) as posts_count,
        COUNT(DISTINCT c.id) as comments_count,
        COUNT(DISTINCT pv.id) as views_count,
        COUNT(DISTINCT pl.id) as likes_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      LEFT JOIN comments c ON u.id = c.author_id
      LEFT JOIN post_views pv ON u.id = pv.user_id
      LEFT JOIN post_likes pl ON u.id = pl.user_id
      WHERE u.id = ${userId}
    `

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        stats: {
          posts_count: parseInt(stats[0].posts_count) || 0,
          comments_count: parseInt(stats[0].comments_count) || 0,
          views_count: parseInt(stats[0].views_count) || 0,
          likes_count: parseInt(stats[0].likes_count) || 0,
        },
        recent_posts: posts,
        recent_comments: comments,
      }
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { name, email, role, is_active } = body

    // Check if user exists
    const existingUser = await sql`
      SELECT id, role FROM users WHERE id = ${userId} LIMIT 1
    `

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from demoting themselves
    if (userId === session.user.id && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot demote yourself from admin role' },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role) {
      const validRoles = getValidRoles()
      if (!validRoles.includes(role as any)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId} LIMIT 1
      `
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 409 }
        )
      }
    }

    // Update the user with conditional fields
    let result
    
    if (name !== undefined && email !== undefined && role !== undefined && is_active !== undefined) {
      // All fields
      result = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, role = ${role}, is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else if (name !== undefined && email !== undefined && role !== undefined) {
      // Name, email, role
      result = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, role = ${role}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else if (name !== undefined && email !== undefined && is_active !== undefined) {
      // Name, email, status
      result = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email}, is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else if (role !== undefined && is_active !== undefined) {
      // Role and status
      result = await sql`
        UPDATE users 
        SET role = ${role}, is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else if (name !== undefined) {
      // Name only
      result = await sql`
        UPDATE users 
        SET name = ${name}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else if (email !== undefined) {
      // Email only
      result = await sql`
        UPDATE users 
        SET email = ${email}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else if (role !== undefined) {
      // Role only
      result = await sql`
        UPDATE users 
        SET role = ${role}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else if (is_active !== undefined) {
      // Status only
      result = await sql`
        UPDATE users 
        SET is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id, name, email, role, is_active, updated_at
      `
    } else {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Log the action
    await sql`
      INSERT INTO user_actions (
        admin_id, 
        target_user_id, 
        action_type, 
        details, 
        ip_address
      ) VALUES (
        ${session.user.id},
        ${userId},
        'user_updated',
        ${JSON.stringify({ 
          updated_fields: Object.keys(body),
          old_role: existingUser[0].role,
          new_role: role 
        })},
        ${request.headers.get('x-forwarded-for') || '127.0.0.1'}
      )
    `

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: result[0]
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await sql`
      SELECT id, name, email, role FROM users WHERE id = ${userId} LIMIT 1
    `

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = existingUser[0]

    // Delete the user (this will cascade to related records based on DB constraints)
    await sql`
      DELETE FROM users WHERE id = ${userId}
    `

    // Log the action
    await sql`
      INSERT INTO user_actions (
        admin_id, 
        target_user_id, 
        action_type, 
        details, 
        ip_address
      ) VALUES (
        ${session.user.id},
        ${userId},
        'user_deleted',
        ${JSON.stringify({ 
          deleted_user: {
            name: user.name,
            email: user.email,
            role: user.role
          }
        })},
        ${request.headers.get('x-forwarded-for') || '127.0.0.1'}
      )
    `

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
} 