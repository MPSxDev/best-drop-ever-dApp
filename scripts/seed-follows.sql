-- Insert sample follows for demo
INSERT INTO follows (follower_id, following_id) VALUES
-- Fan follows iamjuampi
((SELECT id FROM profiles WHERE handle = 'fan'), (SELECT id FROM profiles WHERE handle = 'iamjuampi')),
-- Add more sample follows if other profiles exist
((SELECT id FROM profiles WHERE handle = 'fan'), (SELECT id FROM profiles WHERE handle = 'testdj' LIMIT 1));

-- Insert sample notifications for follows
INSERT INTO notifications (user_id, type, message, ref_id) VALUES
((SELECT user_id FROM profiles WHERE handle = 'iamjuampi'), 'FOLLOW', 'fan started following you', (SELECT id FROM profiles WHERE handle = 'fan'));
