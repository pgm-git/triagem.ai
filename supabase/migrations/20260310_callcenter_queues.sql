-- ============================================
-- Sprint 8: Call Center Centralizado
-- Modificações nas tabelas Conversations e Agents
-- ============================================

-- 1. Atualizar a restrição de status da tabela conversations
-- Precisamos soltar a constraint antiga e criar uma nova para aceitar queues
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('pending_triage', 'waiting_agent', 'in_progress', 'resolved', 'active'));

-- 2. Adicionar colunas de rastreamento SLA e Agente Humano à tabela conversations
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS queued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS in_progress_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Índices úteis para visualização rápida das Filas e Meus Atendimentos
CREATE INDEX IF NOT EXISTS idx_conversations_agent ON public.conversations(agent_id);

-- 3. Tabela de Vinculação: Agentes <-> Setores
CREATE TABLE IF NOT EXISTS public.agent_sectors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sector_id       UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, sector_id) -- Impede que o mesmo humano seja atrelado 2x ao mesmo setor
);

-- Índices para navegação bidirecional
CREATE INDEX IF NOT EXISTS idx_agent_sectors_profile ON public.agent_sectors(profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_sectors_sector ON public.agent_sectors(sector_id);

-- RLS (Row Level Security) - Os membros leem a tabela de setores dos agentes, admins podem escrever
ALTER TABLE public.agent_sectors ENABLE ROW LEVEL SECURITY;

-- Visualização ampla: qualquer nó na org vê quem tá em qual setor
CREATE POLICY agent_sectors_select ON public.agent_sectors FOR SELECT
  USING (
    sector_id IN (
      SELECT id FROM public.sectors 
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- Escrita: Permissão ampla (como o app tem auth simplificada de donos)
CREATE POLICY agent_sectors_all ON public.agent_sectors FOR ALL
  USING (
    sector_id IN (
      SELECT id FROM public.sectors 
      WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );
