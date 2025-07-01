-- Insert sample users with different roles
INSERT INTO users (email, name, role) VALUES
  ('admin@company.com', 'Admin User', 'admin'),
  ('editor@company.com', 'Editor User', 'editor'),
  ('author@company.com', 'Author User', 'author'),
  ('viewer@company.com', 'Viewer User', 'viewer')
ON CONFLICT (email) DO NOTHING;

