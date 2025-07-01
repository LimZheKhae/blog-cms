-- Migration: Update comments system to remove approval requirement and add reporting
-- This script updates the existing comments table and creates comment_reports table

-- Step 1: Remove the status constraint and set all pending comments to approved
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_status_check;

-- Update all pending comments to approved (since we're removing approval requirement)
UPDATE comments SET status = 'approved' WHERE status = 'pending';

-- Step 2: Add new columns for reporting system
ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS report_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hidden_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- Step 3: Create comment_reports table for tracking reports
CREATE TABLE IF NOT EXISTS comment_reports (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'offensive', 'misinformation', 'other')),
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, reporter_id) -- Prevent duplicate reports from same user
);

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_is_reported ON comments(is_reported);
CREATE INDEX IF NOT EXISTS idx_comments_is_hidden ON comments(is_hidden);
CREATE INDEX IF NOT EXISTS idx_comment_reports_comment_id ON comment_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reports_status ON comment_reports(status);
CREATE INDEX IF NOT EXISTS idx_comment_reports_created_at ON comment_reports(created_at);

-- Step 5: Create trigger to update comment report count
CREATE OR REPLACE FUNCTION update_comment_report_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET 
      report_count = report_count + 1,
      is_reported = TRUE
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET 
      report_count = GREATEST(report_count - 1, 0),
      is_reported = (report_count - 1) > 0
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_comment_report_count ON comment_reports;
CREATE TRIGGER trigger_update_comment_report_count
  AFTER INSERT OR DELETE ON comment_reports
  FOR EACH ROW EXECUTE FUNCTION update_comment_report_count();

-- Step 6: Update the status constraint to only allow 'approved' since we're removing approval workflow
ALTER TABLE comments 
ADD CONSTRAINT comments_status_check 
CHECK (status IN ('approved'));

-- Set default status to 'approved' for new comments
ALTER TABLE comments ALTER COLUMN status SET DEFAULT 'approved';

COMMENT ON TABLE comment_reports IS 'Stores user reports for inappropriate comments';
COMMENT ON COLUMN comments.report_count IS 'Number of times this comment has been reported';
COMMENT ON COLUMN comments.is_reported IS 'Whether this comment has been reported by users';
COMMENT ON COLUMN comments.is_hidden IS 'Whether this comment is hidden by moderators';
COMMENT ON COLUMN comments.hidden_by IS 'User ID of moderator who hid the comment';
COMMENT ON COLUMN comments.hidden_reason IS 'Reason why the comment was hidden'; 