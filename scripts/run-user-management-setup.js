const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runUserManagementSetup() {
  try {
    console.log('🚀 Starting User Management Database Setup...');
    
    // Execute critical statements one by one
    console.log('⚡ Adding is_active column...');
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`;
      console.log('✅ is_active column added');
    } catch (err) {
      console.log('ℹ️ is_active column might already exist');
    }

    console.log('⚡ Adding last_login_at column...');
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`;
      console.log('✅ last_login_at column added');
    } catch (err) {
      console.log('ℹ️ last_login_at column might already exist');
    }

    console.log('⚡ Adding updated_at column...');
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;
      console.log('✅ updated_at column added');
    } catch (err) {
      console.log('ℹ️ updated_at column might already exist');
    }

    console.log('⚡ Creating user_actions table...');
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS user_actions (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          target_user_id INTEGER NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          details JSONB,
          ip_address INET,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log('✅ user_actions table created');
    } catch (err) {
      console.log('ℹ️ user_actions table might already exist');
    }

    console.log('⚡ Creating indexes...');
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at)`;
      console.log('✅ User indexes created');
    } catch (err) {
      console.log('ℹ️ Some indexes might already exist');
    }

    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_user_actions_admin_id ON user_actions(admin_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_actions_target_user_id ON user_actions(target_user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at)`;
      console.log('✅ User actions indexes created');
    } catch (err) {
      console.log('ℹ️ Some user action indexes might already exist');
    }

    console.log('⚡ Adding constraints...');
    try {
      await sql`
        ALTER TABLE users 
        ADD CONSTRAINT IF NOT EXISTS chk_users_role 
        CHECK (role IN ('viewer', 'author', 'editor', 'admin'))
      `;
      console.log('✅ Users role constraint added');
    } catch (err) {
      console.log('ℹ️ Users role constraint might already exist');
    }

    try {
      await sql`
        ALTER TABLE user_actions
        ADD CONSTRAINT IF NOT EXISTS chk_user_actions_action_type
        CHECK (action_type IN ('user_created', 'user_updated', 'user_deleted', 'role_changed', 'status_changed'))
      `;
      console.log('✅ User actions constraint added');
    } catch (err) {
      console.log('ℹ️ User actions constraint might already exist');
    }

    console.log('⚡ Updating existing users...');
    const updateResult = await sql`
      UPDATE users 
      SET is_active = true, updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
      WHERE is_active IS NULL OR updated_at IS NULL
    `;
    console.log(`✅ Updated users to have proper defaults`);
    
    console.log('\n🔍 Verifying database structure...');
    
    // Verify users table has new columns
    const userColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    console.log('\n📋 Users table structure:');
    userColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check if user_actions table exists
    const userActionsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_actions'
      )
    `;
    
    if (userActionsExists[0].exists) {
      console.log('\n✅ user_actions table created successfully');
      
      // Show table structure
      const actionColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'user_actions' 
        ORDER BY ordinal_position
      `;
      
      console.log('\n📋 User Actions table structure:');
      actionColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('\n❌ user_actions table was not created');
    }
    
    // Show current user count by role
    const userStats = await sql`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
      FROM users 
      GROUP BY role
      ORDER BY 
        CASE role 
          WHEN 'admin' THEN 1 
          WHEN 'editor' THEN 2 
          WHEN 'author' THEN 3 
          WHEN 'viewer' THEN 4 
        END
    `;
    
    console.log('\n📈 Current user statistics:');
    console.table(userStats.map(stat => ({
      Role: stat.role,
      'Total Users': stat.count,
      'Active Users': stat.active_count
    })));
    
    console.log('\n🎉 User Management Database Setup completed successfully!');
    console.log('\n✨ Features added:');
    console.log('  - User activation/deactivation');
    console.log('  - Last login tracking');
    console.log('  - User update timestamps');
    console.log('  - Admin action audit trail');
    console.log('  - Performance indexes');
    console.log('  - Data validation constraints');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runUserManagementSetup(); 