# 🚨 URGENT: Fix Stellar Token Creation

## The Issue
Your `artist_stellar_assets` table is empty, which means the database migration wasn't run.

## Step 1: Run Database Migration

**Go to your Supabase Dashboard → SQL Editor and run:**

```sql
-- Create table to store Stellar asset metadata for artist tokens
CREATE TABLE IF NOT EXISTS public.artist_stellar_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_id UUID UNIQUE REFERENCES public.artist_tokens(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL,
  issuer_public_key TEXT NOT NULL,
  distributor_public_key TEXT NOT NULL,
  issuer_secret_encrypted TEXT,
  distributor_secret_encrypted TEXT,
  network TEXT NOT NULL DEFAULT 'testnet',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.artist_stellar_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (optional - allows service role to write)
CREATE POLICY "stellar_assets_service_write" ON public.artist_stellar_assets 
  FOR ALL USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_artist_id ON public.artist_stellar_assets(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_token_id ON public.artist_stellar_assets(token_id);
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_asset_code ON public.artist_stellar_assets(asset_code);
```

## Step 2: After Running Migration

1. Go to `/wallet` in your app
2. Click **"Debug Data"** - should now show the table exists
3. Click **"Ensure Token"** - should save data to the table
4. Click **"Issue Token on Stellar"** - should work!

## Step 3: Check Your Token

After success, visit:
- **Issuer**: https://testnet.stellarchain.io/accounts/GAAAK3Y73AY2FY62KRZQDF6GICNI4ZJPDKCJDVHXMIPI4RVO45AJPUTT
- **Distributor**: https://testnet.stellarchain.io/accounts/GAPARJVGFTUMWLASMYFCL7EF2LATHACZQWV3MWFZCQAOSB5LYX7QXN76

You should see your HOLAJA tokens!
