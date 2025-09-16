-- Migration: Create Token Marketplace Tables
-- This migration creates tables for fans to buy artist tokens on Stellar blockchain

-- Table for token listings (artists can list their tokens for sale)
CREATE TABLE token_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token_id UUID NOT NULL REFERENCES artist_tokens(id) ON DELETE CASCADE,
    stellar_asset_id UUID NOT NULL REFERENCES artist_stellar_assets(id) ON DELETE CASCADE,
    
    -- Pricing information
    price_xlm DECIMAL(20, 7) NOT NULL, -- Price per token in XLM
    total_supply BIGINT NOT NULL, -- Total tokens available for sale
    available_supply BIGINT NOT NULL, -- Remaining tokens for sale
    
    -- Listing status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_price CHECK (price_xlm > 0),
    CONSTRAINT valid_supply CHECK (available_supply <= total_supply AND available_supply >= 0)
);

-- Table for token purchases (fans buying tokens)
CREATE TABLE token_purchases (
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
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT positive_quantity CHECK (quantity > 0),
    CONSTRAINT positive_price CHECK (price_per_token_xlm > 0),
    CONSTRAINT valid_total CHECK (total_price_xlm = quantity * price_per_token_xlm)
);

-- Table for fan token balances (track what tokens fans own)
CREATE TABLE fan_token_balances (
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
    UNIQUE(fan_id, token_id),
    
    -- Constraints
    CONSTRAINT non_negative_balance CHECK (balance >= 0),
    CONSTRAINT non_negative_purchased CHECK (total_purchased >= 0)
);

-- Indexes for performance
CREATE INDEX idx_token_listings_artist ON token_listings(artist_id);
CREATE INDEX idx_token_listings_active ON token_listings(is_active) WHERE is_active = true;
CREATE INDEX idx_token_purchases_buyer ON token_purchases(buyer_id);
CREATE INDEX idx_token_purchases_listing ON token_purchases(listing_id);
CREATE INDEX idx_token_purchases_status ON token_purchases(status);
CREATE INDEX idx_fan_token_balances_fan ON fan_token_balances(fan_id);
CREATE INDEX idx_fan_token_balances_token ON fan_token_balances(token_id);

-- Row Level Security (RLS) Policies
ALTER TABLE token_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_token_balances ENABLE ROW LEVEL SECURITY;

-- Token listings policies
CREATE POLICY "Users can view active token listings" ON token_listings
    FOR SELECT USING (is_active = true);

CREATE POLICY "Artists can manage their own listings" ON token_listings
    FOR ALL USING (artist_id = auth.uid());

CREATE POLICY "Service role can manage all listings" ON token_listings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Token purchases policies  
CREATE POLICY "Users can view their own purchases" ON token_purchases
    FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can create purchases" ON token_purchases
    FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Service role can manage all purchases" ON token_purchases
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Fan token balances policies
CREATE POLICY "Users can view their own balances" ON fan_token_balances
    FOR SELECT USING (fan_id = auth.uid());

CREATE POLICY "Service role can manage all balances" ON fan_token_balances
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_token_listings_updated_at BEFORE UPDATE ON token_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_token_purchases_updated_at BEFORE UPDATE ON token_purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fan_token_balances_updated_at BEFORE UPDATE ON fan_token_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
