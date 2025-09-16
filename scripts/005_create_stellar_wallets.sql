-- Create stellar_wallets table for invisible wallet functionality
-- This table stores Stellar account information for each user

CREATE TABLE IF NOT EXISTS public.stellar_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL UNIQUE,
  secret_key_encrypted TEXT NOT NULL, -- Encrypted secret key for security
  account_id TEXT NOT NULL UNIQUE, -- Stellar account ID (same as public key)
  network TEXT NOT NULL DEFAULT 'testnet', -- 'testnet' or 'mainnet'
  is_funded BOOLEAN DEFAULT FALSE, -- Whether the account has been funded
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on stellar_wallets
ALTER TABLE public.stellar_wallets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for stellar_wallets
CREATE POLICY "stellar_wallets_select_own" ON public.stellar_wallets 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "stellar_wallets_insert_own" ON public.stellar_wallets 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "stellar_wallets_update_own" ON public.stellar_wallets 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_stellar_wallets_user_id ON public.stellar_wallets(user_id);
CREATE INDEX idx_stellar_wallets_public_key ON public.stellar_wallets(public_key);
CREATE INDEX idx_stellar_wallets_account_id ON public.stellar_wallets(account_id);

-- Note: Stellar wallet creation is handled in the application layer
-- during the signup process for better security and key management.
-- The trigger approach is not used here to avoid storing unencrypted keys.

-- Add comment explaining the table
COMMENT ON TABLE public.stellar_wallets IS 'Stores Stellar wallet information for each user. Secret keys are encrypted for security.';
COMMENT ON COLUMN public.stellar_wallets.secret_key_encrypted IS 'Encrypted Stellar secret key. Should be decrypted only when needed for transactions.';
COMMENT ON COLUMN public.stellar_wallets.network IS 'Stellar network: testnet for development, mainnet for production.';
COMMENT ON COLUMN public.stellar_wallets.is_funded IS 'Whether the Stellar account has been funded with XLM for transaction fees.';
