const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function executeEnhancedSeed() {
  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🚀 Starting enhanced seed data execution...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '03-enhanced-seed-data.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement using raw SQL
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.toLowerCase().includes('select')) {
        // For SELECT statements, log the results
        console.log(`\n📊 Executing query ${i + 1}:`);
        try {
          const result = await sql.unsafe(statement);
          console.table(result);
        } catch (error) {
          console.log(`⚠️  Query ${i + 1} failed (this might be expected):`, error.message);
        }
      } else {
        // For other statements, just execute
        try {
          await sql.unsafe(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log(`⚠️  Statement ${i + 1} skipped (data already exists):`, error.message);
          } else {
            console.log(`❌ Statement ${i + 1} failed:`, error.message);
          }
        }
      }
    }
    
    console.log('\n🎉 Enhanced seed data execution completed!');
    console.log('\n📈 Database now contains:');
    
    // Show final summary
    const summary = await sql`
      SELECT 
        'Posts' as table_name,
        COUNT(*) as count
      FROM posts
      UNION ALL
      SELECT 
        'Users' as table_name,
        COUNT(*) as count
      FROM users
      UNION ALL
      SELECT 
        'Comments' as table_name,
        COUNT(*) as count
      FROM comments
      UNION ALL
      SELECT 
        'Post Views' as table_name,
        COUNT(*) as count
      FROM post_views
      UNION ALL
      SELECT 
        'Post Likes' as table_name,
        COUNT(*) as count
      FROM post_likes
    `;
    
    console.table(summary);
    
  } catch (error) {
    console.error('❌ Error executing enhanced seed data:', error);
    process.exit(1);
  }
}

// Run the script
executeEnhancedSeed(); 