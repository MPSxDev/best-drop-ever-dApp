# 🚀 Dropsland dApp Database Setup Guide

## Overview
This guide will help you set up the complete database schema for the Dropsland dApp using Supabase. The database includes user profiles, social features, token economy, rewards system, and notifications.

## 📋 Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **New Project**: Create a new Supabase project
3. **Project Credentials**: Get your project URL and API keys

## 🔧 Step 1: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**How to get these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and anon public key
4. Copy the service_role secret key (keep this secure!)

## 🗄️ Step 2: Apply Database Migrations

### Option A: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to SQL Editor

2. **Run the Complete Setup**
   - Copy the contents of `setup-database.sql` (recommended for demo)
   - OR copy the contents of `setup-with-auth-users.sql` (for production-like setup)
   - Paste into the SQL editor
   - Click "Run" to execute

**Setup Options:**
- **`setup-database.sql`**: Creates demo profiles without auth users (easier setup)
- **`setup-with-auth-users.sql`**: Creates profiles that can be linked to auth users (more complete)

3. **Verify Setup**
   - Check the Table Editor to see all tables
   - Verify data is inserted correctly

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db reset --linked
```

## 📊 Step 3: Verify Database Setup

### Check Tables Created
Run this query in the SQL editor:

```sql
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- artist_certifications
- artist_tokens
- certifications_catalog
- comments
- follows
- holdings
- notifications
- posts
- profiles
- rewards
- transactions
- user_rewards

### Check Sample Data
```sql
-- Check profiles
SELECT role, count(*) as count 
FROM profiles 
GROUP BY role;

-- Check artist tokens
SELECT symbol, display_name, price 
FROM artist_tokens;

-- Check sample posts
SELECT p.handle, po.content 
FROM profiles p 
JOIN posts po ON p.id = po.author_id 
LIMIT 5;
```

## 🔐 Step 4: Verify Security Setup

### Check RLS Status
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should have `rowsecurity = true`.

### Check Policies
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🧪 Step 5: Test the Setup

### Test User Authentication
1. Go to Authentication → Users in Supabase dashboard
2. Create a test user
3. Verify the user can be created

### Test Data Access
Run these test queries:

```sql
-- Test profile creation (this should work with RLS)
INSERT INTO profiles (user_id, handle, display_name, role, bio)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test_user',
  'Test User',
  'FAN',
  'Test profile'
);

-- Test data retrieval
SELECT * FROM profiles WHERE handle = 'test_user';
```

## 🚨 Troubleshooting

### Common Issues

#### 1. "Permission Denied" Errors
- **Cause**: RLS policies are blocking operations
- **Solution**: Ensure you're using the service role key for admin operations
- **Check**: Verify RLS policies are correctly configured

#### 2. "Foreign Key Violation" Errors
- **Cause**: Referenced records don't exist
- **Solution**: Run migrations in the correct order
- **Check**: Ensure all referenced tables are created first

#### 3. "Duplicate Key" Errors
- **Cause**: Data already exists
- **Solution**: Use `ON CONFLICT DO NOTHING` for idempotent operations
- **Check**: Clear existing data before re-running migrations

#### 4. "Extension Not Found" Errors
- **Cause**: UUID extension not enabled
- **Solution**: Run `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- **Check**: Verify extensions are enabled in Supabase

### Reset Database
If you need to start over:

```sql
-- WARNING: This will delete all data!
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then re-run the setup script.

## 📈 Performance Optimization

### Indexes Created
The setup script creates these performance indexes:
- `idx_posts_created_at` - For post ordering
- `idx_comments_post_created_at` - For comment ordering  
- `idx_transactions_buyer_created_at` - For transaction history
- `idx_notifications_user_created_at` - For notification ordering
- `idx_profiles_handle` - For profile lookups

### Query Optimization Tips
1. Use appropriate WHERE clauses
2. Leverage indexes for sorting and filtering
3. Consider pagination for large datasets
4. Monitor query performance in Supabase dashboard

## 🔄 Maintenance

### Regular Tasks
1. **Monitor Performance**: Check slow queries in Supabase dashboard
2. **Update Policies**: Modify RLS policies as needed
3. **Add Indexes**: Create new indexes for new query patterns
4. **Clean Data**: Periodically clean up old notifications

### Backup Strategy
1. **Regular Backups**: Use Supabase's built-in backup features
2. **Export Critical Data**: Regularly export profiles and token data
3. **Version Control**: Keep schema changes in version control

## 📚 Next Steps

After successful setup:

1. **Configure Authentication**: Set up email/password or OAuth providers
2. **Test API Endpoints**: Verify all API calls work correctly
3. **Set up Monitoring**: Configure alerts for database issues
4. **Deploy to Production**: Follow Supabase deployment best practices

## 🆘 Support

If you encounter issues:

1. **Check Supabase Logs**: Look at the Logs section in your dashboard
2. **Review RLS Policies**: Ensure policies match your use case
3. **Test with Service Role**: Use service role key for admin operations
4. **Check Documentation**: Refer to [Supabase docs](https://supabase.com/docs)

## ✅ Success Checklist

- [ ] Environment variables configured
- [ ] All tables created successfully
- [ ] RLS enabled on all tables
- [ ] Sample data inserted
- [ ] Test queries working
- [ ] Authentication configured
- [ ] Performance indexes created
- [ ] Backup strategy in place

---

**🎉 Congratulations!** Your Dropsland dApp database is now ready for development!
