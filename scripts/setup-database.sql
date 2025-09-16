-- Complete database setup script for BestDropsever dApp
-- This script combines all migrations in the correct order

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create all tables
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text UNIQUE NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('DJ','FAN')),
  bio text,
  link text,
  avatar_url text,
  cover_url text,
  primary_genre text,
  member_since date DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Modify the user_id column to allow NULL values for demo profiles
-- This allows us to create demo profiles without requiring auth users
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  media_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Create artist_tokens table
CREATE TABLE IF NOT EXISTS public.artist_tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  symbol text UNIQUE NOT NULL,
  display_name text NOT NULL,
  price numeric(12,4) NOT NULL DEFAULT 1.00,
  created_at timestamptz DEFAULT now()
);

-- Create holdings table
CREATE TABLE IF NOT EXISTS public.holdings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_id uuid REFERENCES public.artist_tokens(id) ON DELETE CASCADE,
  amount numeric(18,6) NOT NULL DEFAULT 0,
  UNIQUE (owner_id, token_id),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  token_id uuid REFERENCES public.artist_tokens(id) ON DELETE SET NULL,
  quantity numeric(18,6) NOT NULL,
  unit_price numeric(12,4) NOT NULL,
  total numeric(14,4) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  type text NOT NULL CHECK (type IN ('BUY','SELL')),
  created_at timestamptz DEFAULT now()
);

-- Create rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  required_amount numeric(18,6) NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create user_rewards table
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id uuid REFERENCES public.rewards(id) ON DELETE CASCADE,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE (user_id, reward_id)
);

-- Create certifications_catalog table
CREATE TABLE IF NOT EXISTS public.certifications_catalog (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  icon_url text
);

-- Create artist_certifications table
CREATE TABLE IF NOT EXISTS public.artist_certifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  cert_id uuid REFERENCES public.certifications_catalog(id) ON DELETE CASCADE,
  awarded_at timestamptz DEFAULT now(),
  UNIQUE (artist_id, cert_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  ref_id uuid,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created_at ON public.comments (post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_created_at ON public.transactions (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_handle ON public.profiles (handle);

-- 3. Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
DROP POLICY IF EXISTS "posts_select_all" ON public.posts;
CREATE POLICY "posts_select_all" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "posts_insert_own" ON public.posts;
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
);

DROP POLICY IF EXISTS "posts_update_own" ON public.posts;
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
);

DROP POLICY IF EXISTS "posts_delete_own" ON public.posts;
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
);

-- Comments policies
DROP POLICY IF EXISTS "comments_select_all" ON public.comments;
CREATE POLICY "comments_select_all" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
);

DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
);

DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = author_id)
);

-- Follows policies
DROP POLICY IF EXISTS "follows_select_all" ON public.follows;
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT USING (true);

DROP POLICY IF EXISTS "follows_insert_own" ON public.follows;
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = follower_id)
);

DROP POLICY IF EXISTS "follows_delete_own" ON public.follows;
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = follower_id)
);

-- Artist tokens policies (public read, owner can manage)
DROP POLICY IF EXISTS "artist_tokens_select_all" ON public.artist_tokens;
CREATE POLICY "artist_tokens_select_all" ON public.artist_tokens FOR SELECT USING (true);

DROP POLICY IF EXISTS "artist_tokens_insert_own" ON public.artist_tokens;
CREATE POLICY "artist_tokens_insert_own" ON public.artist_tokens FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = artist_id)
);

DROP POLICY IF EXISTS "artist_tokens_update_own" ON public.artist_tokens;
CREATE POLICY "artist_tokens_update_own" ON public.artist_tokens FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = artist_id)
);

-- Holdings policies (owner can see their own)
DROP POLICY IF EXISTS "holdings_select_own" ON public.holdings;
CREATE POLICY "holdings_select_own" ON public.holdings FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

DROP POLICY IF EXISTS "holdings_insert_own" ON public.holdings;
CREATE POLICY "holdings_insert_own" ON public.holdings FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

DROP POLICY IF EXISTS "holdings_update_own" ON public.holdings;
CREATE POLICY "holdings_update_own" ON public.holdings FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = owner_id)
);

-- Transactions policies (buyer can see their own)
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = buyer_id)
);

DROP POLICY IF EXISTS "transactions_insert_own" ON public.transactions;
CREATE POLICY "transactions_insert_own" ON public.transactions FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = buyer_id)
);

-- Rewards policies (public read, artist can manage their own)
DROP POLICY IF EXISTS "rewards_select_all" ON public.rewards;
CREATE POLICY "rewards_select_all" ON public.rewards FOR SELECT USING (true);

DROP POLICY IF EXISTS "rewards_insert_own" ON public.rewards;
CREATE POLICY "rewards_insert_own" ON public.rewards FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = artist_id)
);

DROP POLICY IF EXISTS "rewards_update_own" ON public.rewards;
CREATE POLICY "rewards_update_own" ON public.rewards FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = artist_id)
);

DROP POLICY IF EXISTS "rewards_delete_own" ON public.rewards;
CREATE POLICY "rewards_delete_own" ON public.rewards FOR DELETE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = artist_id)
);

