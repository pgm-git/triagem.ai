-- =============================================
-- Migration: Complete Schema for Roteador de Atendimento
-- Includes: plans, billing, WhatsApp, routing, usage
-- =============================================

-- ============================================
-- 1. PLANS (Tiers com limites)
-- ============================================
CREATE TABLE plans (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  price_cents     INT NOT NULL,
  billing_period  TEXT DEFAULT 'monthly',

  -- Limites operacionais
  max_contacts          INT,    -- NULL = ilimitado
  max_messages_month    INT,
  max_sectors           INT,
  max_instances         INT,    -- WhatsApps conectados
  max_agents            INT,    -- usuários do sistema
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
  ('essencial',    'Essencial',    'Para profissionais autônomos e microempresas',        39700,  250,   2500,   3,    1, 1, 1,  30,  false, false, false, false, 0),
  ('profissional', 'Profissional', 'Para pequenas e médias empresas',                     69700,  1000,  10000,  8,    2, 5, 2,  90,  false, true,  false, true,  1),
  ('business',     'Business',     'Para operações com alto volume de atendimento',        129700, 5000,  50000,  20,   5, 15, 2, 365, true,  true,  true,  true,  2),
  ('enterprise',   'Enterprise',   'Solução completa para grandes operações',              0,      NULL,  NULL,   NULL, NULL, NULL, 2, NULL, true, true, true, true, 3);


-- ============================================
-- 2. ORGANIZATIONS (Tenant)
-- ============================================
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  logo_url        TEXT,
  routing_type    TEXT DEFAULT 'keywords'
    CHECK (routing_type IN ('menu', 'keywords', 'hybrid')),
  persona_traits  TEXT[] DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  setup_complete  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_email ON organizations(email);


-- ============================================
-- 3. SUBSCRIPTIONS (Billing / Kiwify)
-- ============================================
CREATE TABLE subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id           TEXT NOT NULL REFERENCES plans(id),
  status            TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'trial', 'suspended')),

  -- Kiwify
  kiwify_order_id         TEXT UNIQUE,
  kiwify_subscription_id  TEXT,
  kiwify_product_id       TEXT,
  kiwify_customer_email   TEXT,

  -- Período
  started_at          TIMESTAMPTZ DEFAULT now(),
  trial_ends_at       TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end  TIMESTAMPTZ,
  canceled_at         TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_kiwify ON subscriptions(kiwify_order_id);


-- ============================================
-- 4. PROFILES (Usuários via Supabase Auth)
-- ============================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY,  -- = auth.users.id
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name       TEXT,
  email           TEXT NOT NULL,
  role            TEXT DEFAULT 'owner'
    CHECK (role IN ('owner', 'admin', 'agent')),
  avatar_url      TEXT,
  is_active       BOOLEAN DEFAULT true,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_org ON profiles(organization_id);


-- ============================================
-- 5. WHATSAPP INSTANCES (UazAPI)
-- ============================================
CREATE TABLE whatsapp_instances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  instance_name   TEXT DEFAULT 'Principal',

  -- Provider type
  provider        TEXT NOT NULL DEFAULT 'uazapi'
    CHECK (provider IN ('uazapi', 'meta_cloud')),

  -- UazAPI config (quando provider = 'uazapi')
  uazapi_token    TEXT,
  uazapi_url      TEXT,

  -- Meta Cloud API config (quando provider = 'meta_cloud')
  meta_access_token        TEXT,
  meta_phone_number_id     TEXT,
  meta_business_account_id TEXT,
  meta_verify_token        TEXT,

  -- Shared fields
  phone_number    TEXT,
  status          TEXT DEFAULT 'disconnected'
    CHECK (status IN ('connected', 'disconnected', 'qr_pending', 'connecting')),
  webhook_secret  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  last_connected_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_instances_org ON whatsapp_instances(organization_id);
CREATE INDEX idx_instances_secret ON whatsapp_instances(webhook_secret);


-- ============================================
-- 6. SECTORS (Setores + gatilhos unificados)
-- ============================================
CREATE TABLE sectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  icon            TEXT DEFAULT '📂',
  destination     TEXT NOT NULL,
  keywords        TEXT[] DEFAULT '{}',
  response_template TEXT,
  is_active       BOOLEAN DEFAULT true,
  is_fallback     BOOLEAN DEFAULT false,
  priority        INT DEFAULT 0,
  collection_fields JSONB DEFAULT '[]',
  schedule_start  TIME,
  schedule_end    TIME,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sectors_org ON sectors(organization_id);


