require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function runCommentsMigration() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔄 Starting comments system migration...');
    
    // Step 1: Remove the status constraint
    console.log('📋 Step 1: Removing status constraint...');
    try {
      await sql`ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_status_check`;
      console.log('✅ Status constraint removed');
    } catch (error) {
      console.log('⚠️ Status constraint removal failed (may not exist):', error.message);
    }
    
    // Step 2: Update pending comments to approved
    console.log('📋 Step 2: Updating pending comments to approved...');
    const updateResult = await sql`UPDATE comments SET status = 'approved' WHERE status = 'pending'`;
    console.log(`✅ Updated ${updateResult.length} pending comments to approved`);
    
    // Step 3: Add new columns
    console.log('📋 Step 3: Adding new columns...');
    
    const newColumns = [
      'report_count INTEGER DEFAULT 0',
      'is_reported BOOLEAN DEFAULT FALSE',
      'is_hidden BOOLEAN DEFAULT FALSE',
      'hidden_by INTEGER',
      'hidden_at TIMESTAMP',
      'hidden_reason TEXT'
    ];
    
    try {
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0`;
      console.log(`✅ Added column: report_count`);
    } catch (error) {
      console.log(`⚠️ Column report_count may already exist:`, error.message);
    }
    
    try {
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE`;
      console.log(`✅ Added column: is_reported`);
    } catch (error) {
      console.log(`⚠️ Column is_reported may already exist:`, error.message);
    }
    
    try {
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE`;
      console.log(`✅ Added column: is_hidden`);
    } catch (error) {
      console.log(`⚠️ Column is_hidden may already exist:`, error.message);
    }
    
    try {
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_by INTEGER`;
      console.log(`✅ Added column: hidden_by`);
    } catch (error) {
      console.log(`⚠️ Column hidden_by may already exist:`, error.message);
    }
    
    try {
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP`;
      console.log(`✅ Added column: hidden_at`);
    } catch (error) {
      console.log(`⚠️ Column hidden_at may already exist:`, error.message);
    }
    
    try {
      await sql`ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_reason TEXT`;
      console.log(`✅ Added column: hidden_reason`);
    } catch (error) {
      console.log(`⚠️ Column hidden_reason may already exist:`, error.message);
    }
    
    // Step 4: Create comment_reports table
    console.log('📋 Step 4: Creating comment_reports table...');
    await sql`
      CREATE TABLE IF NOT EXISTS comment_reports (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reason VARCHAR(100) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, reporter_id)
      )
    `;
    console.log('✅ comment_reports table created');
    
    // Step 5: Add foreign key constraint for hidden_by
    console.log('📋 Step 5: Adding foreign key constraint...');
    try {
      await sql`ALTER TABLE comments ADD CONSTRAINT fk_comments_hidden_by FOREIGN KEY (hidden_by) REFERENCES users(id)`;
      console.log('✅ Foreign key constraint added');
    } catch (error) {
      console.log('⚠️ Foreign key constraint may already exist:', error.message);
    }
    
    // Step 6: Create indexes
    console.log('📋 Step 6: Creating indexes...');
    
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_comments_is_reported ON comments(is_reported)`;
      console.log(`✅ Created index: idx_comments_is_reported`);
    } catch (error) {
      console.log(`⚠️ Index creation failed:`, error.message);
    }
    
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_comments_is_hidden ON comments(is_hidden)`;
      console.log(`✅ Created index: idx_comments_is_hidden`);
    } catch (error) {
      console.log(`⚠️ Index creation failed:`, error.message);
    }
    
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON comment_reports(comment_id)`;
      console.log(`✅ Created index: idx_comment_reports_comment_id`);
    } catch (error) {
      console.log(`⚠️ Index creation failed:`, error.message);
    }
    
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status)`;
      console.log(`✅ Created index: idx_comment_reports_status`);
    } catch (error) {
      console.log(`⚠️ Index creation failed:`, error.message);
    }
    
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_comment_reports_created_at ON comment_reports(created_at)`;
      console.log(`✅ Created index: idx_comment_reports_created_at`);
    } catch (error) {
      console.log(`⚠️ Index creation failed:`, error.message);
    }
    
    // Step 7: Add check constraints
    console.log('📋 Step 7: Adding constraints...');
    try {
      await sql`ALTER TABLE comment_reports ADD CONSTRAINT comment_reports_reason_check CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'offensive', 'misinformation', 'other'))`;
      console.log('✅ Added reason check constraint');
    } catch (error) {
      console.log('⚠️ Reason constraint may already exist:', error.message);
    }
    
    try {
      await sql`ALTER TABLE comment_reports ADD CONSTRAINT comment_reports_status_check CHECK (status IN ('pending', 'reviewed', 'dismissed'))`;
      console.log('✅ Added status check constraint');
    } catch (error) {
      console.log('⚠️ Status constraint may already exist:', error.message);
    }
    
    // Step 8: Update comments status constraint
    console.log('📋 Step 8: Updating comments status constraint...');
    try {
      await sql`ALTER TABLE comments ADD CONSTRAINT comments_status_check CHECK (status IN ('approved'))`;
      console.log('✅ Added new status constraint');
    } catch (error) {
      console.log('⚠️ Status constraint may already exist:', error.message);
    }
    
    // Step 9: Set default status to approved
    console.log('📋 Step 9: Setting default status...');
    try {
      await sql`ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'approved'`;
      console.log('✅ Set default status to approved');
    } catch (error) {
      console.log('⚠️ Default status update failed:', error.message);
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
    console.log('  - Database triggers will be added in future update');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runCommentsMigration(); 