-- User rewards policies (user can see their own)
DROP POLICY IF EXISTS "user_rewards_select_own" ON public.user_rewards;
CREATE POLICY "user_rewards_select_own" ON public.user_rewards FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id)
);

DROP POLICY IF EXISTS "user_rewards_insert_own" ON public.user_rewards;
CREATE POLICY "user_rewards_insert_own" ON public.user_rewards FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id)
);

-- Certifications catalog policies (public read)
DROP POLICY IF EXISTS "certifications_catalog_select_all" ON public.certifications_catalog;
CREATE POLICY "certifications_catalog_select_all" ON public.certifications_catalog FOR SELECT USING (true);

-- Artist certifications policies (public read, artist can manage their own)
DROP POLICY IF EXISTS "artist_certifications_select_all" ON public.artist_certifications;
CREATE POLICY "artist_certifications_select_all" ON public.artist_certifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "artist_certifications_insert_own" ON public.artist_certifications;
CREATE POLICY "artist_certifications_insert_own" ON public.artist_certifications FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = artist_id)
);

-- Notifications policies (user can see their own)
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id)
);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id)
);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (
  auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id)
);

-- 5. Insert initial data
-- Insert certifications catalog
INSERT INTO public.certifications_catalog (code, title, description, icon_url) VALUES
('GOLD_RECORD', 'Gold Record', 'Achieved gold record status', '/icons/gold-record.svg'),
('PLATINUM_RECORD', 'Platinum Record', 'Achieved platinum record status', '/icons/platinum-record.svg'),
('ONE_MILLION_VIEWS', '1M Views', 'Reached one million views', '/icons/million-views.svg'),
('SOLD_OUT_EVENT', 'Sold Out Event', 'Sold out a major event', '/icons/sold-out.svg'),
('BEST_NEW_ARTIST', 'Best New Artist', 'Recognized as best new artist', '/icons/best-new-artist.svg')
ON CONFLICT (code) DO NOTHING;

-- Create comprehensive test profiles with realistic data
-- Note: These profiles will be created without user_id references for demo purposes
-- In production, profiles should be created when users register through auth.users

-- Insert test DJ profiles (without user_id for demo)
INSERT INTO public.profiles (
  user_id,
  handle,
  display_name,
  role,
  bio,
  link,
  avatar_url,
  primary_genre,
  member_since
) VALUES 
-- DJ Profile 1: Electronic Music Producer
(
  NULL, -- No auth user for demo
  'dj_nexus',
  'DJ Nexus',
  'DJ',
  'Electronic music producer from Miami. Specializing in progressive house and techno. 10+ years in the scene.',
  'https://soundcloud.com/djnexus',
  '/placeholder.svg?height=200&width=200',
  'Electronic',
  '2020-03-15'
),
-- DJ Profile 2: Hip Hop Artist
(
  NULL, -- No auth user for demo
  'mc_flow',
  'MC Flow',
  'DJ',
  'Hip hop artist and producer. Bringing fresh beats to the underground scene. Always pushing boundaries.',
  'https://spotify.com/mcflow',
  '/placeholder.svg?height=200&width=200',
  'Hip Hop',
  '2019-08-22'
),
-- DJ Profile 3: House Music DJ
(
  NULL, -- No auth user for demo
  'house_vibes',
  'House Vibes',
  'DJ',
  'Deep house and tech house DJ. Playing at clubs worldwide. Music is my passion, dancing is my language.',
  'https://mixcloud.com/housevibes',
  '/placeholder.svg?height=200&width=200',
  'House',
  '2021-01-10'
)
ON CONFLICT (handle) DO NOTHING;

-- Insert test FAN profiles (without user_id for demo)
INSERT INTO public.profiles (
  user_id,
  handle,
  display_name,
  role,
  bio,
  member_since
) VALUES 
-- Fan Profile 1: Music Enthusiast
(
  NULL, -- No auth user for demo
  'music_lover_23',
  'Sarah Chen',
  'FAN',
  'Music enthusiast and festival goer. Love discovering new artists and supporting underground talent.',
  '2022-06-18'
),
-- Fan Profile 2: Electronic Music Fan
(
  NULL, -- No auth user for demo
  'rave_kid',
  'Alex Rodriguez',
  'FAN',
  'Electronic music addict. Been to 50+ festivals. Always looking for the next big drop.',
  '2021-11-05'
),
-- Fan Profile 3: Hip Hop Supporter
(
  NULL, -- No auth user for demo
  'beats_collector',
  'Jordan Smith',
  'FAN',
  'Hip hop head and vinyl collector. Supporting independent artists since day one.',
  '2020-09-12'
)
ON CONFLICT (handle) DO NOTHING;

-- Create artist tokens for DJ profiles
INSERT INTO public.artist_tokens (
  artist_id,
  symbol,
  display_name,
  price
) 
SELECT 
  p.id,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN 'NEXUS'
    WHEN p.handle = 'mc_flow' THEN 'FLOW'
    WHEN p.handle = 'house_vibes' THEN 'HOUSE'
  END,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN 'Nexus Token'
    WHEN p.handle = 'mc_flow' THEN 'Flow Token'
    WHEN p.handle = 'house_vibes' THEN 'House Token'
  END,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN 2.50
    WHEN p.handle = 'mc_flow' THEN 1.75
    WHEN p.handle = 'house_vibes' THEN 3.00
  END
