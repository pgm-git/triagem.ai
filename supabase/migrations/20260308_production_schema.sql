-- =============================================
-- TrackerAi Pro — Production Schema
-- Run this in Supabase SQL Editor (one-shot)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PLANS (Tiers com limites)
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  price_cents     INT NOT NULL,
  billing_period  TEXT DEFAULT 'monthly',

  -- Limites operacionais
  max_contacts          INT,
  max_messages_month    INT,
  max_sectors           INT,
  max_instances         INT,
  max_agents            INT,
  max_persona_traits    INT DEFAULT 1,
  retention_days        INT DEFAULT 30,

  -- Feature flags
  has_custom_persona    BOOLEAN DEFAULT false,
  has_priority_support  BOOLEAN DEFAULT false,
  has_api_access        BOOLEAN DEFAULT false,
  has_advanced_reports  BOOLEAN DEFAULT false,

  is_active       BOOLEAN DEFAULT true,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

INSERT INTO plans (id, name, description, price_cents, max_contacts, max_messages_month, max_sectors, max_instances, max_agents, max_persona_traits, retention_days, has_custom_persona, has_priority_support, has_api_access, has_advanced_reports, sort_order) VALUES
  ('essencial',    'Essencial',    'Para profissionais autônomos e microempresas',   39700,  250,   2500,   3,    1, 1, 1,  30,  false, false, false, false, 0),
  ('profissional', 'Profissional', 'Para pequenas e médias empresas',                69700,  1000,  10000,  8,    2, 5, 2,  90,  false, true,  false, true,  1),
  ('business',     'Business',     'Para operações com alto volume de atendimento',  129700, 5000,  50000,  20,   5, 15, 2, 365, true,  true,  true,  true,  2),
  ('enterprise',   'Enterprise',   'Solução completa para grandes operações',        0,      NULL,  NULL,   NULL, NULL, NULL, 2, NULL, true, true, true, true, 3)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 2. ORGANIZATIONS (Tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  email           TEXT,
  phone           TEXT,
  logo_url        TEXT,
  routing_type    TEXT DEFAULT 'keywords'
    CHECK (routing_type IN ('menu', 'keywords', 'hybrid')),
  persona_traits  TEXT[] DEFAULT '{}',
  custom_instructions TEXT,
  is_active       BOOLEAN DEFAULT true,
  setup_complete  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);


-- ============================================
-- 3. SUBSCRIPTIONS (Billing)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id           TEXT NOT NULL REFERENCES plans(id),
  status            TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'trial', 'suspended')),
  started_at          TIMESTAMPTZ DEFAULT now(),
  trial_ends_at       TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end  TIMESTAMPTZ,
  canceled_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);


-- ============================================
-- 4. PROFILES (linked to auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name       TEXT,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'owner'
    CHECK (role IN ('owner', 'admin', 'agent')),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);


-- ============================================
-- 5. WHATSAPP INSTANCES
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_name   TEXT DEFAULT 'Principal',
  provider        TEXT NOT NULL DEFAULT 'uazapi'
    CHECK (provider IN ('uazapi', 'meta_cloud')),

  -- UazAPI
  uazapi_token    TEXT,
  uazapi_url      TEXT,

  -- Meta Cloud API
  meta_access_token        TEXT,
  meta_phone_number_id     TEXT,
  meta_business_account_id TEXT,
  meta_verify_token        TEXT,

  -- Shared
  phone_number    TEXT,
  status          TEXT DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'qr_pending', 'connecting')),
  webhook_secret  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  last_connected_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instances_org ON whatsapp_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_instances_token ON whatsapp_instances(uazapi_token);


-- ============================================
-- 6. SECTORS
-- ============================================
CREATE TABLE IF NOT EXISTS sectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  icon            TEXT DEFAULT '📂',
  destination     TEXT NOT NULL DEFAULT '',
  keywords        TEXT[] DEFAULT '{}',
  response_template TEXT,
  is_active       BOOLEAN DEFAULT true,
  is_fallback     BOOLEAN DEFAULT false,
  fallback_message TEXT,
  priority        INT DEFAULT 0,
  collection_fields JSONB DEFAULT '[]',
  schedule_start  TIME,
  schedule_end    TIME,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sectors_org ON sectors(organization_id);


-- ============================================
-- 7. CONTACTS
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone           TEXT NOT NULL,
  name            TEXT,
  first_seen_at   TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  total_messages  INT DEFAULT 0,
  is_blocked      BOOLEAN DEFAULT false,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_contacts_org_phone ON contacts(organization_id, phone);


-- ============================================
-- 8. CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_id     UUID REFERENCES whatsapp_instances(id),
  sector_id       UUID REFERENCES sectors(id),
  contact_id      UUID REFERENCES contacts(id),
  contact_phone   TEXT NOT NULL,
  contact_name    TEXT,
  status          TEXT DEFAULT 'pending_triage'
    CHECK (status IN ('active', 'resolved', 'pending_triage')),
  routed_by       TEXT CHECK (routed_by IN ('auto', 'manual', 'fallback')),
  matched_keyword TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_org ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(organization_id, status);


-- ============================================
-- 9. MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  sender_type     TEXT NOT NULL
    CHECK (sender_type IN ('client', 'agent', 'bot', 'system')),
  sender_id       UUID,
  uazapi_message_id TEXT,
  status          TEXT DEFAULT 'received'
    CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'received', 'failed')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at);


