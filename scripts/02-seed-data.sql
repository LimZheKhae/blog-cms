-- Insert sample users with different roles
INSERT INTO users (email, name, role) VALUES
  ('admin@company.com', 'Admin User', 'admin'),
  ('editor@company.com', 'Editor User', 'editor'),
  ('author@company.com', 'Author User', 'author'),
  ('viewer@company.com', 'Viewer User', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (title, slug, content, excerpt, status, author_id) VALUES
  ('Welcome to Our Company Blog', 'welcome-to-company-blog', 
   '<h2>Welcome to Our Internal Blog</h2><p>This is our new company blog where we share updates, insights, and collaborate on ideas.</p>', 
   'Welcome to our new company blog platform', 'published', 2),
  ('Getting Started Guide', 'getting-started-guide',
   '<h2>Getting Started</h2><p>Here''s how to make the most of our blog platform...</p>',
   'A comprehensive guide to using our blog platform', 'published', 3),
  ('Draft Post Example', 'draft-post-example',
   '<h2>This is a Draft</h2><p>This post is still being worked on...</p>',
   'An example of a draft post', 'draft', 3)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample comments
INSERT INTO comments (content, status, post_id, author_id) VALUES
  ('Great post! Looking forward to more content.', 'approved', 1, 4),
  ('This is very helpful, thank you!', 'approved', 2, 4),
  ('Pending comment for moderation', 'pending', 1, 4)
ON CONFLICT DO NOTHING;
