const { neon } = require('@neondatabase/serverless');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    console.log('🔧 Setting up database...');
    
    // Create users table
    console.log('📋 Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'author', 'viewer')),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create posts table
    console.log('📋 Creating posts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        tags TEXT[],
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        views_count INTEGER DEFAULT 0,
        likes_count INTEGER DEFAULT 0,
        reading_time_minutes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // Create comments table
    console.log('📋 Creating comments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create post_views table
    console.log('📋 Creating post_views table...');
    await sql`
      CREATE TABLE IF NOT EXISTS post_views (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address INET,
        user_agent TEXT,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create post_likes table
    console.log('📋 Creating post_likes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `;
    
    // Create indexes
    console.log('📋 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_views_count ON posts(views_count)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON post_views(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON post_views(viewed_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id)`;
    
    console.log('✅ Tables created successfully');
    
    // Insert sample users
    console.log('🌱 Seeding users...');
    await sql`
      INSERT INTO users (email, name, role) VALUES
        ('admin@company.com', 'Admin User', 'admin'),
        ('editor@company.com', 'Editor User', 'editor'),
        ('author@company.com', 'Author User', 'author'),
        ('viewer@company.com', 'Viewer User', 'viewer')
      ON CONFLICT (email) DO NOTHING
    `;
    
    // Insert sample posts
    console.log('🌱 Seeding posts...');
    await sql`
      INSERT INTO posts (title, slug, content, excerpt, tags, status, author_id, views_count, likes_count, reading_time_minutes) VALUES
        ('Welcome to Our Company Blog', 'welcome-to-company-blog', 
         '<h2>Welcome to Our Internal Blog</h2><p>This is our new company blog where we share updates, insights, and collaborate on ideas.</p>', 
         'Welcome to our new company blog platform', ARRAY['welcome', 'announcement', 'company'], 'published', 2, 1234, 89, 3),
        ('Getting Started Guide', 'getting-started-guide',
         '<h2>Getting Started</h2><p>Here''s how to make the most of our blog platform...</p>',
         'A comprehensive guide to using our blog platform', ARRAY['guide', 'tutorial', 'help'], 'published', 3, 567, 45, 8),
        ('Draft Post Example', 'draft-post-example',
         '<h2>This is a Draft</h2><p>This post is still being worked on...</p>',
         'An example of a draft post', ARRAY['draft', 'example'], 'draft', 3, 12, 2, 2)
      ON CONFLICT (slug) DO NOTHING
    `;
    
    // Insert sample comments
    console.log('🌱 Seeding comments...');
    await sql`
      INSERT INTO comments (content, status, post_id, author_id) VALUES
        ('Great post! Looking forward to more content.', 'approved', 1, 4),
        ('This is very helpful, thank you!', 'approved', 2, 4),
        ('Pending comment for moderation', 'pending', 1, 4)
    `;

    // Insert sample post likes
    console.log('🌱 Seeding post likes...');
    await sql`
      INSERT INTO post_likes (post_id, user_id) VALUES
        (1, 1), (1, 3), (1, 4),
        (2, 2), (2, 4)
      ON CONFLICT (post_id, user_id) DO NOTHING
    `;

    // Insert sample post views
    console.log('🌱 Seeding post views...');
    await sql`
      INSERT INTO post_views (post_id, user_id, viewed_at) VALUES
        (1, 1, NOW() - INTERVAL '1 day'),
        (1, 2, NOW() - INTERVAL '2 hours'),
        (1, 3, NOW() - INTERVAL '30 minutes'),
        (1, 4, NOW() - INTERVAL '15 minutes'),
        (2, 2, NOW() - INTERVAL '3 hours'),
        (2, 4, NOW() - INTERVAL '1 hour')
    `;
    
    console.log('✅ Data seeded successfully');
    
    console.log('🎉 Database setup complete!');
    console.log('\n📧 Sample user accounts:');
    console.log('- admin@company.com (Admin)');
    console.log('- editor@company.com (Editor)');
    console.log('- author@company.com (Author)');
    console.log('- viewer@company.com (Viewer)');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase(); 