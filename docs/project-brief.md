# Project Brief: Roteador de Atendimento

> **Versão:** 1.0  
> **Data:** 2026-02-27  
> **Autor:** Atlas (@analyst) — orquestrado por Orion (@aios-master)  
> **Status:** Draft → Awaiting Review

---

## 1. Executive Summary

**Roteador de Atendimento** é um SaaS B2B que permite empresas automatizarem a distribuição de conversas recebidas via WhatsApp (e futuramente outros canais) para os setores corretos da organização, usando regras baseadas em intenção, palavras-chave e menus interativos.

O produto resolve o problema de **roteamento manual e ineficiente** de atendimentos, onde mensagens de clientes ficam presas em filas genéricas, gerando atraso, perda de contexto e insatisfação. A proposta é substituir esse processo por um **roteador inteligente configurável** com setup assistido em wizard (5 passos), eliminando a necessidade de integrações complexas ou conhecimento técnico.

**Proposta de valor:** Configurar roteamento de atendimento em minutos, não em semanas. Setup guiado, regras pré-configuradas, e fallback humano garantido.

---

## 2. Problem Statement

### Dor atual
- Empresas de médio porte (seguradoras, clínicas, e-commerces) recebem alto volume de mensagens via WhatsApp sem categorização automática.
- Atendentes gastam tempo classificando e reencaminhando manualmente.
- Não existe visibilidade sobre motivos de fallback ou gargalos de atendimento.
- Soluções existentes (Zendesk, Intercom) são caras, complexas e pouco adaptadas ao WhatsApp brasileiro.

### Impacto
- **Tempo perdido:** 30-40% do tempo do atendente em triagem manual.
- **Perda de clientes:** Mensagens sem resposta em horário comercial geram abandono.
- **Retrabalho:** Conversas encaminhadas para setor errado precisam ser retransferidas.

### Por que soluções existentes falham
- CRMs tradicionais não têm roteamento nativo por WhatsApp.
- Bots de atendimento são "tudo ou nada" — ou full automation ou nada.
- Não oferecem "progressive disclosure" no setup — sobrecarregam o admin.

---

## 3. Proposed Solution

Um **dashboard SaaS com setup em wizard** que permite configurar roteamento de atendimento em 5 passos progressivos, seguido de uma interface operacional para gerenciar conversas no dia-a-dia.

### Diferenciadores
1. **Setup em Wizard (5 passos):** Uma tela = uma decisão. CTA único. Zero sobrecarga.
2. **Templates de regras pré-configurados:** "Boleto → Financeiro", "Guincho → Assistência 24h" já prontos.
3. **Fallback obrigatório:** Triagem humana sempre garantida — sem "buracos" na automação.
4. **Progressive Disclosure:** Complexidade revelada gradualmente, não despejada de uma vez.
5. **Dashboard operacional:** Foco em "próxima ação", não em relatórios passivos.

### Visão de alto nível
O produto funciona como um **roteador inteligente**: recebe fluxo de conversas → aplica regras → encaminha ao setor correto → fornece visibilidade operacional em tempo real.

---

## 4. Target Users

### Segmento Primário: Gestor de Atendimento / Coordenador de Operações
- **Perfil:** Profissional não-técnico, responsável por atendimento ao cliente em empresas de 20-200 funcionários.
- **Comportamento atual:** Usa WhatsApp Business ou WhatsApp Web com planilhas paralelas para rastrear atendimentos.
- **Dor:** Não consegue garantir que a mensagem certa chegue ao setor certo no tempo certo.
- **Objetivo:** Automatizar a distribuição de atendimentos sem precisar de desenvolvedor ou consultoria.

### Segmento Secundário: Atendente / Operador de Setor
- **Perfil:** Profissional operacional que recebe e responde conversas.
- **Comportamento atual:** Recebe tudo numa fila genérica, precisa ler e decidir se é "seu" antes de responder.
- **Dor:** Perde tempo com mensagens que não são da sua área.
- **Objetivo:** Receber apenas conversas relevantes ao seu setor, com contexto.

---

## 5. Goals & Success Metrics

### Business Objectives
- Atingir 50 empresas ativas em 6 meses pós-lançamento.
- Taxa de conclusão do wizard de setup ≥ 80%.
- Tempo médio de setup < 15 minutos.
- Taxa de churn mensal < 5%.

### User Success Metrics
- Redução de 60% no tempo de triagem manual.
- 90%+ das conversas roteadas automaticamente no setor correto.
- NPS ≥ 50 após 30 dias de uso.

### KPIs
- **Wizard Completion Rate:** % de usuários que completam o wizard de 5 passos.
- **Auto-routing Accuracy:** % de conversas roteadas corretamente sem intervenção humana.
- **Fallback Rate:** % de conversas que caem em triagem humana (meta: < 20%).
- **Time to First Value:** Tempo entre cadastro e primeiro roteamento bem-sucedido.

---

## 6. MVP Scope

### Core Features (Must Have)

- **Login / Criar conta:** Autenticação com email/senha ou OAuth.
- **Wizard "Configurar em 5 passos":**
  1. Escolher tipo de roteamento (Menu, Palavras-chave, Híbrido).
  2. Definir setores e destinos (tabela editável).
  3. Configurar regras essenciais (templates com toggle).
  4. Definir fallback obrigatório (setor de triagem + mensagem padrão).
  5. Conectar WhatsApp (pré-checklist + conectar + testar + ativar).