FROM public.profiles p
WHERE p.role = 'DJ' AND p.handle IN ('dj_nexus', 'mc_flow', 'house_vibes')
ON CONFLICT (symbol) DO NOTHING;

-- Create some sample posts for the DJ profiles
INSERT INTO public.posts (
  author_id,
  content,
  media_url
)
SELECT 
  p.id,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN 'Just dropped my latest track "Midnight Pulse" 🎵 What do you think of this progressive house vibe?'
    WHEN p.handle = 'mc_flow' THEN 'Working on some fire beats in the studio tonight 🔥 New album coming soon!'
    WHEN p.handle = 'house_vibes' THEN 'Amazing set at Club Neon last night! The energy was incredible 💫'
  END,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN '/placeholder.svg?height=400&width=600'
    WHEN p.handle = 'mc_flow' THEN '/placeholder.svg?height=400&width=600'
    WHEN p.handle = 'house_vibes' THEN '/placeholder.svg?height=400&width=600'
  END
FROM public.profiles p
WHERE p.role = 'DJ' AND p.handle IN ('dj_nexus', 'mc_flow', 'house_vibes');

-- Create follow relationships (fans following DJs)
INSERT INTO public.follows (follower_id, following_id)
SELECT 
  fan.id as follower_id,
  dj.id as following_id
FROM public.profiles fan
CROSS JOIN public.profiles dj
WHERE fan.role = 'FAN' 
  AND dj.role = 'DJ'
  AND fan.handle IN ('music_lover_23', 'rave_kid')
  AND dj.handle IN ('dj_nexus', 'house_vibes')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Create some sample rewards for DJ profiles
INSERT INTO public.rewards (
  artist_id,
  title,
  description,
  required_amount
)
SELECT 
  p.id,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN 'Exclusive Track Access'
    WHEN p.handle = 'mc_flow' THEN 'Studio Session Video'
    WHEN p.handle = 'house_vibes' THEN 'VIP Event Invite'
  END,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN 'Get early access to unreleased tracks'
    WHEN p.handle = 'mc_flow' THEN 'Behind-the-scenes studio footage'
    WHEN p.handle = 'house_vibes' THEN 'Exclusive invite to VIP events'
  END,
  CASE 
    WHEN p.handle = 'dj_nexus' THEN 10.0
    WHEN p.handle = 'mc_flow' THEN 5.0
    WHEN p.handle = 'house_vibes' THEN 25.0
  END
FROM public.profiles p
WHERE p.role = 'DJ' AND p.handle IN ('dj_nexus', 'mc_flow', 'house_vibes');

-- Create some sample holdings (fans owning artist tokens)
INSERT INTO public.holdings (
  owner_id,
  token_id,
  amount
)
SELECT 
  fan.id as owner_id,
  token.id as token_id,
  CASE 
    WHEN fan.handle = 'music_lover_23' THEN 15.5
    WHEN fan.handle = 'rave_kid' THEN 8.25
    WHEN fan.handle = 'beats_collector' THEN 12.0
  END as amount
FROM public.profiles fan
CROSS JOIN public.artist_tokens token
INNER JOIN public.profiles dj ON token.artist_id = dj.id
WHERE fan.role = 'FAN' 
  AND fan.handle IN ('music_lover_23', 'rave_kid', 'beats_collector')
  AND dj.handle IN ('dj_nexus', 'mc_flow')
ON CONFLICT (owner_id, token_id) DO NOTHING;

-- Create sample transactions
INSERT INTO public.transactions (
  buyer_id,
  token_id,
  quantity,
  unit_price,
  type
)
SELECT 
  fan.id as buyer_id,
  token.id as token_id,
  5.0 as quantity,
  token.price as unit_price,
  'BUY' as type
FROM public.profiles fan
CROSS JOIN public.artist_tokens token
INNER JOIN public.profiles dj ON token.artist_id = dj.id
WHERE fan.role = 'FAN' 
  AND fan.handle = 'music_lover_23'
  AND dj.handle = 'dj_nexus';

-- Create sample notifications
INSERT INTO public.notifications (
  user_id,
  type,
  message,
  ref_id
)
SELECT 
  dj.user_id,
  'FOLLOW',
  fan.display_name || ' started following you',
  fan.id
FROM public.profiles dj
CROSS JOIN public.profiles fan
WHERE dj.role = 'DJ' 
  AND fan.role = 'FAN'
  AND dj.handle = 'dj_nexus'
  AND fan.handle = 'music_lover_23';

-- Create some artist certifications
INSERT INTO public.artist_certifications (artist_id, cert_id)
SELECT 
  p.id,
  cert.id
FROM public.profiles p
CROSS JOIN public.certifications_catalog cert
WHERE p.role = 'DJ' 
  AND p.handle = 'dj_nexus'
  AND cert.code = 'BEST_NEW_ARTIST'
ON CONFLICT (artist_id, cert_id) DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully!' as status;
