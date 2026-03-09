-- =============================================
-- FULL DATABASE RESET & RE-APPLY SCRIPT
-- WARNING: This will delete ALL data in the public schema.
-- Since this is the initial setup phase, it's the safest way 
-- to ensure the database structure is 100% correct.
-- =============================================

-- 1. Drop the entire public schema and all its objects (tables, functions, triggers)
DROP SCHEMA public CASCADE;

-- 2. Recreate the public schema
CREATE SCHEMA public;

-- 3. Restore default permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 4. Enable UUID extension inside the new public schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- 5. Restore default role usage for Supabase API 
-- (CRITICAL: without this, all API routes crash with "permission denied")
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- =============================================
-- NOW YOU MUST PASTE AND RUN THE FULL PRODUCTION SCHEMA
-- Copy the contents of 20260308_production_schema.sql 
-- and run it immediately after this script.
-- =============================================
