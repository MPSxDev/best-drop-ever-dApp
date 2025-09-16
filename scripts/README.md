# Dropsland dApp Database Setup

This directory contains all the SQL migrations and setup scripts for the Dropsland dApp database.

## 📁 Files Overview

### Migration Files
- `001_create_tables.sql` - Creates all database tables
- `002_enable_rls.sql` - Sets up Row Level Security policies
- `003_seed_data.sql` - Basic seed data template
- `004_create_test_profiles.sql` - Comprehensive test profiles and data

### Seed Data Files
- `seed-rewards.sql` - Sample rewards data
- `seed-follows.sql` - Sample follow relationships
- `create-sample-posts.sql` - Sample posts data

### Setup Scripts
- `setup-database.sql` - **Complete database setup in one file**
- `apply-migrations.ts` - TypeScript migration runner
- `001_create_demo_users.sql` - Demo user creation
- `002_create_demo_auth_users.ts` - TypeScript demo user creation

## 🚀 Quick Setup

### Option 1: Complete Setup (Recommended)
Use the comprehensive setup script that includes everything:

```sql
-- Run this in your Supabase SQL editor
\i scripts/setup-database.sql
```

### Option 2: Step-by-Step Migration
Apply migrations in order:

1. **Create Tables**
   ```sql
   \i scripts/001_create_tables.sql
   ```

2. **Enable RLS**
   ```sql
   \i scripts/002_enable_rls.sql
   ```

3. **Seed Data**
   ```sql
   \i scripts/004_create_test_profiles.sql
   ```

## 🗄️ Database Schema

### Core Tables
- `profiles` - User profiles (DJs and Fans)
- `posts` - Social media posts
- `comments` - Post comments
- `follows` - User follow relationships

### Token Economy
- `artist_tokens` - Artist-created tokens
- `holdings` - User token holdings
- `transactions` - Token buy/sell transactions

### Rewards & Certifications
- `rewards` - Artist-created rewards
- `user_rewards` - User reward unlocks
- `certifications_catalog` - Available certifications
- `artist_certifications` - Artist certifications

### Notifications
- `notifications` - User notifications

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

- **Public Read**: Profiles, posts, comments, artist tokens, rewards
- **Owner Only**: Holdings, transactions, user rewards, notifications
- **Authenticated Users**: Follow relationships, artist certifications

### Data Validation
- Check constraints on role fields
- Foreign key relationships
- Unique constraints on handles and symbols

## 📊 Sample Data

The setup includes comprehensive test data:

### Test Profiles
- **DJs**: dj_nexus, mc_flow, house_vibes
- **Fans**: music_lover_23, rave_kid, beats_collector

### Sample Content
- Artist tokens with realistic pricing
- Social media posts
- Follow relationships
- Token holdings and transactions
- Rewards and notifications

## 🛠️ Development Setup

### Prerequisites
1. Supabase project created
2. Environment variables configured
3. Supabase CLI installed (optional)

### Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Running Migrations
```bash
# Using Supabase CLI
supabase db reset --linked

# Or manually in Supabase dashboard
# Copy and paste setup-database.sql
```

## 🔍 Verification

After running migrations, verify:

1. **Tables Created**: Check all tables exist in public schema
2. **RLS Active**: Verify RLS is enabled on all tables
3. **Policies Applied**: Check policies are created and active
4. **Sample Data**: Confirm test profiles and data are inserted
5. **Indexes**: Verify performance indexes are created

### Quick Verification Query
```sql
-- Check table count
SELECT count(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check sample data
SELECT role, count(*) 
FROM profiles 
GROUP BY role;
```

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're using the service role key for admin operations
   - Check RLS policies aren't blocking operations

2. **Foreign Key Violations**
   - Run migrations in the correct order
   - Check that referenced records exist

3. **Duplicate Key Errors**
   - Use `ON CONFLICT DO NOTHING` for idempotent inserts
   - Check for existing data before inserting

### Reset Database
```sql
-- Drop all tables (be careful!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

## 📈 Performance

### Indexes Created
- `idx_posts_created_at` - Post ordering
- `idx_comments_post_created_at` - Comment ordering
- `idx_transactions_buyer_created_at` - Transaction history
- `idx_notifications_user_created_at` - Notification ordering
- `idx_profiles_handle` - Profile lookups

### Query Optimization
- Use appropriate WHERE clauses
- Leverage indexes for sorting
- Consider pagination for large datasets

## 🔄 Maintenance

### Regular Tasks
1. Monitor query performance
2. Update RLS policies as needed
3. Add new indexes for new query patterns
4. Clean up old notifications periodically

### Backup Strategy
- Regular database backups
- Export critical data (profiles, tokens)
- Version control schema changes

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
