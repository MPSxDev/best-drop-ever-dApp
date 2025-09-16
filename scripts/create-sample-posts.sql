-- Insert sample posts for demo artists
INSERT INTO posts (author_id, content, media_url) VALUES
-- iamjuampi posts
((SELECT id FROM profiles WHERE handle = 'iamjuampi'), 'Just dropped a new track! What do you think about this beat? 🎵', '/placeholder.svg?height=300&width=400'),
((SELECT id FROM profiles WHERE handle = 'iamjuampi'), 'Working on something special for my token holders. Exclusive content coming soon! 🔥', NULL),
((SELECT id FROM profiles WHERE handle = 'iamjuampi'), 'Thank you to all my supporters! Your token purchases help me create more music 🙏', '/placeholder.svg?height=300&width=400'),

-- Sample DJ posts (if other DJs exist)
((SELECT id FROM profiles WHERE handle = 'testdj' LIMIT 1), 'New remix pack available for my token holders! Check it out 🎧', '/placeholder.svg?height=300&width=400');
