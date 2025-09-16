-- Verification script for Dropsland dApp database setup
-- Run this after applying migrations to verify everything is working correctly

-- 1. Check that all required tables exist
SELECT 
    'Tables Check' as test_category,
    CASE 
        WHEN COUNT(*) = 12 THEN 'PASS' 
        ELSE 'FAIL - Expected 12 tables, found ' || COUNT(*) 
    END as result
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'profiles', 'posts', 'comments', 'follows',
        'artist_tokens', 'holdings', 'transactions',
        'rewards', 'user_rewards', 'certifications_catalog',
        'artist_certifications', 'notifications'
    );

-- 2. Check that all tables have RLS enabled
SELECT 
    'RLS Check' as test_category,
    CASE 
        WHEN COUNT(*) = 12 THEN 'PASS' 
        ELSE 'FAIL - Expected 12 tables with RLS, found ' || COUNT(*) 
    END as result
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = true
    AND tablename IN (
        'profiles', 'posts', 'comments', 'follows',
        'artist_tokens', 'holdings', 'transactions',
        'rewards', 'user_rewards', 'certifications_catalog',
        'artist_certifications', 'notifications'
    );

-- 3. Check that indexes are created
SELECT 
    'Indexes Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 5 THEN 'PASS' 
        ELSE 'FAIL - Expected at least 5 indexes, found ' || COUNT(*) 
    END as result
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';

-- 4. Check that sample data is inserted
SELECT 
    'Sample Data Check' as test_category,
    CASE 
        WHEN (SELECT COUNT(*) FROM profiles WHERE role = 'DJ') >= 3 
         AND (SELECT COUNT(*) FROM profiles WHERE role = 'FAN') >= 3
         AND (SELECT COUNT(*) FROM artist_tokens) >= 3
         AND (SELECT COUNT(*) FROM posts) >= 3
         AND (SELECT COUNT(*) FROM certifications_catalog) >= 5
        THEN 'PASS' 
        ELSE 'FAIL - Sample data not properly inserted' 
    END as result;

-- 5. Check foreign key constraints
SELECT 
    'Foreign Keys Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 10 THEN 'PASS' 
        ELSE 'FAIL - Expected at least 10 foreign keys, found ' || COUNT(*) 
    END as result
FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' 
    AND constraint_type = 'FOREIGN KEY';

-- 6. Check that policies are created
SELECT 
    'Policies Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 20 THEN 'PASS' 
        ELSE 'FAIL - Expected at least 20 policies, found ' || COUNT(*) 
    END as result
FROM pg_policies 
WHERE schemaname = 'public';

-- 7. Detailed table information
SELECT 
    'Table Details' as test_category,
    table_name,
    CASE 
        WHEN rowsecurity THEN 'RLS Enabled' 
        ELSE 'RLS Disabled' 
    END as rls_status,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_schema = 'public' AND table_name = t.tablename) as column_count
FROM pg_tables t
WHERE schemaname = 'public'
    AND tablename IN (
        'profiles', 'posts', 'comments', 'follows',
        'artist_tokens', 'holdings', 'transactions',
        'rewards', 'user_rewards', 'certifications_catalog',
        'artist_certifications', 'notifications'
    )
ORDER BY table_name;

-- 8. Sample data verification
SELECT 
    'Sample Data Details' as test_category,
    'Profiles' as data_type,
    role,
    COUNT(*) as count
FROM profiles 
GROUP BY role
UNION ALL
SELECT 
    'Sample Data Details' as test_category,
    'Artist Tokens' as data_type,
    symbol as role,
    COUNT(*) as count
FROM artist_tokens 
GROUP BY symbol
UNION ALL
SELECT 
    'Sample Data Details' as test_category,
    'Posts' as data_type,
    'Total' as role,
    COUNT(*) as count
FROM posts
UNION ALL
SELECT 
    'Sample Data Details' as test_category,
    'Certifications' as data_type,
    'Total' as role,
    COUNT(*) as count
FROM certifications_catalog;

-- 9. Performance indexes verification
SELECT 
    'Performance Indexes' as test_category,
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 10. Final summary
SELECT 
    'SETUP SUMMARY' as status,
    'Database setup verification completed!' as message,
    NOW() as verified_at;
