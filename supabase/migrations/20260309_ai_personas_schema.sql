-- =============================================
-- SPRINT 3: AI Routing pipeline & Personas
-- =============================================

-- Tabela para guardar configuraçoes de IA da empresa (1:1 com organizations)
CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  ai_provider TEXT DEFAULT 'openai',
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  ai_temperature NUMERIC DEFAULT 0.7,
  custom_prompt_base TEXT, -- Instruçoes base customizadas (ex: Nome da empresa, regras principais)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Arquétipos (Personas)
CREATE TABLE IF NOT EXISTS ai_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,          -- ex: 'Vendedor Consultivo'
  description TEXT,            -- ex: 'Especialista em fechamentos, usa gatilhos mentais'
  prompt_instructions TEXT,    -- ex: 'Sempre ofereça desconto no final. Seja urgente.'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_personas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para organization_settings
CREATE POLICY "Users can view settings of their organizations"
  ON organization_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.organization_id = organization_settings.organization_id
    )
  );

CREATE POLICY "Admins can update settings of their org"
  ON organization_settings FOR UPDATE
  USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE memberships.user_id = auth.uid()
        AND memberships.organization_id = organization_settings.organization_id
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- Políticas de RLS para ai_personas
CREATE POLICY "Users can view personas of their organizations"
  ON ai_personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.organization_id = ai_personas.organization_id
    )
  );

CREATE POLICY "Admins can insert personas to their org"
  ON ai_personas FOR INSERT
  WITH CHECK (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE memberships.user_id = auth.uid()
        AND memberships.organization_id = ai_personas.organization_id
        AND memberships.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update personas of their org"
  ON ai_personas FOR UPDATE
  USING (
    EXISTS (
        SELECT 1 FROM memberships
        WHERE memberships.user_id = auth.uid()
        AND memberships.organization_id = ai_personas.organization_id
        AND memberships.role IN ('owner', 'admin')
    )
  );

-- Trigger atualizada para criar organization_settings automaticamente quando criar a org
CREATE OR REPLACE FUNCTION public.handle_new_org_for_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
    
    -- NOVO: Inserir configurações base da IA para a nova organização
    INSERT INTO organization_settings (organization_id, ai_temperature)
    VALUES (v_org_id, 0.7);

    -- NOVO: Inserir persona padrão
    INSERT INTO ai_personas (organization_id, name, description, prompt_instructions)
    VALUES (
      v_org_id, 
      'Assistente Padrão', 
      'Atendente educado e objetivo', 
      'Você é um assistente virtual útil e educado. Responda de forma clara e objetiva. Tente entender o que o usuário quer para encaminhá-lo ao setor correto.'
    );
    
    INSERT INTO sectors (organization_id, name, icon, destination, keywords, response_template, priority) VALUES
      (v_org_id, 'Financeiro', '💰', '', ARRAY['boleto', 'pagamento', 'pagar', 'fatura', 'cobrança'], 'Vou encaminhar você para o setor Financeiro. Aguarde um momento.', 0),
      (v_org_id, 'Comercial', '🤝', '', ARRAY['preço', 'orçamento', 'cotação', 'proposta', 'comprar'], 'Encaminhando para o Comercial. Em breve um consultor irá atendê-lo.', 1),
      (v_org_id, 'Suporte', '🛠️', '', ARRAY['erro', 'bug', 'não funciona', 'ajuda', 'suporte', 'problema'], 'Encaminhando para o Suporte Técnico. Aguarde!', 2);

    INSERT INTO sectors (organization_id, name, icon, destination, is_fallback, fallback_message, priority)
    VALUES (v_org_id, 'Triagem', '📋', '', true, 'Vou te encaminhar para um atendente. Aguarde um momento.', 99);
  END IF;
  
  RETURN NEW;
END;
$$;