-- ============================================
-- 7. CONTACTS (Contatos únicos por org)
-- ============================================
CREATE TABLE contacts (
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

CREATE INDEX idx_contacts_org_phone ON contacts(organization_id, phone);


-- ============================================
-- 8. CONVERSATIONS
-- ============================================
CREATE TABLE conversations (
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

CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_status ON conversations(organization_id, status);


-- ============================================
-- 9. MESSAGES
-- ============================================
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  sender_type     TEXT NOT NULL
    CHECK (sender_type IN ('client', 'agent', 'bot')),
  sender_id       UUID,
  uazapi_message_id TEXT,
  status          TEXT DEFAULT 'received'
    CHECK (status IN ('sending', 'sent', 'delivered', 'read', 'received', 'failed')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at);


-- ============================================
-- 10. ROUTING LOGS (Auditoria)
-- ============================================
CREATE TABLE routing_logs (
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

CREATE INDEX idx_routing_logs_org ON routing_logs(organization_id);
CREATE INDEX idx_routing_logs_created ON routing_logs(organization_id, created_at);


-- ============================================
-- 11. USAGE METRICS (Controle mensal de uso)
-- ============================================
CREATE TABLE usage_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period          DATE NOT NULL,  -- '2026-03-01' (primeiro dia do mês)

  -- Contadores
  contacts_count      INT DEFAULT 0,
  messages_sent       INT DEFAULT 0,
  messages_received   INT DEFAULT 0,
  messages_total      INT GENERATED ALWAYS AS (messages_sent + messages_received) STORED,
  conversations_opened INT DEFAULT 0,

  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, period)
);

CREATE INDEX idx_usage_org_period ON usage_metrics(organization_id, period);


-- ============================================
-- 12. FUNCTION: Incrementar uso
-- ============================================
CREATE OR REPLACE FUNCTION increment_usage(
  p_org_id UUID,
  p_type TEXT  -- 'message_sent' | 'message_received' | 'contact' | 'conversation'
) RETURNS void AS $$
DECLARE
  v_period DATE := date_trunc('month', now())::date;
BEGIN
  -- Cria registro do mês se não existir
  INSERT INTO usage_metrics (organization_id, period)
  VALUES (p_org_id, v_period)
  ON CONFLICT (organization_id, period) DO NOTHING;

  -- Incrementa de acordo com o tipo
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
-- 13. FUNCTION: Verificar limites
-- ============================================
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_org_id UUID,
  p_limit_type TEXT  -- 'messages' | 'contacts' | 'sectors' | 'agents' | 'instances'
) RETURNS JSONB AS $$
DECLARE
  v_plan plans%ROWTYPE;
  v_current INT;
  v_max INT;
  v_period DATE := date_trunc('month', now())::date;
BEGIN
  -- Busca plano ativo
  SELECT p.* INTO v_plan
  FROM plans p
  JOIN subscriptions s ON s.plan_id = p.id
  WHERE s.organization_id = p_org_id
    AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_active_plan');
  END IF;

  -- Determina current e max por tipo
  CASE p_limit_type
    WHEN 'messages' THEN
      SELECT COALESCE(messages_sent + messages_received, 0) INTO v_current
      FROM usage_metrics WHERE organization_id = p_org_id AND period = v_period;
      v_current := COALESCE(v_current, 0);
      v_max := v_plan.max_messages_month;

    WHEN 'contacts' THEN
      SELECT COALESCE(contacts_count, 0) INTO v_current
      FROM usage_metrics WHERE organization_id = p_org_id AND period = v_period;
      v_current := COALESCE(v_current, 0);
      v_max := v_plan.max_contacts;

    WHEN 'sectors' THEN
      SELECT count(*) INTO v_current FROM sectors WHERE organization_id = p_org_id;
      v_max := v_plan.max_sectors;

    WHEN 'agents' THEN
      SELECT count(*) INTO v_current FROM profiles WHERE organization_id = p_org_id AND is_active = true;
      v_max := v_plan.max_agents;

    WHEN 'instances' THEN
      SELECT count(*) INTO v_current FROM whatsapp_instances WHERE organization_id = p_org_id;
      v_max := v_plan.max_instances;

    ELSE
      RETURN jsonb_build_object('allowed', false, 'reason', 'invalid_limit_type');
  END CASE;

  -- NULL = ilimitado
  IF v_max IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'current', v_current,
      'max', -1,
      'remaining', -1,
      'usage_percent', 0,
      'plan', v_plan.id
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_current < v_max,
    'current', v_current,
    'max', v_max,
    'remaining', GREATEST(v_max - v_current, 0),
    'usage_percent', round((v_current::numeric / GREATEST(v_max, 1)) * 100, 1),
    'plan', v_plan.id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- 14. RLS (Row Level Security)
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

-- Profiles: user can read own profile
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (id = auth.uid());

-- Org-scoped tables: user can only access their own org's data
CREATE POLICY org_select ON organizations FOR SELECT
  USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY sub_select ON subscriptions FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY instance_select ON whatsapp_instances FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY sector_all ON sectors FOR ALL
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY contact_select ON contacts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY conversation_select ON conversations FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY message_select ON messages FOR SELECT
  USING (conversation_id IN (
    SELECT id FROM conversations
    WHERE organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  ));

CREATE POLICY logs_select ON routing_logs FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY usage_select ON usage_metrics FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));


-- ============================================
-- 15. TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_instances_updated BEFORE UPDATE ON whatsapp_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_sectors_updated BEFORE UPDATE ON sectors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_usage_updated BEFORE UPDATE ON usage_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at();
