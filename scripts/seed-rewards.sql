-- Insert sample rewards for demo artists
INSERT INTO rewards (artist_id, title, description, type, required_amount) VALUES
-- iamjuampi rewards
((SELECT id FROM profiles WHERE handle = 'iamjuampi'), 'Exclusive Track Preview', 'Get early access to my unreleased tracks before anyone else', 'EARLY_ACCESS', 5.0),
((SELECT id FROM profiles WHERE handle = 'iamjuampi'), 'Behind the Scenes Content', 'Exclusive videos showing my creative process in the studio', 'EXCLUSIVE_CONTENT', 10.0),
((SELECT id FROM profiles WHERE handle = 'iamjuampi'), 'Virtual Meet & Greet', 'Join me for a private video call session with other top supporters', 'MEET_GREET', 25.0),

-- Sample DJ rewards (if other DJs exist)
((SELECT id FROM profiles WHERE handle = 'testdj' LIMIT 1), 'Remix Pack Access', 'Download stems and samples from my latest releases', 'EXCLUSIVE_CONTENT', 3.0),
((SELECT id FROM profiles WHERE handle = 'testdj' LIMIT 1), 'Live Set Recording', 'Get recordings of my exclusive live performances', 'EXCLUSIVE_CONTENT', 8.0),
((SELECT id FROM profiles WHERE handle = 'testdj' LIMIT 1), 'Producer Masterclass', 'Join my online masterclass on music production techniques', 'MEET_GREET', 20.0);

-- Insert sample notifications for demo
INSERT INTO notifications (user_id, type, message, ref_id) VALUES
((SELECT user_id FROM profiles WHERE handle = 'fan'), 'BUY', 'You bought 2.5 JUAMPI tokens for $12.50', (SELECT id FROM artist_tokens WHERE symbol = 'JUAMPI')),
((SELECT user_id FROM profiles WHERE handle = 'fan'), 'REWARD_UNLOCKED', 'You unlocked "Exclusive Track Preview" by holding 5.0 JUAMPI tokens!', (SELECT id FROM rewards WHERE title = 'Exclusive Track Preview'));
