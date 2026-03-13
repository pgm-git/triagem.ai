-- Migração para suporte a personalização (White-label)
-- Tabela: organizations

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#475569',
ADD COLUMN IF NOT EXISTS sidebar_color TEXT DEFAULT '#0f172a',
ADD COLUMN IF NOT EXISTS config_json JSONB DEFAULT '{}';

-- Comentários para documentação
COMMENT ON COLUMN public.organizations.primary_color IS 'Cor principal da marca (Hex)';
COMMENT ON COLUMN public.organizations.secondary_color IS 'Cor secundária/apoio (Hex)';
COMMENT ON COLUMN public.organizations.sidebar_color IS 'Cor de fundo da barra lateral (Hex)';
COMMENT ON COLUMN public.organizations.config_json IS 'Configurações genéricas de UI e comportamento';

-- Garantir que as permissões de RLS permitam o update para Owners/Admins
-- Já existem políticas de UPDATE na organizations em 20260308_production_schema.sql:
-- CREATE POLICY org_update ON organizations FOR UPDATE USING (id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
-- Mas precisamos verificar se o campo role do perfil permite isso. 
-- Atualmente qualquer membro da org pode atualizar. 
-- Vamos restringir para role IN ('admin', 'owner') se necessário no futuro via código ou nova política.