- **Tela "Setores" (CRUD):** Cards com nome, destino, horário, status. Modal de criação com 2 passos.
- **Tela "Roteador" (Regras):** 3 blocos (Intenções, Palavras-chave, Exceções). Rule Builder visual.
- **Inbox:** 3 colunas (conversas ← mensagens → roteamento/log). Filtros por setor/status.
- **Dashboard operacional:** Toggle atendimento, pendências de setup, conversas hoje, motivos de fallback com CTA "Criar regra".
- **Sidebar colapsável + seletor de conta/unidade.**

### Out of Scope for MVP
- Integração com canais além de WhatsApp (Telegram, Instagram, etc.).
- IA generativa para resposta automática.
- Relatórios avançados e analytics.
- App mobile nativo.
- Multi-idioma.
- Integração com CRMs de terceiros (Salesforce, HubSpot).
- Marketplace de templates/integrações.

### MVP Success Criteria
O MVP é bem-sucedido quando um gestor de atendimento consegue, sozinho, em menos de 15 minutos: configurar o roteamento, conectar o WhatsApp, e ter a primeira conversa roteada automaticamente para o setor correto.

---

## 7. Post-MVP Vision

### Phase 2 Features
- Integração com Telegram e Instagram Direct.
- Dashboard analítico com métricas históricas.
- Regras avançadas com condições compostas (if/else aninhado).
- Notificações via push e email para atendentes.
- API pública para integrações de terceiros.

### Long-term Vision (12-24 meses)
- Plataforma omnichannel completa com IA de classificação automática.
- Marketplace de templates de roteamento por vertical (Saúde, Seguros, E-commerce).
- White-label para revendedores/agências.
- Módulo de voz (telefonia) integrado ao roteamento.

### Expansion Opportunities
- Verticalização para seguradoras (sinistro, guincho, apólice).
- Pacotes por tamanho de empresa (Starter, Pro, Enterprise).
- Parcerias com provedores de WhatsApp Business API (360dialog, Twilio, Meta).

---

## 8. Technical Considerations

### Platform Requirements
- **Target Platforms:** Web (SPA responsiva, desktop-first com suporte mobile).
- **Browser Support:** Chrome, Firefox, Safari, Edge (últimas 2 versões).
- **Performance:** Dashboard carrega em < 2s; inbox com atualização real-time (WebSocket).

### Technology Preferences
- **Frontend:** Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui.
- **Backend:** Next.js API Routes ou servidor Node.js separado (a definir na arquitetura).
- **Database:** Supabase (PostgreSQL gerenciado + Auth + Realtime).
- **Hosting/Infrastructure:** Vercel (frontend) + Supabase Cloud (backend/DB).
- **State Management:** Zustand para estados globais do frontend.

### Architecture Considerations
- **Repository Structure:** Monorepo com estrutura Next.js (app router).
- **Service Architecture:** API Routes do Next.js para MVP; possível migração para microserviços no Phase 2.
- **Integration Requirements:** WhatsApp Business API (via 360dialog ou Twilio), WebSocket para real-time.
- **Security/Compliance:** LGPD compliance obrigatório; dados de conversa criptografados; auth com JWT + refresh token.

---

## 9. Constraints & Assumptions

### Constraints
- **Budget:** Bootstrapped / early-stage — minimizar custos de infra.
- **Timeline:** MVP funcional em ~8-12 semanas.
- **Resources:** Equipe enxuta (AI-assisted development via AIOS agents).
- **Technical:** Dependência de provedores de WhatsApp Business API (custo variável por mensagem).

### Key Assumptions
- Empresas-alvo já possuem número de WhatsApp Business ativo.
- O volume de mensagens do MVP suporta até 1.000 conversas/dia por empresa.
- O Supabase Realtime é adequado para o volume de mensagens em tempo real do MVP.
- O modelo de precificação será SaaS com mensalidade fixa + franquia de mensagens.

---

## 10. Risks & Open Questions

### Key Risks
- **Dependência de API WhatsApp:** Meta pode alterar políticas/preços sem aviso. Mitigação: abstrair integração para suportar múltiplos provedores.
- **Precisão do roteamento:** Rules baseadas em palavras-chave podem ter falsos positivos. Mitigação: fallback obrigatório + métricas de acerto visíveis no dashboard.
- **Custo de infraestrutura:** Messages via WhatsApp Business API têm custo. Mitigação: modelo de precificação que repasse custo ao cliente.
- **Onboarding sem suporte:** Wizard sem assistência pode falhar para usuários menos técnicos. Mitigação: tooltips contextuais + "Enviar teste" obrigatório antes de ativar.

### Open Questions
- Qual provedor de WhatsApp Business API usar no MVP (360dialog vs Twilio vs Meta Cloud)?
- Modelo de precificação detalhado (tiers, franquias)?
- Precisa de suporte a múltiplas unidades/filiais desde o MVP?
- A conexão com WhatsApp será via QR Code (Web) ou via API oficial?

### Areas Needing Further Research
- Comparação de custos entre provedores de WhatsApp API.
- Benchmark de concorrentes brasileiros (Blip, Take, Maxbot).
- Regulamentações LGPD específicas para armazenamento de conversas de WhatsApp.

---

## 11. Next Steps

### Immediate Actions
1. ✅ Project Brief criado (este documento).
2. → Próximo: @pm criar o PRD (`docs/prd.md`) com base neste brief.
3. → @ux-design-expert criar a Frontend Spec (`docs/front-end-spec.md`).
4. → @architect definir a Fullstack Architecture (`docs/fullstack-architecture.md`).

### PM Handoff
Este Project Brief fornece o contexto completo para o **Roteador de Atendimento**. O próximo agente (@pm) deve começar em 'PRD Generation Mode', revisando este brief para criar o PRD seção por seção, pedindo clarificações ou sugerindo melhorias conforme necessário.

---

*— Atlas, investigando a verdade 🔎*
