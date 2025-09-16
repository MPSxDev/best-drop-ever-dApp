-- Create table to store Stellar asset metadata for artist tokens
-- Associates on-chain Stellar asset/accounts with app-level artist_tokens

CREATE TABLE IF NOT EXISTS public.artist_stellar_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_id UUID UNIQUE REFERENCES public.artist_tokens(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL, -- up to 12 on Stellar; we will target <=6
  issuer_public_key TEXT NOT NULL,
  distributor_public_key TEXT NOT NULL,
  issuer_secret_encrypted TEXT, -- optional, encrypted at rest
  distributor_secret_encrypted TEXT, -- optional, encrypted at rest
  network TEXT NOT NULL DEFAULT 'testnet',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.artist_stellar_assets ENABLE ROW LEVEL SECURITY;

-- Only service role should write here; by default, deny. Provide read policy for owners if desired later.

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_artist_id ON public.artist_stellar_assets(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_token_id ON public.artist_stellar_assets(token_id);
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_asset_code ON public.artist_stellar_assets(asset_code);
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_issuer ON public.artist_stellar_assets(issuer_public_key);
CREATE INDEX IF NOT EXISTS idx_artist_stellar_assets_distributor ON public.artist_stellar_assets(distributor_public_key);

COMMENT ON TABLE public.artist_stellar_assets IS 'Links artist tokens to Stellar asset/accounts. Secrets are optional and should be encrypted.';

