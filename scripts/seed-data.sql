-- Seed data for BestDropsever dApp
-- This script populates the database with sample data for testing

-- Insert sample profiles
INSERT INTO profiles (id, user_id, handle, display_name, bio, avatar_url, role, created_at, updated_at)
VALUES 
  ('profile-1', 'user-1', 'dj_mike', 'DJ Mike', 'Electronic music producer and DJ', '/avatars/dj-mike.jpg', 'DJ', NOW(), NOW()),
  ('profile-2', 'user-2', 'sarah_fan', 'Sarah', 'Music lover and festival goer', '/avatars/sarah.jpg', 'FAN', NOW(), NOW()),
  ('profile-3', 'user-3', 'alex_beats', 'Alex Beats', 'Hip-hop producer and beatmaker', '/avatars/alex.jpg', 'DJ', NOW(), NOW()),
  ('profile-4', 'user-4', 'music_lover', 'Music Lover', 'Passionate about all genres', '/avatars/music-lover.jpg', 'FAN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample artist tokens
INSERT INTO artist_tokens (id, artist_id, display_name, symbol, price, total_supply, created_at)
VALUES 
  ('token-1', 'user-1', 'DJ Mike Token', 'MIKE', 2.50, 1000000, NOW()),
  ('token-2', 'user-3', 'Alex Beats Token', 'ALEX', 1.75, 500000, NOW()),
  ('token-3', 'user-5', 'Demo Token', 'DEMO', 1.00, 1000000, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample holdings
INSERT INTO holdings (id, user_id, token_id, amount, created_at)
VALUES 
  ('holding-1', 'user-2', 'token-1', 500, NOW()),
  ('holding-2', 'user-2', 'token-2', 200, NOW()),
  ('holding-3', 'user-4', 'token-1', 100, NOW()),
  ('holding-4', 'user-4', 'token-3', 1000, NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (id, user_id, token_id, type, amount, price, total_value, created_at)
VALUES 
  ('tx-1', 'user-2', 'token-1', 'BUY', 100, 2.50, 250.00, NOW() - INTERVAL '1 day'),
  ('tx-2', 'user-2', 'token-2', 'BUY', 50, 1.75, 87.50, NOW() - INTERVAL '2 days'),
  ('tx-3', 'user-4', 'token-1', 'BUY', 200, 2.50, 500.00, NOW() - INTERVAL '3 days'),
  ('tx-4', 'user-4', 'token-3', 'BUY', 1000, 1.00, 1000.00, NOW() - INTERVAL '1 week')
ON CONFLICT (id) DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
VALUES 
  ('notif-1', 'user-2', 'PRICE_ALERT', 'Price Alert', 'DJ Mike Token price increased by 10%', false, NOW()),
  ('notif-2', 'user-4', 'TRANSACTION', 'Transaction Complete', 'Your purchase of 200 MIKE tokens is complete', true, NOW() - INTERVAL '1 hour'),
  ('notif-3', 'user-2', 'FOLLOW', 'New Follower', 'Sarah started following you', false, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert sample follows
INSERT INTO follows (id, follower_id, following_id, created_at)
VALUES 
  ('follow-1', 'user-2', 'user-1', NOW() - INTERVAL '1 day'),
  ('follow-2', 'user-4', 'user-1', NOW() - INTERVAL '2 days'),
  ('follow-3', 'user-2', 'user-3', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Insert sample posts
INSERT INTO posts (id, user_id, content, created_at)
VALUES 
  ('post-1', 'user-1', 'Just dropped a new track! Check it out on my profile 🎵', NOW() - INTERVAL '1 hour'),
  ('post-2', 'user-3', 'Working on some new beats in the studio today', NOW() - INTERVAL '3 hours'),
  ('post-3', 'user-1', 'Thanks to all my supporters! Token price is looking good 📈', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Insert sample comments
INSERT INTO comments (id, post_id, user_id, content, created_at)
VALUES 
  ('comment-1', 'post-1', 'user-2', 'Amazing track! 🔥', NOW() - INTERVAL '30 minutes'),
  ('comment-2', 'post-1', 'user-4', 'Love it! When is the next drop?', NOW() - INTERVAL '45 minutes'),
  ('comment-3', 'post-3', 'user-2', 'Keep up the great work!', NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;
