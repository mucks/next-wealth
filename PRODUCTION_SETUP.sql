-- ============================================
-- Next Wealth - Production Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Create asset_type enum
DO $$ BEGIN
    CREATE TYPE asset_type AS ENUM ('crypto', 'stock', 'real-estate', 'cash');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create property_type enum  
DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('house', 'apartment', 'commercial', 'land', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type asset_type NOT NULL,
  purchase_date TEXT NOT NULL,
  notes TEXT,
  
  -- Crypto fields
  coin_id TEXT,
  symbol TEXT,
  quantity DECIMAL,
  current_price DECIMAL,
  price_change_24h DECIMAL,
  
  -- Real estate fields
  address TEXT,
  city TEXT,
  square_meters DECIMAL,
  price_per_sqm DECIMAL,
  property_type property_type,
  
  -- Cash fields
  amount DECIMAL,
  currency TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create price_cache table (shared across all users)
CREATE TABLE IF NOT EXISTS price_cache (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  price DECIMAL NOT NULL,
  price_change_24h DECIMAL,
  name TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON assets(user_id);
CREATE INDEX IF NOT EXISTS assets_type_idx ON assets(type);
CREATE INDEX IF NOT EXISTS price_cache_type_idx ON price_cache(type);
CREATE INDEX IF NOT EXISTS price_cache_last_updated_idx ON price_cache(last_updated);

-- Enable Row Level Security (RLS)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Users can view their own assets" ON assets;
DROP POLICY IF EXISTS "Users can insert their own assets" ON assets;
DROP POLICY IF EXISTS "Users can update their own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON assets;

-- Create policies: Users can only see their own assets
CREATE POLICY "Users can view their own assets"
  ON assets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can only insert their own assets
CREATE POLICY "Users can insert their own assets"
  ON assets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can only update their own assets
CREATE POLICY "Users can update their own assets"
  ON assets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can only delete their own assets
CREATE POLICY "Users can delete their own assets"
  ON assets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 'assets table created' as status 
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets');

SELECT 'price_cache table created' as status
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'price_cache');

