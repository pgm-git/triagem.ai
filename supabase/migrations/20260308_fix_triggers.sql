-- =============================================
-- DEFINITIVE FIX: Profiles table + Triggers
-- 
-- Root cause: The old 001_initial_schema.sql created profiles
-- with only (id, full_name, avatar_url, created_at).
-- The new 20260308_production_schema used CREATE TABLE IF NOT EXISTS
-- which didn't add the missing columns (email, organization_id, role, etc.)
-- =============================================

-- Step 1: Add missing columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'owner';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Make full_name nullable (it was NOT NULL in old schema but we want it optional)
ALTER TABLE profiles ALTER COLUMN full_name DROP NOT NULL;

-- Create index on organization_id if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);


-- Step 2: Drop ALL existing triggers on auth.users and profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created ON profiles;


-- Step 3: Drop old functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_org_for_user() CASCADE;


-- Step 4: Recreate handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Step 5: Recreate handle_new_org_for_user
CREATE OR REPLACE FUNCTION public.handle_new_org_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_slug TEXT;
BEGIN
  IF NEW.organization_id IS NULL THEN
    v_slug := lower(replace(COALESCE(NEW.full_name, 'org'), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8);
    
    INSERT INTO organizations (name, slug, email)
    VALUES (
      COALESCE(NEW.full_name, 'Minha Empresa'),
      v_slug,
      NEW.email
    )
    RETURNING id INTO v_org_id;
    
    UPDATE profiles SET organization_id = v_org_id WHERE id = NEW.id;
    
    INSERT INTO subscriptions (organization_id, plan_id, status, trial_ends_at)
    VALUES (v_org_id, 'essencial', 'trial', now() + interval '14 days');
    
    INSERT INTO sectors (organization_id, name, icon, destination, keywords, response_template, priority) VALUES
      (v_org_id, 'Financeiro', '💰', '', ARRAY['boleto', 'pagamento', 'pagar', 'fatura', 'cobrança'], 'Vou encaminhar você para o setor Financeiro. Aguarde um momento.', 0),
      (v_org_id, 'Comercial', '🤝', '', ARRAY['preço', 'orçamento', 'cotação', 'proposta', 'comprar'], 'Encaminhando para o Comercial. Em breve um consultor irá atendê-lo.', 1),
      (v_org_id, 'Suporte', '🛠️', '', ARRAY['erro', 'bug', 'não funciona', 'ajuda', 'suporte', 'problema'], 'Encaminhando para o Suporte Técnico. Aguarde!', 2);

    INSERT INTO sectors (organization_id, name, icon, destination, is_fallback, fallback_message, priority)
    VALUES (v_org_id, 'Triagem', '📋', '', true, 'Vou te encaminhar para um atendente. Aguarde um momento.', 99);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_org_for_user();


-- =============================================
-- DONE! The profiles table now has all required columns
-- and the triggers are correctly recreated.
-- Try registering again.
-- =============================================