-- ============================================
-- 10. ROUTING LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS routing_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id),
  event_type      TEXT NOT NULL
    CHECK (event_type IN ('auto_route', 'manual_route', 'fallback', 'reassign', 'limit_reached')),
  from_sector_id  UUID,
  to_sector_id    UUID REFERENCES sectors(id),
  matched_keyword TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_logs_org ON routing_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_routing_logs_created ON routing_logs(organization_id, created_at);


-- ============================================
-- 11. USAGE METRICS
-- ============================================
CREATE TABLE IF NOT EXISTS usage_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period          DATE NOT NULL,
  contacts_count      INT DEFAULT 0,
  messages_sent       INT DEFAULT 0,
  messages_received   INT DEFAULT 0,
  messages_total      INT GENERATED ALWAYS AS (messages_sent + messages_received) STORED,
  conversations_opened INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, period)
);

CREATE INDEX IF NOT EXISTS idx_usage_org_period ON usage_metrics(organization_id, period);


-- ============================================
-- 12. FUNCTION: Auto-create profile on signup
-- ============================================
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

-- Drop trigger if exists to avoid conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 13. FUNCTION: Auto-create org on first signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_org_for_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_slug TEXT;
BEGIN
  -- Only create org if user has no organization
  IF NEW.organization_id IS NULL THEN
    v_slug := lower(replace(COALESCE(NEW.full_name, 'org'), ' ', '-')) || '-' || substr(NEW.id::text, 1, 8);
    
    INSERT INTO organizations (name, slug, email)
    VALUES (
      COALESCE(NEW.full_name, 'Minha Empresa'),
      v_slug,
      NEW.email
    )
    RETURNING id INTO v_org_id;
    
    -- Link profile to org
    UPDATE profiles SET organization_id = v_org_id WHERE id = NEW.id;
    
    -- Create default subscription (essencial plan, trial)
    INSERT INTO subscriptions (organization_id, plan_id, status, trial_ends_at)
    VALUES (v_org_id, 'essencial', 'trial', now() + interval '14 days');
    
    -- Create default sectors
    INSERT INTO sectors (organization_id, name, icon, destination, keywords, response_template, priority) VALUES
      (v_org_id, 'Financeiro', '💰', '', ARRAY['boleto', 'pagamento', 'pagar', 'fatura', 'cobrança'], 'Vou encaminhar você para o setor Financeiro. Aguarde um momento.', 0),
      (v_org_id, 'Comercial', '🤝', '', ARRAY['preço', 'orçamento', 'cotação', 'proposta', 'comprar'], 'Encaminhando para o Comercial. Em breve um consultor irá atendê-lo.', 1),
      (v_org_id, 'Suporte', '🛠️', '', ARRAY['erro', 'bug', 'não funciona', 'ajuda', 'suporte', 'problema'], 'Encaminhando para o Suporte Técnico. Aguarde!', 2);

    -- Create fallback sector
    INSERT INTO sectors (organization_id, name, icon, destination, is_fallback, fallback_message, priority)
    VALUES (v_org_id, 'Triagem', '📋', '', true, 'Vou te encaminhar para um atendente. Aguarde um momento.', 99);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_org_for_user();


-- ============================================
-- 14. FUNCTION: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organizations_updated ON organizations;
CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_instances_updated ON whatsapp_instances;
CREATE TRIGGER trg_instances_updated BEFORE UPDATE ON whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_sectors_updated ON sectors;
CREATE TRIGGER trg_sectors_updated BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_usage_updated ON usage_metrics;
CREATE TRIGGER trg_usage_updated BEFORE UPDATE ON usage_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 15. FUNCTION: Incrementar uso
-- ============================================
CREATE OR REPLACE FUNCTION increment_usage(
  p_org_id UUID,
  p_type TEXT
) RETURNS void AS $$
DECLARE
  v_period DATE := date_trunc('month', now())::date;
BEGIN
  INSERT INTO usage_metrics (organization_id, period)
  VALUES (p_org_id, v_period)
  ON CONFLICT (organization_id, period) DO NOTHING;

  CASE p_type
    WHEN 'message_sent' THEN
      UPDATE usage_metrics SET messages_sent = messages_sent + 1, updated_at = now()
      WHERE organization_id = p_org_id AND period = v_period;
    WHEN 'message_received' THEN
      UPDATE usage_metrics SET messages_received = messages_received + 1, updated_at = now()
      WHERE organization_id = p_org_id AND period = v_period;
    WHEN 'contact' THEN
      UPDATE usage_metrics SET contacts_count = contacts_count + 1, updated_at = now()
      WHERE organization_id = p_org_id AND period = v_period;
    WHEN 'conversation' THEN
      UPDATE usage_metrics SET conversations_opened = conversations_opened + 1, updated_at = now()
      WHERE organization_id = p_org_id AND period = v_period;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 16. RLS (Row Level Security)
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE routing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

-- Profiles: user only sees own
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Organizations: user sees their org
CREATE POLICY org_select ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY org_update ON organizations FOR UPDATE
  USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Subscriptions
CREATE POLICY sub_select ON subscriptions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- WhatsApp Instances
CREATE POLICY instance_all ON whatsapp_instances FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Sectors: full CRUD
CREATE POLICY sector_all ON sectors FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Contacts
CREATE POLICY contact_all ON contacts FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Conversations
CREATE POLICY conversation_all ON conversations FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Messages: through conversation org check
CREATE POLICY message_all ON messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  ));

-- Routing Logs
CREATE POLICY logs_select ON routing_logs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Usage Metrics
CREATE POLICY usage_select ON usage_metrics FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));


-- ============================================
-- 17. ENABLE REALTIME for key tables
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_instances;

-- =============================================
-- DONE! Schema ready for TrackerAi Pro
-- =============================================
