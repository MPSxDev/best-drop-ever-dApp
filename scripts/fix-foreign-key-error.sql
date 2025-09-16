-- Quick fix for foreign key constraint error
-- This script fixes the profiles table to allow NULL user_id values

-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
    -- Drop the existing foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'profiles_user_id_fkey' 
        AND table_name = 'profiles'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_id_fkey;
    END IF;
    
    -- Make user_id nullable
    ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
    
    -- Re-add the foreign key constraint (now allowing NULL values)
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
    RAISE NOTICE 'Fixed foreign key constraint - user_id can now be NULL';
END $$;

-- Verify the fix
SELECT 
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name = 'user_id';

-- Success message
SELECT 'Foreign key constraint fixed successfully!' as status;
