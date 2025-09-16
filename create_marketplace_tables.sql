-- Simple marketplace tables for testing
-- Run this in your Supabase SQL editor

-- Create token_listings table
CREATE TABLE IF NOT EXISTS token_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES artist_tokens(id) ON DELETE CASCADE,
    stellar_asset_id UUID NOT NULL REFERENCES artist_stellar_assets(id) ON DELETE CASCADE,
    
    -- Pricing information
    price_xlm DECIMAL(20, 7) NOT NULL DEFAULT 0.1,
    total_supply BIGINT NOT NULL DEFAULT 1000,
    available_supply BIGINT NOT NULL DEFAULT 1000,
    
    -- Listing status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create token_purchases table
CREATE TABLE IF NOT EXISTS token_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES token_listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Purchase details
    quantity BIGINT NOT NULL,
    price_per_token_xlm DECIMAL(20, 7) NOT NULL,
    total_price_xlm DECIMAL(20, 7) NOT NULL,
    
    -- Stellar transaction details
    stellar_transaction_hash VARCHAR(64),
    stellar_operation_id VARCHAR(32),
    
    -- Purchase status
    status VARCHAR(20) DEFAULT 'pending',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fan_token_balances table
CREATE TABLE IF NOT EXISTS fan_token_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES artist_tokens(id) ON DELETE CASCADE,
    stellar_asset_id UUID NOT NULL REFERENCES artist_stellar_assets(id) ON DELETE CASCADE,
    
    -- Balance information
    balance BIGINT DEFAULT 0,
    total_purchased BIGINT DEFAULT 0,
    average_purchase_price_xlm DECIMAL(20, 7) DEFAULT 0,
    
    -- Stellar trustline status
    has_trustline BOOLEAN DEFAULT false,
    trustline_created_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one balance record per fan per token
    UNIQUE(fan_id, token_id)
);

-- Enable RLS on all tables
ALTER TABLE token_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;  
ALTER TABLE fan_token_balances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view active token listings" ON token_listings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Artists can manage their own listings" ON token_listings
    FOR ALL USING (artist_id = auth.uid());

CREATE POLICY "Users can view their own purchases" ON token_purchases
    FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can create purchases" ON token_purchases
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can view their own balances" ON fan_token_balances
    FOR SELECT USING (fan_id = auth.uid());

-- Create a sample token listing for testing
-- This will create a listing for the HOLAJA token
INSERT INTO token_listings (artist_id, token_id, stellar_asset_id, price_xlm, total_supply, available_supply)
SELECT 
    'eb2b6187-5093-47e0-95a1-bc6e67d724a8'::UUID as artist_id,
    'e550090a-87d7-404c-be6f-9e56535770b7'::UUID as token_id,
    '09e5639e-bc38-41e1-afad-e349918fc569'::UUID as stellar_asset_id,
    0.1 as price_xlm,
    10000 as total_supply,
    10000 as available_supply
WHERE NOT EXISTS (
    SELECT 1 FROM token_listings 
    WHERE token_id = 'e550090a-87d7-404c-be6f-9e56535770b7'::UUID
);
