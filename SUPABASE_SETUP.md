# Supabase Setup Instructions

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New project"
3. Choose your organization (or create one)
4. Fill in:
   - Project name: `next-wealth` (or your choice)
   - Database password: (save this somewhere safe)
   - Region: Choose closest to you
5. Click "Create new project" and wait ~2 minutes

## 2. Get Your Environment Variables

1. In your Supabase project, go to **Settings** (gear icon) → **API**
2. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Create the Database Table

1. In your Supabase project, go to **SQL Editor** (click the SQL icon)
2. Click **New query**
3. Copy and paste the SQL below:

```sql
-- Create assets table
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('crypto', 'stock', 'real-estate', 'cash')),
  purchase_date DATE NOT NULL,
  notes TEXT,
  
  -- Crypto fields
  coin_id TEXT,
  symbol TEXT,
  quantity DECIMAL,
  current_price DECIMAL,
  price_change_24h DECIMAL,
  
  -- Stock fields (shares same fields as crypto: symbol, quantity, current_price, price_change_24h)
  
  -- Real estate fields
  address TEXT,
  city TEXT,
  square_meters DECIMAL,
  price_per_sqm DECIMAL,
  property_type TEXT CHECK (property_type IN ('house', 'apartment', 'commercial', 'land', 'other') OR property_type IS NULL),
  
  -- Cash fields
  amount DECIMAL,
  currency TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX assets_user_id_idx ON assets(user_id);

-- Create index on type for filtering
CREATE INDEX assets_type_idx ON assets(type);

-- Enable Row Level Security (RLS)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own assets
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

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click **Run** (or press CMD/CTRL + Enter)
5. You should see "Success. No rows returned"

## 4. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled (it should be by default)
3. Optional: Disable "Confirm email" if you want to skip email verification during development
   - Go to **Authentication** → **Providers** → **Email**
   - Toggle off "Confirm email"
   - ⚠️ Remember to re-enable this for production!

## 5. Test Your Setup

1. Make sure your `.env.local` file has the correct values
2. Restart your Next.js dev server:
   ```bash
   # Stop the server (CTRL+C)
   # Start it again
   pnpm dev
   ```
3. Open [http://localhost:3001](http://localhost:3001)
4. Click "Sign In / Sign Up"
5. Create a new account
6. Start adding assets!

## Troubleshooting

### "Not authenticated" errors
- Make sure you're signed in
- Check that your `.env.local` file exists and has the correct values
- Restart your dev server after adding environment variables

### "Policy" errors
- Make sure you ran all the SQL commands above
- Check that Row Level Security (RLS) policies are created
- Go to **Database** → **Tables** → **assets** → **Policies** to verify

### Can't sign up
- Check Authentication settings
- Look in the browser console (F12) for detailed error messages
- Check Supabase **Authentication** → **Users** to see if the user was created

### Assets not showing
- Check browser console for errors
- Verify the assets table was created: **Database** → **Tables**
- Check that RLS policies allow SELECT for your user

## Security Notes

✅ **What's Secure:**
- Row Level Security (RLS) ensures users can only access their own data
- Authentication is handled by Supabase (secure by default)
- API keys are safe to expose (they're called "anon" public keys for a reason)

⚠️ **For Production:**
- Enable email confirmation
- Set up a custom email provider (not Supabase's default)
- Configure proper CORS settings
- Set up email templates
- Enable Multi-Factor Authentication (MFA)
- Review all RLS policies

## Next Steps

Your wealth tracker now has:
- ✅ User authentication (sign up, sign in, sign out)
- ✅ Secure data storage (each user sees only their data)
- ✅ Real-time sync (data saved immediately to the cloud)
- ✅ Multi-device support (same account works everywhere)

**Safari users:** Your data is now safe in the cloud! No more Safari clearing your localStorage. 🎉

