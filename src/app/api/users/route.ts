import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { neon } from '@neondatabase/serverless'
import { authOptions } from '@/lib/auth'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

const sql = neon(process.env.DATABASE_URL!)

// GET /api/users - Get all users with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can access user management
    if (!hasPermission(session.user.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    
    const offset = (page - 1) * limit

    // Get users with statistics - using conditional SQL
    let users, countResult

    if (search && role && status) {
      const searchPattern = `%${search}%`
      const isActive = status === 'active'
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern})
          AND u.role = ${role} AND u.is_active = ${isActive}
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern})
          AND u.role = ${role} AND u.is_active = ${isActive}
      `
    } else if (search && role) {
      const searchPattern = `%${search}%`
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern}) AND u.role = ${role}
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern}) AND u.role = ${role}
      `
    } else if (search && status) {
      const searchPattern = `%${search}%`
      const isActive = status === 'active'
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern}) AND u.is_active = ${isActive}
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern}) AND u.is_active = ${isActive}
      `
    } else if (search) {
      const searchPattern = `%${search}%`
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern})
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u
        WHERE (u.name ILIKE ${searchPattern} OR u.email ILIKE ${searchPattern})
      `
    } else if (role && status) {
      const isActive = status === 'active'
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        WHERE u.role = ${role} AND u.is_active = ${isActive}
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u WHERE u.role = ${role} AND u.is_active = ${isActive}
      `
    } else if (role) {
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        WHERE u.role = ${role}
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u WHERE u.role = ${role}
      `
    } else if (status) {
      const isActive = status === 'active'
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        WHERE u.is_active = ${isActive}
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u WHERE u.is_active = ${isActive}
      `
    } else {
      // No filters
      users = await sql`
        SELECT 
          u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at,
          COUNT(DISTINCT p.id) as posts_count,
          COUNT(DISTINCT c.id) as comments_count,
          COUNT(DISTINCT pv.id) as views_count
        FROM users u
        LEFT JOIN posts p ON u.id = p.author_id
        LEFT JOIN comments c ON u.id = c.author_id
        LEFT JOIN post_views pv ON u.id = pv.user_id
        GROUP BY u.id, u.name, u.email, u.role, u.avatar_url, u.is_active, u.last_login_at, u.created_at, u.updated_at
        ORDER BY u.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countResult = await sql`
        SELECT COUNT(*) as total FROM users u
      `
    }

    const total = parseInt(countResult[0].total)

    // Get role statistics
    const roleStats = await sql`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users
      GROUP BY role
    `

    // Get recent activity
    const recentActivity = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        'login' as activity_type,
        u.last_login_at as activity_date
      FROM users u
      WHERE u.last_login_at IS NOT NULL
      UNION ALL
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        'post_created' as activity_type,
        p.created_at as activity_date
      FROM users u
      INNER JOIN posts p ON u.id = p.author_id
      UNION ALL
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        'comment_posted' as activity_type,
        c.created_at as activity_date
      FROM users u
      INNER JOIN comments c ON u.id = c.author_id
      ORDER BY activity_date DESC
      LIMIT 20
    `

    return NextResponse.json({
      success: true,
      data: {
        users: users.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: user.avatar_url,
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          created_at: user.created_at,
          updated_at: user.updated_at,
          stats: {
            posts_count: parseInt(user.posts_count) || 0,
            comments_count: parseInt(user.comments_count) || 0,
            views_count: parseInt(user.views_count) || 0,
          }
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: {
          roleDistribution: roleStats,
          recentActivity
        }
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create users
    if (!hasPermission(session.user.role, PERMISSIONS.MANAGE_USERS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, role, is_active = true } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['viewer', 'author', 'editor', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Create the user
    const result = await sql`
      INSERT INTO users (name, email, role, is_active)
      VALUES (${name}, ${email}, ${role}, ${is_active})
      RETURNING id, name, email, role, is_active, created_at
    `

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: result[0]
    })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 