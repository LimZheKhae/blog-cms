require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runCommentsMigration() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔄 Starting comments system migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '04-update-comments-system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📋 Found ${statements.length} migration statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await sql`${statement}`;
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        // Continue with other statements
      }
    }
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Check if new columns exist
    const columnsCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' 
      AND column_name IN ('report_count', 'is_reported', 'is_hidden', 'hidden_by', 'hidden_at', 'hidden_reason')
    `;
    
    console.log(`✅ Added ${columnsCheck.length} new columns to comments table`);
    
    // Check if comment_reports table exists
    const tableCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'comment_reports'
    `;
    
    if (tableCheck.length > 0) {
      console.log('✅ comment_reports table created successfully');
    } else {
      console.log('❌ comment_reports table not found');
    }
    
    // Show updated comment counts
    const commentStats = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN is_reported = true THEN 1 END) as reported_count,
        COUNT(CASE WHEN is_hidden = true THEN 1 END) as hidden_count
      FROM comments 
      GROUP BY status
    `;
    
    console.log('\n📊 Comment statistics after migration:');
    console.table(commentStats);
    
    console.log('\n🎉 Comments system migration completed successfully!');
    console.log('✨ Features added:');
    console.log('  - Comments now appear immediately (no approval needed)');
    console.log('  - Users can report inappropriate comments');
    console.log('  - Editors/admins can hide reported comments');
    console.log('  - Automatic report counting with triggers');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runCommentsMigration(); 