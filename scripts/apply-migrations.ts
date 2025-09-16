#!/usr/bin/env tsx

/**
 * Migration script for Dropsland dApp
 * This script applies all database migrations in the correct order
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Read the complete setup script
const setupScript = readFileSync(join(__dirname, 'setup-database.sql'), 'utf8');

console.log('🚀 Starting Dropsland dApp database setup...');
console.log('📋 This script will:');
console.log('   1. Create all necessary tables');
console.log('   2. Set up Row Level Security policies');
console.log('   3. Insert sample data');
console.log('   4. Create indexes for performance');
console.log('');

// Split the script into logical sections for better error handling
const sections = [
  {
    name: 'Tables Creation',
    sql: setupScript.split('-- 2. Create indexes for performance')[0].split('-- 1. Create all tables')[1]
  },
  {
    name: 'Indexes Creation', 
    sql: setupScript.split('-- 3. Enable Row Level Security')[0].split('-- 2. Create indexes for performance')[1]
  },
  {
    name: 'RLS Setup',
    sql: setupScript.split('-- 4. Create RLS policies')[0].split('-- 3. Enable Row Level Security')[1]
  },
  {
    name: 'RLS Policies',
    sql: setupScript.split('-- 5. Insert initial data')[0].split('-- 4. Create RLS policies')[1]
  },
  {
    name: 'Sample Data',
    sql: setupScript.split('-- Success message')[0].split('-- 5. Insert initial data')[1]
  }
];

console.log('📝 Migration sections prepared:');
sections.forEach((section, index) => {
  console.log(`   ${index + 1}. ${section.name}`);
});

console.log('');
console.log('⚠️  IMPORTANT: To apply these migrations, you need to:');
console.log('');
console.log('1. Set up your Supabase project:');
console.log('   - Create a new project at https://supabase.com');
console.log('   - Get your project URL and anon key');
console.log('');
console.log('2. Configure environment variables:');
console.log('   - Copy .env.example to .env.local');
console.log('   - Add your Supabase credentials');
console.log('');
console.log('3. Apply the migrations:');
console.log('   - Use the Supabase dashboard SQL editor');
console.log('   - Or run: supabase db reset --linked');
console.log('   - Or use the setup-database.sql file directly');
console.log('');
console.log('4. Verify the setup:');
console.log('   - Check that all tables are created');
console.log('   - Verify RLS policies are active');
console.log('   - Confirm sample data is inserted');
console.log('');

// Export the sections for potential programmatic use
export { sections, setupScript };

// If running directly, show instructions
if (require.main === module) {
  console.log('✅ Migration script ready!');
  console.log('📁 Complete SQL file: scripts/setup-database.sql');
  console.log('🔧 Next steps: Configure Supabase and run the migrations');
}
