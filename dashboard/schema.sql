-- CookieCrush™ Database Schema
-- Tracks cookies and crushing activity

CREATE TABLE IF NOT EXISTS cookies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  domain TEXT NOT NULL,
  cookie_name TEXT NOT NULL,
  cookie_type TEXT CHECK(cookie_type IN ('first-party', 'third-party')),
  purpose TEXT,  -- analytics, advertising, identifier, etc
  is_secure INTEGER DEFAULT 0,
  is_httponly INTEGER DEFAULT 0,
  samesite INTEGER,
  has_value INTEGER DEFAULT 1,
  machine TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cookies_domain ON cookies(domain);
CREATE INDEX IF NOT EXISTS idx_cookies_timestamp ON cookies(timestamp);
CREATE INDEX IF NOT EXISTS idx_cookies_purpose ON cookies(purpose);

CREATE TABLE IF NOT EXISTS crushes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  domain TEXT NOT NULL,
  cookie_name TEXT NOT NULL,
  machine TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crushes_timestamp ON crushes(timestamp);
