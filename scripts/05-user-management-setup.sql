-- User Management Database Setup
-- This script adds necessary fields and tables for comprehensive user management

-- Add missing fields to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create user_actions table for audit trail
CREATE TABLE IF NOT EXISTS user_actions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_user_actions_admin_id ON user_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_target_user_id ON user_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);

-- Add check constraints
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_role 
CHECK (role IN ('viewer', 'author', 'editor', 'admin'));

ALTER TABLE user_actions
ADD CONSTRAINT IF NOT EXISTS chk_user_actions_action_type
CHECK (action_type IN ('user_created', 'user_updated', 'user_deleted', 'role_changed', 'status_changed'));

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing users to have updated_at if null
UPDATE users 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Add comments for documentation
COMMENT ON TABLE user_actions IS 'Audit trail for admin actions on user accounts';
COMMENT ON COLUMN user_actions.admin_id IS 'ID of the admin who performed the action';
COMMENT ON COLUMN user_actions.target_user_id IS 'ID of the user who was affected by the action';
COMMENT ON COLUMN user_actions.action_type IS 'Type of action performed';
COMMENT ON COLUMN user_actions.details IS 'Additional details about the action in JSON format';
COMMENT ON COLUMN user_actions.ip_address IS 'IP address of the admin who performed the action';

COMMENT ON COLUMN users.is_active IS 'Whether the user account is active and can sign in';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the user''s last login';
COMMENT ON COLUMN users.updated_at IS 'Timestamp of the last update to the user record'; 