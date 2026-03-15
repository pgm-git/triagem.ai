-- =============================================
-- Consolidated RBAC Triggers Fix
-- Ensures invitations metadata (org_id, role) is respected
-- =============================================

-- 1. Extend debug logs for visibility
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    context TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Fixed handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_role TEXT;
    v_full_name TEXT;
    v_invite_token TEXT;
BEGIN
    -- Log input
    INSERT INTO public.debug_logs (context, payload)
    VALUES ('handle_new_user_start', jsonb_build_object(
        'user_id', NEW.id,
        'email', NEW.email,
        'metadata', NEW.raw_user_meta_data
    ));

    -- Extract from metadata
    v_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    v_role := NEW.raw_user_meta_data->>'role';
    v_full_name := NEW.raw_user_meta_data->>'full_name';
    v_invite_token := NEW.raw_user_meta_data->>'invite_token';

    IF v_org_id IS NOT NULL THEN
        -- USER FROM INVITATION
        INSERT INTO public.debug_logs (context, payload) VALUES ('user_from_invite', jsonb_build_object('org_id', v_org_id, 'role', v_role));
        
        -- Update invitation status
        IF v_invite_token IS NOT NULL THEN
            UPDATE public.invitations 
            SET status = 'accepted' 
            WHERE token::text = v_invite_token 
            AND status = 'pending';
        END IF;

    ELSE
        -- NEW SIGNUP (OWNER)
        INSERT INTO public.organizations (name, slug)
        VALUES (
            COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
            LOWER(REGEXP_REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'empresa-' || substr(NEW.id::text, 1, 6)), '[^a-zA-Z0-9]', '-', 'g'))
        ) RETURNING id INTO v_org_id;
        
        v_role := 'owner';
        
        INSERT INTO public.debug_logs (context, payload) VALUES ('owner_signup_org_created', jsonb_build_object('org_id', v_org_id));
    END IF;

    -- Create profile with correct data
    INSERT INTO public.profiles (id, full_name, email, role, organization_id)
    VALUES (
        NEW.id,
        COALESCE(v_full_name, split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(v_role, 'agent'),
        v_org_id
    );

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.debug_logs (context, payload)
    VALUES ('handle_new_user_error', jsonb_build_object('error', SQLERRM, 'state', SQLSTATE));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Disable old redundant trigger if it exists
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP FUNCTION IF EXISTS public.handle_new_org_for_user();
