-- Clean migration script for Dropsland dApp
-- This script removes any existing data and tables for a fresh start

-- WARNING: This will delete all existing data!
-- Only run this if you want to start completely fresh

-- Drop all tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.artist_certifications CASCADE;
DROP TABLE IF EXISTS public.certifications_catalog CASCADE;
DROP TABLE IF EXISTS public.user_rewards CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.holdings CASCADE;
DROP TABLE IF EXISTS public.artist_tokens CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop any custom functions or triggers if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Clean up any orphaned policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "profiles_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "profiles_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "profiles_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "profiles_delete_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "posts_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "posts_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "posts_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "posts_delete_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "comments_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "comments_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "comments_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "comments_delete_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "follows_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "follows_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "follows_delete_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "artist_tokens_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "artist_tokens_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "artist_tokens_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "holdings_select_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "holdings_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "holdings_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "transactions_select_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "transactions_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "rewards_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "rewards_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "rewards_update_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "rewards_delete_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "user_rewards_select_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "user_rewards_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "certifications_catalog_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "artist_certifications_select_all" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "artist_certifications_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "notifications_select_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "notifications_insert_own" ON ' || r.schemaname || '.' || r.tablename;
        EXECUTE 'DROP POLICY IF EXISTS "notifications_update_own" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Reset sequences if any exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || r.sequence_name || ' CASCADE';
    END LOOP;
END $$;

-- Clean up any custom types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS transaction_type CASCADE;

-- Verify cleanup
SELECT 'Cleanup completed successfully!' as status;

-- Show remaining tables (should be empty or only system tables)
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
