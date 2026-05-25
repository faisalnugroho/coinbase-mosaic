-- Coinbase Community Mosaic Wall - Database Schema
-- Run this in Supabase SQL Editor

-- Pixels table: one row per grid cell
CREATE TABLE IF NOT EXISTS pixels (
  id SERIAL PRIMARY KEY,
  x INTEGER NOT NULL CHECK (x >= 0 AND x < 100),
  y INTEGER NOT NULL CHECK (y >= 0 AND y < 100),
  claimed BOOLEAN DEFAULT false,
  user_id TEXT,
  username TEXT,
  display_name TEXT,
  profile_pic_url TEXT,
  message TEXT CHECK (char_length(message) <= 100),
  claimed_at TIMESTAMPTZ,
  UNIQUE(x, y),
  UNIQUE(user_id)
);

-- Index for fast grid queries
CREATE INDEX IF NOT EXISTS idx_pixels_claimed ON pixels (claimed);
CREATE INDEX IF NOT EXISTS idx_pixels_user_id ON pixels (user_id);

-- Enable RLS
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;

-- Anyone can read the grid
CREATE POLICY "Public read pixels" ON pixels
  FOR SELECT USING (true);

-- Only the user who claimed can update their pixel (enforced by user_id match)
CREATE POLICY "Owner update own pixel" ON pixels
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Anyone can insert (claim a pixel)
CREATE POLICY "Anyone can claim pixel" ON pixels
  FOR INSERT WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.claimed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pixels_updated_at
  BEFORE UPDATE ON pixels
  FOR EACH ROW
  WHEN (OLD.claimed = false AND NEW.claimed = true)
  EXECUTE FUNCTION update_updated_at();
