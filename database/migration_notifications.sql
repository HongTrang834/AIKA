-- Migration: Create Notifications System
-- Purpose: Store and track user notifications

-- TODO: Review Due Notification needs SRS algorithm
-- Current status: Can query last_reviewed_at but need review_interval field
-- TODO: New Content Available needs lesson release tracking
-- Current status: No released_at field in lessons table yet

-- Create notifications table
CREATE TABLE
IF NOT EXISTS notifications
(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users
(id) ON
DELETE CASCADE,
  type VARCHAR(50)
NOT NULL CHECK
(type IN
('review_due', 'achievement', 'new_content', 'weekly_summary', 'conversation_ready', 'daily_reminder')),
  title VARCHAR
(255) NOT NULL,
  message TEXT NOT NULL,
  action_url VARCHAR
(255),
  action_type VARCHAR
(50), -- 'navigate_to_page', 'show_badge', etc.
  related_id INTEGER, -- id of related item (vocab_id, lesson_id, etc)
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_notifications_timestamp
()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_update_timestamp
BEFORE
UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_timestamp
();

-- TODO: Achievement unlock tracking
-- Need to create table to track milestone achievements
-- For now, milestone checking can be done on-the-fly from streak_count

CREATE TABLE
IF NOT EXISTS achievement_milestones
(
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users
(id) ON
DELETE CASCADE,
  milestone_type VARCHAR(50)
NOT NULL CHECK
(milestone_type IN
('streak_7', 'streak_14', 'streak_30', 'streak_100')),
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notification_sent BOOLEAN DEFAULT FALSE,
  UNIQUE
(user_id, milestone_type)
);

CREATE INDEX idx_achievement_milestones_user ON achievement_milestones(user_id);

-- TODO: New Content Available tracking
-- Need to add released_at field to lessons table
-- ALTER TABLE lessons ADD COLUMN released_at TIMESTAMP;
-- Then can track which lessons are new and haven't been seen by user

-- TODO: Weekly stats tracking (optional - can compute on-the-fly)
-- Could cache weekly stats to avoid repeated aggregations

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON achievement_milestones TO app_user;
