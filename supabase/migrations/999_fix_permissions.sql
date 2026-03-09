-- =============================================
-- SCRIPT: RESTORE DEFAULT SUPABASE PERMISSIONS
-- =============================================
-- If you ever run DROP SCHEMA public CASCADE, the default Supabase 
-- role permissions are wiped out, causing "permission denied" errors 
-- on all API requests (anon, authenticated, service_role).
-- 
-- RUN THIS SCRIPT IN SUPABASE SQL EDITOR TO FIX:
-- =============================================

-- 1. Grant usage on the schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant all privileges on all current tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Grant all privileges on all current functions
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Grant all privileges on all current sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Set default privileges for FUTURE tables, functions, and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Note: Row Level Security (RLS) policies still apply and protect your data.
-- This script merely restores the ability for the roles to access the schema.
