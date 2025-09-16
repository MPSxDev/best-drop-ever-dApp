-- Insert demo users (these will be created via auth.users first)
-- Note: The actual auth users need to be created through Supabase Auth

-- Insert certifications catalog
insert into public.certifications_catalog (code, title, description, icon_url) values
('GOLD_RECORD', 'Gold Record', 'Achieved gold record status', '/icons/gold-record.svg'),
('PLATINUM_RECORD', 'Platinum Record', 'Achieved platinum record status', '/icons/platinum-record.svg'),
('ONE_MILLION_VIEWS', '1M Views', 'Reached one million views', '/icons/million-views.svg'),
('SOLD_OUT_EVENT', 'Sold Out Event', 'Sold out a major event', '/icons/sold-out.svg'),
('BEST_NEW_ARTIST', 'Best New Artist', 'Recognized as best new artist', '/icons/best-new-artist.svg');

-- Note: The following inserts will be done after user registration
-- This is just a template for the seed data structure

-- Demo profiles (to be inserted after auth users are created)
-- insert into public.profiles (user_id, handle, display_name, role, bio, primary_genre, avatar_url, cover_url) values
-- (auth_user_id_for_iamjuampi, 'iamjuampi', 'iamjuampi', 'DJ', 'Drum & Bass producer and DJ from Argentina', 'Drum & Bass', '/avatars/iamjuampi.jpg', '/covers/iamjuampi.jpg'),
-- (auth_user_id_for_fan, 'fan', 'Fan User', 'FAN', 'Music lover and supporter', null, '/avatars/fan.jpg', null);

-- Demo artist token (to be inserted after profile creation)
-- insert into public.artist_tokens (artist_id, symbol, display_name, price) values
-- (profile_id_for_iamjuampi, '$iamjuampi', 'iamjuampi', 2.50);

-- Demo posts (to be inserted after profile creation)
-- insert into public.posts (author_id, content, media_url) values
-- (profile_id_for_iamjuampi, 'Just dropped a new mix! Check it out 🔥', '/media/mix1.jpg'),
-- (profile_id_for_iamjuampi, 'Working on some new tracks in the studio', '/media/studio.jpg'),
-- (profile_id_for_iamjuampi, 'Thanks for all the support! More music coming soon', null);

-- Demo rewards (to be inserted after profile creation)
-- insert into public.rewards (artist_id, title, description, required_amount) values
-- (profile_id_for_iamjuampi, 'Backstage Pass', 'Get exclusive backstage access', 1.0),
-- (profile_id_for_iamjuampi, 'Exclusive Mix', 'Access to unreleased exclusive mix', 5.0);

-- Demo certification (to be inserted after profile creation)
-- insert into public.artist_certifications (artist_id, cert_id) values
-- (profile_id_for_iamjuampi, (select id from public.certifications_catalog where code = 'BEST_NEW_ARTIST'));
