-- Migration script to add password authentication
-- Add password_hash column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Update demo users with hashed password for "Abcd1234"
-- Using bcrypt hash for "Abcd1234" with salt rounds 12
UPDATE users SET password_hash = '$2b$12$9fawd07uSEuQiJfAcrkvledmy60DH6tC5xEI4tvg33lIuw7cjDbzO' WHERE id = 1; -- admin@company.com
UPDATE users SET password_hash = '$2b$12$9fawd07uSEuQiJfAcrkvledmy60DH6tC5xEI4tvg33lIuw7cjDbzO' WHERE id = 2; -- editor@company.com  
UPDATE users SET password_hash = '$2b$12$9fawd07uSEuQiJfAcrkvledmy60DH6tC5xEI4tvg33lIuw7cjDbzO' WHERE id = 3; -- author@company.com
UPDATE users SET password_hash = '$2b$12$9fawd07uSEuQiJfAcrkvledmy60DH6tC5xEI4tvg33lIuw7cjDbzO' WHERE id = 4; -- viewer@company.com

-- Note: OAuth users (Google, Microsoft) will have password_hash as NULL
-- This allows them to sign in without passwords while credential users need passwords 