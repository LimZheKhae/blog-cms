const { neon } = require('@neondatabase/serverless');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runPasswordMigration() {
  try {
    console.log('🔄 Starting password authentication migration...');
    
    // Add password_hash column if it doesn't exist
    console.log('📝 Adding password_hash column...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`;
    console.log('✅ Password_hash column added successfully');
    
    // Update demo users with hashed password for "Abcd1234"
    console.log('🔐 Updating demo users with password hashes...');
    
    const passwordHash = '$2b$12$9fawd07uSEuQiJfAcrkvledmy60DH6tC5xEI4tvg33lIuw7cjDbzO';
    
    const updates = await Promise.all([
      sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = 1`, // admin@company.com
      sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = 2`, // editor@company.com  
      sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = 3`, // author@company.com
      sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = 4`, // viewer@company.com
    ]);
    
    console.log('✅ Demo users updated successfully');
    console.log(`📊 Updated ${updates.reduce((sum, result) => sum + result.length, 0)} users`);
    
    // Verify the updates
    console.log('🔍 Verifying updates...');
    const verifyResult = await sql`
      SELECT id, email, name, role, 
             CASE WHEN password_hash IS NOT NULL THEN 'HAS_PASSWORD' ELSE 'NO_PASSWORD' END as password_status
      FROM users 
      WHERE id IN (1, 2, 3, 4)
      ORDER BY id
    `;
    
    console.log('📋 Demo users status:');
    verifyResult.forEach(user => {
      console.log(`   ${user.id}: ${user.email} (${user.role}) - ${user.password_status}`);
    });
    
    console.log('\n🎉 Password authentication migration completed successfully!');
    console.log('📝 Demo accounts can now sign in with password: Abcd1234');
    console.log('🔐 OAuth users (Google, Microsoft) will continue to work without passwords');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runPasswordMigration(); 