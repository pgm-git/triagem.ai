-- =============================================
-- SCRIPT: FIX MISSING PROFILES & ORGANIZATIONS
-- =============================================
-- Run this AFTER running the fix-permissions script.
-- This guarantees that any user who registered while the DB
-- permissions were broken will get their profile and organization created.
-- =============================================

INSERT INTO public.profiles (id, full_name, email)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 
    email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Notice: The AFTER INSERT trigger "on_profile_created" on the "profiles" table 
-- will automatically fire and create the missing Organizations, 
-- linking them to these inserted profiles!
