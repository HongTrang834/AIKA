-- Add role column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';

-- Create admin user (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) 
VALUES ('admin', 'admin@aika.com', '$2a$10$mxX6OR4XJQ/MVnjBk3RMzuoSWFzDTEhVduXccoh505nAC6mA/LRnO', 'System Admin', 'admin')
ON CONFLICT (email) DO NOTHING;
