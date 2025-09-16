-- Create comprehensive test profiles with realistic data

-- Insert test DJ profiles
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
  uuid_generate_v4(),
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
  uuid_generate_v4(),
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
  uuid_generate_v4(),
  'house_vibes',
  'House Vibes',
  'DJ',
  'Deep house and tech house DJ. Playing at clubs worldwide. Music is my passion, dancing is my language.',
  'https://mixcloud.com/housevibes',
  '/placeholder.svg?height=200&width=200',
  'House',
  '2021-01-10'
);

-- Insert test FAN profiles
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
  uuid_generate_v4(),
  'music_lover_23',
  'Sarah Chen',
  'FAN',
  'Music enthusiast and festival goer. Love discovering new artists and supporting underground talent.',
  '2022-06-18'
),
-- Fan Profile 2: Electronic Music Fan
(
  uuid_generate_v4(),
  'rave_kid',
  'Alex Rodriguez',
  'FAN',
  'Electronic music addict. Been to 50+ festivals. Always looking for the next big drop.',
  '2021-11-05'
),
-- Fan Profile 3: Hip Hop Supporter
(
  uuid_generate_v4(),
  'beats_collector',
  'Jordan Smith',
  'FAN',
  'Hip hop head and vinyl collector. Supporting independent artists since day one.',
  '2020-09-12'
);

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
WHERE p.role = 'DJ' AND p.handle IN ('dj_nexus', 'mc_flow', 'house_vibes');

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
  AND dj.handle IN ('dj_nexus', 'house_vibes');

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
  AND dj.handle IN ('dj_nexus', 'mc_flow');

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
