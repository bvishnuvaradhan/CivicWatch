-- CivicWatch Database Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'USER', -- USER, WORKER, ADMIN
    reputation_points INTEGER DEFAULT 0,
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Worker Table
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT,
    phone TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE
);

-- Issue Table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    image_url TEXT,
    severity TEXT DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    status TEXT DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comment Table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vote Table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'UP', -- UP, DOWN
    UNIQUE(issue_id, user_id)
);

-- Notification Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT, -- STATUS_CHANGE, NEW_COMMENT, etc.
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Flag Table
CREATE TABLE IF NOT EXISTS flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_issues_status_created_at ON issues (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_category_created_at ON issues (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_created_by_created_at ON issues (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_worker_status_created_at ON issues (worker_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments (issue_id);
CREATE INDEX IF NOT EXISTS idx_votes_issue_id ON votes (issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers (user_id);
CREATE INDEX IF NOT EXISTS idx_users_role_reputation_points ON users (role, reputation_points DESC);
