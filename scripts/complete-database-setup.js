const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function completeSetup() {
  try {
    // Initialize database connection
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🚀 Starting complete database setup...');
    
    // ========================================
    // STEP 1: CREATE TABLES
    // ========================================
    console.log('\n📋 Creating database tables...');
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'author', 'viewer')),
        image TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Users table created');
    
    // Create posts table
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
    console.log('✅ Posts table created');
    
    // Create comments table
    await sql`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Comments table created');

    // Create post_views table
    await sql`
      CREATE TABLE IF NOT EXISTS post_views (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address INET,
        user_agent TEXT,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id, ip_address)
      )
    `;
    console.log('✅ Post views table created');

    // Create post_likes table
    await sql`
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(post_id, user_id)
      )
    `;
    console.log('✅ Post likes table created');
    
    // Create indexes
    console.log('📋 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON post_views(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id)`;
    console.log('✅ Indexes created');
    
    // ========================================
    // STEP 2: SEED USERS
    // ========================================
    console.log('\n🌱 Seeding users...');
    await sql`
      INSERT INTO users (email, name, role) VALUES
        ('admin@company.com', 'Admin User', 'admin'),
        ('editor@company.com', 'Editor User', 'editor'),
        ('author@company.com', 'Author User', 'author'),
        ('viewer@company.com', 'Viewer User', 'viewer'),
        ('john.smith@company.com', 'John Smith', 'author')
      ON CONFLICT (email) DO NOTHING
    `;
    console.log('✅ Users seeded');
    
    // ========================================
    // STEP 3: SEED ENHANCED POSTS
    // ========================================
    console.log('\n📝 Seeding enhanced blog posts...');
    
    // Enhanced posts with rich content
    const enhancedPosts = [
      {
        title: 'The Future of Web Development: Trends to Watch in 2024',
        slug: 'future-web-development-trends-2024',
        content: `<h1>Introduction</h1>
<p>The web development landscape is constantly evolving, and 2024 promises to be a year of significant transformation. From artificial intelligence integration to new architectural patterns, developers are witnessing unprecedented changes that will shape how we build and interact with web applications.</p>

<h2>The Rise of AI-Powered Development</h2>
<p>Artificial Intelligence is no longer just a buzzword—it's becoming an integral part of the development workflow. <strong>GitHub Copilot</strong>, <strong>ChatGPT</strong>, and other AI tools are revolutionizing how developers write code, debug issues, and even architect solutions.</p>

<h3>Key AI Integration Points:</h3>
<ul>
  <li><strong>Code Generation</strong>: AI can generate boilerplate code, saving hours of development time</li>
  <li><strong>Bug Detection</strong>: Advanced static analysis powered by machine learning</li>
  <li><strong>Performance Optimization</strong>: AI-driven suggestions for code improvements</li>
  <li><strong>Documentation</strong>: Automated generation of comprehensive documentation</li>
</ul>

<h2>Modern JavaScript Frameworks</h2>
<p>The JavaScript ecosystem continues to mature with frameworks focusing on performance and developer experience.</p>

<img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop" alt="Web Development" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<h2>Conclusion</h2>
<p>The future of web development is bright, with AI augmentation, improved frameworks, and new technologies paving the way for more powerful and efficient web applications.</p>

<blockquote>
  <p>Developers who embrace these trends will be well-positioned to build the next generation of web experiences.</p>
</blockquote>`,
        excerpt: 'Explore the cutting-edge trends that will shape web development in 2024, from AI integration to new frameworks and revolutionary technologies.',
        status: 'published',
        author_id: 2,
        tags: ['JavaScript', 'React', 'AI', 'WebDev', '2024', 'Technology'],
        reading_time: 8,
        views_count: 1234,
        likes_count: 89
      },
      {
        title: 'Building Scalable React Applications',
        slug: 'building-scalable-react-applications',
        content: `<h1>Building Scalable React Applications</h1>
<p>As React applications grow in complexity, it becomes crucial to implement proper architectural patterns and best practices to ensure maintainability and performance.</p>

<h2>Component Architecture</h2>
<p>The foundation of any scalable React application lies in its component architecture. Here are the key principles:</p>

<ul>
  <li><strong>Single Responsibility</strong>: Each component should have one clear purpose</li>
  <li><strong>Composition over Inheritance</strong>: Use composition to build complex UIs</li>
  <li><strong>Props Interface Design</strong>: Design clear and minimal prop interfaces</li>
</ul>

<h2>State Management</h2>
<p>For large applications, proper state management is essential. Consider these approaches:</p>

<ol>
  <li><strong>Local State</strong>: Use useState for component-specific state</li>
  <li><strong>Context API</strong>: For sharing state across component trees</li>
  <li><strong>External Libraries</strong>: Redux, Zustand, or Jotai for complex state</li>
</ol>

<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop" alt="React Development" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<blockquote>
  <p>Write tests that give you confidence, not just coverage.</p>
</blockquote>`,
        excerpt: 'Learn the best practices and architectural patterns for building large-scale React applications that grow with your team and user base.',
        status: 'published',
        author_id: 3,
        tags: ['React', 'JavaScript', 'Architecture', 'Performance', 'Testing', 'Frontend'],
        reading_time: 12,
        views_count: 856,
        likes_count: 67
      },
      {
        title: 'Design Systems: Creating Consistency at Scale',
        slug: 'design-systems-consistency-scale',
        content: `<h1>Design Systems: Creating Consistency at Scale</h1>
<p>In today's multi-platform world, maintaining design consistency across products is more challenging than ever. Design systems provide the solution.</p>

<h2>What is a Design System?</h2>
<p>A design system is a collection of reusable components, guided by clear standards, that can be assembled together to build any number of applications.</p>

<h3>Core Components of a Design System:</h3>
<ul>
  <li><strong>Design Tokens</strong>: Colors, typography, spacing, and other visual properties</li>
  <li><strong>Component Library</strong>: Reusable UI components with consistent behavior</li>
  <li><strong>Documentation</strong>: Guidelines on when and how to use components</li>
  <li><strong>Tools & Resources</strong>: Figma libraries, code repositories, and design assets</li>
</ul>

<img src="https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=400&fit=crop" alt="Design System" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<blockquote>
  <p>The best design system is the one that gets used. Focus on adoption over perfection.</p>
</blockquote>`,
        excerpt: 'How to build and maintain design systems that ensure consistency across your entire product ecosystem while enabling teams to move fast.',
        status: 'published',
        author_id: 2,
        tags: ['Design', 'UI/UX', 'Systems', 'Frontend', 'Consistency', 'Scalability'],
        reading_time: 10,
        views_count: 743,
        likes_count: 52
      },
      {
        title: 'Advanced TypeScript Patterns for React Developers',
        slug: 'advanced-typescript-patterns-react',
        content: `<h1>Advanced TypeScript Patterns for React Developers</h1>
<p>TypeScript has become essential for building robust React applications. Let's explore advanced patterns that will level up your development experience.</p>

<h2>Generic Components</h2>
<p>Create flexible, reusable components with generics:</p>

<pre><code class="language-typescript">interface ListProps&lt;T&gt; {
  items: T[];
  renderItem: (item: T) =&gt; React.ReactNode;
  keyExtractor: (item: T) =&gt; string;
}</code></pre>

<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop" alt="TypeScript Code" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<blockquote>
  <p>TypeScript's type system is incredibly powerful. The key is to start simple and gradually adopt more advanced patterns as your needs grow.</p>
</blockquote>`,
        excerpt: 'Master advanced TypeScript patterns to build more robust and maintainable React applications with better developer experience.',
        status: 'published',
        author_id: 3,
        tags: ['TypeScript', 'React', 'Advanced', 'Patterns', 'Development', 'Types'],
        reading_time: 15,
        views_count: 634,
        likes_count: 43
      },
      {
        title: 'Modern CSS Techniques for 2024',
        slug: 'modern-css-techniques-2024',
        content: `<h1>Modern CSS Techniques for 2024</h1>
<p>CSS continues to evolve rapidly. Here are the cutting-edge techniques you should know in 2024.</p>

<h2>Container Queries</h2>
<p>Finally, we can style components based on their container size, not just the viewport:</p>

<pre><code class="language-css">.card-container {
  container-type: inline-size;
}</code></pre>

<img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop" alt="CSS Code" class="max-w-full h-auto rounded-lg shadow-md my-4" />

<blockquote>
  <p>These new CSS features reduce the need for preprocessors and JavaScript solutions, making CSS more powerful and maintainable.</p>
</blockquote>`,
        excerpt: 'Discover the latest CSS features and techniques that are revolutionizing how we style modern web applications in 2024.',
        status: 'draft',
        author_id: 2,
        tags: ['CSS', 'Modern', 'Techniques', '2024', 'Frontend', 'Styling'],
        reading_time: 7,
        views_count: 0,
        likes_count: 0
      }
    ];

    // Insert each post
    for (const post of enhancedPosts) {
      try {
        await sql`
          INSERT INTO posts (title, slug, content, excerpt, status, author_id, tags, reading_time_minutes, views_count, likes_count)
          VALUES (${post.title}, ${post.slug}, ${post.content}, ${post.excerpt}, ${post.status}, ${post.author_id}, ${post.tags}, ${post.reading_time}, ${post.views_count}, ${post.likes_count})
          ON CONFLICT (slug) DO NOTHING
        `;
        console.log(`✅ Post "${post.title}" inserted`);
      } catch (error) {
        console.log(`⚠️  Post "${post.title}" skipped:`, error.message);
      }
    }
    
    // ========================================
    // STEP 4: SEED VIEWS, LIKES, AND COMMENTS
    // ========================================
    console.log('\n👁️ Seeding post views...');
    const viewsData = [
      [1, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'],
      [1, 2, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'],
      [1, 3, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'],
      [1, 4, '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'],
      [2, 1, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'],
      [2, 4, '192.168.1.103', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'],
      [3, 2, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'],
      [3, 3, '192.168.1.102', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36']
    ];

    for (const [postId, userId, ip, userAgent] of viewsData) {
      try {
        await sql`
          INSERT INTO post_views (post_id, user_id, ip_address, user_agent)
          VALUES (${postId}, ${userId}, ${ip}, ${userAgent})
          ON CONFLICT DO NOTHING
        `;
      } catch (error) {
        // Ignore conflicts
      }
    }
    console.log('✅ Post views seeded');

    console.log('❤️ Seeding post likes...');
    const likesData = [
      [1, 1], [1, 2], [1, 3], [1, 4],
      [2, 1], [2, 4],
      [3, 2], [3, 3],
      [4, 2], [4, 3]
    ];

    for (const [postId, userId] of likesData) {
      try {
        await sql`
          INSERT INTO post_likes (post_id, user_id)
          VALUES (${postId}, ${userId})
          ON CONFLICT DO NOTHING
        `;
      } catch (error) {
        // Ignore conflicts
      }
    }
    console.log('✅ Post likes seeded');

    console.log('💬 Seeding comments...');
    const comments = [
      {
        content: 'This is an excellent overview of the current web development landscape! The section on AI-powered development particularly resonates with my recent experience using GitHub Copilot.',
        status: 'approved',
        post_id: 1,
        author_id: 4
      },
      {
        content: 'Great insights on React architecture! I\'ve been struggling with state management in our large application, and your suggestions are very helpful.',
        status: 'approved',
        post_id: 2,
        author_id: 1
      },
      {
        content: 'The component composition patterns you described are exactly what we need for our design system. Thank you for the practical examples!',
        status: 'approved',
        post_id: 2,
        author_id: 4
      },
      {
        content: 'As a designer working closely with developers, this article perfectly captures the challenges we face with design systems.',
        status: 'approved',
        post_id: 3,
        author_id: 1
      },
      {
        content: 'Love the practical examples in this post. TypeScript\'s type system is indeed incredibly powerful when used correctly.',
        status: 'approved',
        post_id: 4,
        author_id: 2
      }
    ];

    for (const comment of comments) {
      try {
        await sql`
          INSERT INTO comments (content, status, post_id, author_id)
          VALUES (${comment.content}, ${comment.status}, ${comment.post_id}, ${comment.author_id})
        `;
      } catch (error) {
        // Ignore errors
      }
    }
    console.log('✅ Comments seeded');

    // ========================================
    // STEP 5: UPDATE COUNTS
    // ========================================
    console.log('\n🔄 Updating post counts...');
    await sql`
      UPDATE posts SET 
        views_count = COALESCE((SELECT COUNT(*) FROM post_views WHERE post_views.post_id = posts.id), 0),
        likes_count = COALESCE((SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id), 0)
    `;
    console.log('✅ Post counts updated');

    // ========================================
    // STEP 6: SHOW SUMMARY
    // ========================================
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📊 Final Summary:');
    
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

    console.log('\n📧 Sample user accounts:');
    console.log('- admin@company.com (Admin)');
    console.log('- editor@company.com (Editor)');
    console.log('- author@company.com (Author)');
    console.log('- viewer@company.com (Viewer)');
    console.log('- john.smith@company.com (Author)');
    
    console.log('\n✨ Your blog CMS is ready with realistic content!');
    
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    process.exit(1);
  }
}

// Run the complete setup
completeSetup(); 