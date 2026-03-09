-- =============================================
-- TRIGGER DEBUG SCRIPT
-- =============================================
-- Copy and run this script in the Supabase SQL Editor.
-- It attempts to manually simulate a user signup to figure out
-- EXACTLY what line in the trigger is failing.
-- 
-- **IF it shows an error, please tell me the EXACT error message it gives.**
-- =============================================

DO $$
DECLARE
  v_test_uuid UUID := gen_random_uuid();
BEGIN
  -- 1. Try to insert into auth.users (this fires handle_new_user)
  -- Note: Depending on permissions, this might fail immediately if we don't have access to auth schema.
  -- But usually in the SQL Editor (postgres role), it works.
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (
    v_test_uuid,
    v_test_uuid::text || '@trackerai.com',
    '{"full_name": "Test User"}'::jsonb
  );

  -- 2. Clean up if it succeeded (so we don't leave trash in the DB)
  DELETE FROM auth.users WHERE id = v_test_uuid;
  
  RAISE NOTICE 'SUCCESS: The triggers worked perfectly!';
END;
$$;
