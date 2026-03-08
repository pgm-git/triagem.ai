# Roteador de Atendimento — Product Requirements Document (PRD)

> **Versão:** 1.0  
> **Data:** 2026-02-27  
> **Autor:** Morgan (@pm) — orquestrado por Orion (@aios-master)  
> **Status:** Draft → Awaiting Review  
> **Input:** [project-brief.md](file:///Users/paulo/Antigravity/Antigravity%20aios/roteador-atendimento/docs/project-brief.md)

---

## 1. Goals and Background Context

### Goals
- Permitir que gestores de atendimento configurem roteamento de conversas WhatsApp em menos de 15 minutos via wizard guiado.
- Automatizar a distribuição de mensagens para setores corretos com taxa de acerto ≥ 90%.
- Garantir fallback humano obrigatório para que nenhuma conversa fique "perdida".
- Entregar um dashboard operacional focado em "próxima ação" para gestão diária.
- Atingir 50 empresas ativas em 6 meses com wizard completion rate ≥ 80%.

### Background Context
Empresas de médio porte no Brasil recebem alto volume de mensagens via WhatsApp sem categorização automática. Atendentes gastam 30-40% do tempo em triagem manual, gerando retrabalho e insatisfação. Soluções existentes (Zendesk, Intercom, Blip) são caras, complexas ou mal adaptadas ao fluxo WhatsApp brasileiro.

O Roteador de Atendimento resolve isso com uma abordagem "progressive disclosure": setup simples em wizard de 5 passos, regras pré-configuradas por templates, e um inbox operacional com visibilidade total do roteamento. O design é inspirado nos melhores padrões SaaS (sidebar colapsável, seletor de conta, dashboard com próxima ação).

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-27 | 1.0 | Versão inicial do PRD | Morgan (@pm) |

---

## 2. Requirements

### Functional Requirements

- **FR1:** O sistema deve permitir registro e login de usuários via email/senha e OAuth (Google).
- **FR2:** O sistema deve apresentar um wizard de configuração de 5 passos sequenciais no primeiro uso.
- **FR3:** No passo 1 do wizard, o usuário deve escolher o tipo de roteamento: Menu (botões), Palavras-chave, ou Híbrido.
- **FR4:** No passo 2, o sistema deve apresentar setores pré-criados editáveis (nome, destino, horário, prioridade).
- **FR5:** No passo 3, o sistema deve listar templates de regras com toggle (ex: "Boleto → Financeiro") e permitir edição via drawer.
- **FR6:** No passo 4, o sistema deve exigir configuração de fallback obrigatório (setor de triagem + mensagem padrão).
- **FR7:** No passo 5, o sistema deve mostrar pré-checklist (setores ok, regras ok, fallback ok) e permitir conectar WhatsApp + enviar teste + ativar.
- **FR8:** O sistema deve oferecer CRUD completo de Setores com cards visuais (nome, destino, horário, status, link para regras).
- **FR9:** O sistema deve permitir criação de setor em modal de 2 passos (nome+ícone → destino+condição).
- **FR10:** O sistema deve oferecer um Roteador de Regras com 3 blocos: Intenções (templates), Palavras-chave (lista), Exceções/horário (colapsado).
- **FR11:** O sistema deve implementar um Rule Builder visual: Se (intenção OU contém palavras) → Então (encaminhar + responder + log).
- **FR12:** O Inbox deve exibir 3 colunas: conversas (com filtros) | mensagens | roteamento+log.
- **FR13:** O Dashboard deve exibir: toggle atendimento, pendências de setup, conversas hoje, motivos de fallback com CTA "Criar regra".
- **FR14:** A navegação deve ter sidebar colapsável + topo com seletor de conta/unidade + botão "Configurar" (wizard).
- **FR15:** O sistema deve registrar logs/auditoria de todas as ações de roteamento.
- **FR16:** O sistema deve permitir gerenciar configurações de empresa, usuários e permissões.
- **FR17:** O sistema deve integrar com WhatsApp Business API para envio e recebimento de mensagens em tempo real.
- **FR18:** O sistema deve aplicar regras de roteamento automaticamente às mensagens recebidas e encaminhar ao setor correto.

### Non-Functional Requirements

- **NFR1:** A interface deve carregar em < 2 segundos (First Contentful Paint).
- **NFR2:** O Inbox deve atualizar em tempo real via WebSocket (latência < 500ms).
- **NFR3:** O sistema deve ser responsivo (desktop-first com suporte a tablet/mobile).
- **NFR4:** Dados de conversas devem ser criptografados at-rest e in-transit.
- **NFR5:** O sistema deve ser LGPD-compliant (consentimento, portabilidade, exclusão de dados).
- **NFR6:** Acessibilidade mínima WCAG AA para todos os componentes interativos.
- **NFR7:** O sistema deve suportar até 1.000 conversas/dia por empresa no MVP.
- **NFR8:** Uptime target de 99.5% para o serviço de roteamento.
- **NFR9:** Autenticação via JWT com refresh token e expiração configurável.

---

## 3. User Interface Design Goals

### Overall UX Vision
Interface clean, moderna e progressiva—inspirada nos melhores SaaS (Linear, Intercom, Resend). O lema é "mostrar o mínimo e ir abrindo opções". O primeiro uso é guiado (wizard), o uso diário é eficiente (inbox + dashboard operacional).

### Key Interaction Paradigms
- **Progressive Disclosure:** Complexidade revelada gradualmente (wizard → dashboard → regras avançadas).
- **1 tela = 1 decisão:** No wizard, cada passo tem CTA único.
- **Card-first > Table-first:** Setores como cards visuais, não tabelas.
- **Drawer pattern:** Edição de regras/templates em drawers laterais, sem navegar para outra página.
- **Rule Builder visual:** Composição de regras com seletores, não campos de texto livre.

### Core Screens and Views
1. **Login / Criar conta** — Auth com email/OAuth
2. **Wizard Setup (5 passos)** — Configuração guiada
3. **Dashboard** — Home operacional com métricas e próxima ação
4. **Inbox (Conversas)** — 3 colunas com filtros e roteamento
5. **Roteador (Regras)** — Rule Builder com 3 blocos
6. **Setores (Destinos)** — CRUD em cards com modal 2-step
7. **Canais** — Conexão WhatsApp (liberado após wizard)
8. **Logs/Auditoria** — Timeline de ações de roteamento
9. **Configurações** — Empresa, usuários, permissões

### Accessibility
WCAG AA — contraste, navegação por teclado, labels em todos os inputs.

### Branding
Design system moderno e minimalista. Dark mode como opção. Tipografia Inter. Paleta de cores sóbria com accent vibrante para CTAs. Sem elementos visuais pesados.

### Target Device and Platforms
Web Responsive — Desktop-first, com layouts adaptativos para tablet e mobile.

---

## 4. Technical Assumptions

### Repository Structure: Monorepo
Monorepo Next.js com App Router. Estrutura `src/app/` para rotas, `src/components/` para UI, `src/lib/` para lógica de negócio.

### Service Architecture
Next.js API Routes para o MVP. Backend e frontend no mesmo projeto. Supabase como BaaS (Auth, Database, Realtime, Storage). Migração para serviços separados planejada para Phase 2.

### Testing Requirements
- **Unit:** Vitest para componentes e lógica de negócio.
- **Integration:** Testing Library para fluxos de tela.
- **E2E:** Playwright para fluxos críticos (wizard, inbox).
- Stories devem incluir testes unitários quando aplicável.

### Additional Technical Assumptions
- Next.js 15+ com App Router e Server Components.
- Tailwind CSS v4 + shadcn/ui para componentes base.
- Zustand para state management do frontend.
- Supabase JS Client para auth, queries e realtime subscriptions.
- WhatsApp Business API via provedor externo (360dialog/Twilio) — abstração de integração.
- Deploy: Vercel (frontend) + Supabase Cloud (backend).

---

## 5. Epic List

- **Epic 1: Fundação & Auth** — Estabelecer projeto, autenticação e layout base (sidebar + navegação).
- **Epic 2: Wizard de Setup** — Implementar o wizard de 5 passos para configuração inicial.
- **Epic 3: Setores & Roteador** — CRUD de setores e Rule Builder para regras de roteamento.
- **Epic 4: Inbox & Mensagens** — Inbox em 3 colunas com conversas em tempo real.
- **Epic 5: Dashboard & Logs** — Dashboard operacional e auditoria de roteamento.
- **Epic 6: Integração WhatsApp** — Conexão com WhatsApp Business API e roteamento automático.

---

## 6. Epic 1: Fundação & Auth

**Goal:** Estabelecer a infraestrutura do projeto com autenticação funcional, layout base com sidebar colapsável e navegação principal. Ao final, o usuário consegue criar conta, logar e ver o shell da aplicação.

### Story 1.1: Setup do Projeto e Infraestrutura Base

**As a** developer,  
**I want** o projeto Next.js configurado com todas as dependências e estrutura de pastas,  
**so that** posso começar a desenvolver features sobre uma base sólida.

**Acceptance Criteria:**
1. Projeto Next.js 15+ criado com App Router e TypeScript.
2. Tailwind CSS v4 configurado e funcional.
3. shadcn/ui inicializado com tema base (cores, tipografia Inter, border-radius).
4. Zustand instalado com store de exemplo funcional.
5. Supabase Client configurado com variáveis de ambiente (`.env.local`).
6. ESLint + Prettier configurados.
7. Estrutura de pastas: `src/app/`, `src/components/`, `src/lib/`, `src/stores/`, `src/types/`.
8. `npm run dev` executa sem erros e exibe página padrão.

### Story 1.2: Autenticação (Login / Cadastro)

**As a** gestor de atendimento,  
**I want** criar uma conta e fazer login no sistema,  
**so that** posso acessar o painel de forma segura.

**Acceptance Criteria:**
1. Página `/login` com formulário de email/senha e botão de OAuth (Google).
2. Página `/register` com formulário de cadastro (nome, email, senha).
3. Integração com Supabase Auth para registro, login e logout.
4. Redirecionamento para `/dashboard` após login bem-sucedido.
5. Middleware de proteção de rotas — páginas internas requerem autenticação.
6. Token JWT armazenado via Supabase Session com refresh automático.
7. Tratamento de erros: email já cadastrado, senha fraca, credenciais inválidas.
8. Design responsivo e alinhado ao design system (Inter, cores, shadcn/ui).

### Story 1.3: Layout Shell (Sidebar + Topbar + Navegação)

**As a** usuário autenticado,  
**I want** ver a estrutura de navegação principal da aplicação,  
**so that** posso navegar entre as seções do sistema.

**Acceptance Criteria:**
1. Layout com sidebar colapsável à esquerda (ícones quando colapsada, ícone + label quando expandida).
2. Itens da sidebar: Dashboard, Conversas, Roteador, Setores, Canais, Logs, Configurações.
3. Topbar com seletor de Unidade/Conta e botão "Configurar" (link para wizard).
4. Sidebar indica visualmente a página ativa.
5. Layout responsivo: sidebar oculta em mobile com hamburger menu.
6. Componente reutilizável `AppShell` que envolve todas as páginas internas.
7. Páginas internas renderizam placeholder "Em construção" com título correto.

---

## 7. Epic 2: Wizard de Setup

**Goal:** Implementar o wizard de configuração de 5 passos que guia o usuário no first-use. Cada passo tem uma decisão principal com CTA único, seguindo o princípio de progressive disclosure.

### Story 2.1: Estrutura do Wizard e Step 1 (Tipo de Roteamento)

**As a** gestor de atendimento,  
**I want** iniciar a configuração guiada e escolher o tipo de roteamento,  
**so that** o sistema saiba como distribuir as conversas.

**Acceptance Criteria:**
1. Página `/setup` com componente Wizard multi-step (progress indicator no topo).
2. Step 1 exibe 3 opções como radio cards: Menu (botões), Palavras-chave, Híbrido.
3. Cada card tem título, ícone e descrição curta.
4. Texto auxiliar: "Você pode mudar depois".
5. CTA único: "Próximo" (desabilitado até selecionar opção).
6. Estado do wizard persistido em Zustand store (sobrevive navegação intra-wizard).
7. Dados do wizard salvos no Supabase ao avançar cada step.

### Story 2.2: Step 2 — Setores Padrão

**As a** gestor de atendimento,  
**I want** ver e editar os setores pré-criados,  
**so that** os destinos do roteamento reflitam minha organização.

**Acceptance Criteria:**
1. Step 2 exibe lista editável de setores pré-criados (card list).
2. Cada card mostra: Nome do setor, Destino (campo editável), Horário (opcional), Prioridade (opcional).
3. Ações disponíveis: "Editar" (inline), "Desativar" (toggle), "+ Novo setor" (adiciona card).
4. Mínimo de 1 setor ativo para avançar.
5. Botões "Voltar" e "Próximo".
6. Setores salvos no Supabase ao avançar.

### Story 2.3: Step 3 — Regras Essenciais (Templates)

**As a** gestor de atendimento,  
**I want** ativar templates de regras de roteamento,  
**so that** as conversas mais comuns já sejam encaminhadas automaticamente.

**Acceptance Criteria:**
1. Step 3 exibe lista de templates com toggle: "Boleto → Financeiro", "Colisão → Sinistro", "Guincho → Assistência 24h", "Cancelamento → Ouvidoria".
2. Cada template pode ser expandido via drawer para edição (palavras-chave, mensagem de confirmação, setor de destino).
3. Templates vinculados aos setores criados no Step 2.
4. Pelo menos 1 template ativo obrigatório para avançar.
5. Dados salvos no Supabase ao avançar.

### Story 2.4: Step 4 — Fallback Obrigatório

**As a** gestor de atendimento,  
**I want** configurar o fallback de triagem humana,  
**so that** nenhuma conversa fique sem atendimento.

**Acceptance Criteria:**
1. Step 4 exibe seletor de setor de triagem (dropdown dos setores ativos).
2. Campo de texto para mensagem padrão (pré-preenchido: "Vou te encaminhar para um atendente").
3. Explicação clara: "Quando a automação não entender a mensagem, o cliente será encaminhado para este setor."
4. Obrigatório: setor selecionado + mensagem preenchida para avançar.
5. Dados salvos no Supabase ao avançar.

### Story 2.5: Step 5 — Conectar WhatsApp

**As a** gestor de atendimento,  
**I want** conectar meu WhatsApp e testar o roteamento,  
**so that** o sistema comece a funcionar de verdade.

**Acceptance Criteria:**
1. Step 5 exibe pré-checklist read-only: "Setores ok ✓", "Regras ok ✓", "Fallback ok ✓".
2. Botão "Conectar WhatsApp" (no MVP pode ser simulado/placeholder com instrução de integração futura).
3. Botão "Enviar teste" que simula uma mensagem e mostra o roteamento resultante.
4. Botão "Ativar" que finaliza o wizard e marca setup como completo.
5. Após ativar, redireciona para `/dashboard` com estado de setup completo.
6. Flag `setup_complete` persistida no perfil do usuário no Supabase.

---

## 8. Epic 3: Setores & Roteador

**Goal:** Implementar o CRUD completo de setores (visual em cards) e o Rule Builder para criação e gestão de regras de roteamento com progressive disclosure (3 blocos).

### Story 3.1: Tela de Setores (Listagem e Cards)

**As a** gestor de atendimento,  
**I want** visualizar todos os setores cadastrados como cards,  
**so that** tenha uma visão geral dos destinos de roteamento.

**Acceptance Criteria:**
1. Página `/setores` com header "Setores e destinos" + botão "+ Novo setor".
2. Listagem em cards com: Nome do setor, Destino principal, Horário (badge), Status (Ativo/Inativo).
3. Cada card tem link "Ver regras usando este setor".
4. Empty state quando não há setores: ilustração + CTA para criar.
5. Dados carregados do Supabase com loading skeleton.
6. Filtro por status (Ativo/Inativo/Todos).

### Story 3.2: CRUD de Setores (Criar e Editar)

**As a** gestor de atendimento,  
**I want** criar e editar setores,  
**so that** possa manter os destinos atualizados.

**Acceptance Criteria:**
1. Modal "Novo setor" com 2 passos: (1) Nome + ícone opcional, (2) Destino + "Quando encaminhar" via seletores.
2. Edição via modal pré-preenchido ao clicar "Editar" no card.
3. Toggle de ativar/desativar setor diretamente no card.
4. Confirmação antes de desativar setor com regras vinculadas.
5. Validação: nome único, destino obrigatório.
6. Operações CRUD refletidas no Supabase em tempo real.

### Story 3.3: Tela do Roteador (Regras — 3 Blocos)

**As a** gestor de atendimento,  
**I want** ver e gerenciar as regras de roteamento organizadas em blocos,  
**so that** possa controlar como as conversas são distribuídas.

**Acceptance Criteria:**
1. Página `/roteador` com 3 blocos: Intenções (templates), Palavras-chave (lista), Exceções/horário (colapsado por padrão).
2. Bloco "Intenções" mostra templates com toggle on/off e botão editar.
3. Bloco "Palavras-chave" mostra lista de keywords com setor de destino associado.
4. Bloco "Exceções" colapsado, mostra regras de horário e exceções ao expandir.
5. Botão "+ Nova Regra" em cada bloco.
6. Dados carregados do Supabase.

### Story 3.4: Rule Builder Visual

**As a** gestor de atendimento,  
**I want** criar regras de roteamento com um builder visual,  
**so that** não precise escrever lógica complexa manualmente.

**Acceptance Criteria:**
1. Drawer lateral "Nova Regra" com Rule Builder visual.
2. Condição (Se): seletor de intenção OU campo de palavras-chave (multi-select/tags).
3. Ação (Então): seletor de setor destino + template de resposta ao cliente.
4. Toggle "Criar registro/log" (sempre ligado por padrão).
5. Preview da regra em linguagem natural: "Se a mensagem contém 'boleto' → encaminhar para Financeiro".
6. Salvar regra no Supabase e atualizar a lista no bloco correspondente.

---

## 9. Epic 4: Inbox & Mensagens

**Goal:** Implementar o inbox em 3 colunas com conversas em tempo real, permitindo ao atendente visualizar mensagens, verificar roteamento e reencaminhar quando necessário.

### Story 4.1: Inbox — Layout 3 Colunas e Lista de Conversas

**As a** atendente,  
**I want** ver a lista de conversas organizadas por filtro,  
**so that** possa focar nos atendimentos da minha área.

**Acceptance Criteria:**
1. Página `/conversas` com layout 3 colunas: lista de conversas | mensagens | painel de roteamento.
2. Coluna esquerda: lista de conversas com avatar, nome, preview da última mensagem, timestamp.
3. Filtros no topo: Triagem, Sinistro, Financeiro, Não classificado (baseados nos setores).
4. Badge de contagem de mensagens não lidas por conversa.
5. Conversas ordenadas por última atividade (mais recente primeiro).
6. Dados carregados do Supabase com loading skeleton.

### Story 4.2: Inbox — Visualização de Mensagens

**As a** atendente,  
**I want** visualizar as mensagens de uma conversa selecionada,  
**so that** possa entender o contexto e responder.

**Acceptance Criteria:**
1. Coluna central exibe mensagens da conversa selecionada em formato chat (balões).
2. Diferenciação visual entre mensagens do cliente (esquerda) e do atendente (direita).
3. Cada mensagem mostra: texto, timestamp, status de leitura.
4. Campo de input para resposta com botão enviar (no MVP, salva no Supabase).
5. Scroll automático para a mensagem mais recente.
6. Empty state quando nenhuma conversa está selecionada.

### Story 4.3: Inbox — Painel de Roteamento e Reencaminhar

**As a** atendente,  
**I want** ver o roteamento atual da conversa e poder reencaminhar,  
**so that** possa corrigir classificações incorretas.

**Acceptance Criteria:**
1. Coluna direita exibe: setor atual, regra que roteou (se automático), timeline/log.
2. Botão "Reencaminhar" abre dropdown com lista de setores ativos.
3. Reencaminhar atualiza o setor da conversa no Supabase e registra no log.
4. Timeline mostra histórico: criação → roteamento automático → reencaminhamentos → status.
5. Informações do contato: nome, telefone, primeira mensagem.

### Story 4.4: Inbox — Real-time com Supabase

**As a** atendente,  
**I want** receber novas mensagens em tempo real,  
**so that** não precise atualizar a página manualmente.

**Acceptance Criteria:**
1. Supabase Realtime subscription ativa para tabela de mensagens.
2. Nova mensagem aparece instantaneamente na conversa aberta (sem refresh).
3. Nova conversa aparece na lista da coluna esquerda automaticamente.
4. Badge de não-lidas atualiza em tempo real.
5. Indicador visual (flash/highlight) quando nova mensagem chega.

---

## 10. Epic 5: Dashboard & Logs

**Goal:** Implementar o dashboard operacional focado em "próxima ação" e a tela de logs/auditoria para rastreabilidade completa do roteamento.

### Story 5.1: Dashboard Operacional

**As a** gestor de atendimento,  
**I want** ver o status operacional do meu atendimento numa tela,  
**so that** saiba o que precisa da minha atenção agora.

**Acceptance Criteria:**
1. Página `/dashboard` como home após login.
2. Card "Atendimento ativo?" com toggle on/off.
3. Card "Pendências do setup" (visível se setup incompleto) com link para wizard.
4. Card "Conversas hoje" com contagem total + "Em triagem" (aguardando classificação).
5. Card "Principais motivos de fallback" (top 3 motivos) + CTA "Criar regra" linkando para `/roteador`.
6. Dados carregados do Supabase com atualização periódica (polling ou realtime).
7. Layout responsivo em grid de cards.

### Story 5.2: Tela de Logs/Auditoria

**As a** gestor de atendimento,  
**I want** ver o histórico de ações de roteamento,  
**so that** possa auditar e investigar problemas.

**Acceptance Criteria:**
1. Página `/logs` com tabela de eventos: timestamp, tipo (roteamento/reencaminhar/fallback), conversa, setor origem, setor destino, regra aplicada.
2. Filtros: data range, tipo de evento, setor.
3. Paginação server-side (20 itens por página).
4. Exportar logs como CSV (botão no header).
5. Link na coluna "Conversa" que abre a conversa no inbox.

---

## 11. Epic 6: Integração WhatsApp

**Goal:** Conectar o sistema com a WhatsApp Business API para receber mensagens reais e aplicar roteamento automático em produção.

### Story 6.1: Abstração de Canal e Tela de Canais

**As a** gestor de atendimento,  
**I want** ver os canais conectados e gerenciar o WhatsApp,  
**so that** possa administrar de onde vêm as conversas.

**Acceptance Criteria:**
1. Página `/canais` com lista de canais disponíveis (WhatsApp como primeiro/único no MVP).
2. Card do canal mostra: nome, status (conectado/desconectado), número, data de conexão.
3. Botão "Conectar" inicia fluxo de integração.
4. Abstração `ChannelProvider` no código para suportar futuros canais (Telegram, Instagram).
5. Status do canal atualizado em tempo real.

### Story 6.2: Webhook de Recebimento e Roteamento Automático

**As a** sistema,  
**I want** receber mensagens do WhatsApp via webhook e aplicar roteamento,  
**so that** conversas sejam distribuídas automaticamente.

**Acceptance Criteria:**
1. API Route `/api/webhooks/whatsapp` recebe mensagens do provedor (360dialog/Twilio).
2. Mensagem recebida é salva na tabela `messages` do Supabase.
3. Engine de roteamento aplica regras na ordem: Intenções → Palavras-chave → Exceções → Fallback.
4. Conversa é atribuída ao setor correto e aparece no Inbox em tempo real.
5. Log de roteamento registrado na tabela `routing_logs`.
6. Se nenhuma regra match, aplica fallback obrigatório.
7. Mensagem de confirmação enviada ao cliente via API do provedor.

### Story 6.3: Envio de Mensagens via WhatsApp

**As a** atendente,  
**I want** responder mensagens do cliente diretamente pelo Inbox,  
**so that** não precise usar outro aplicativo para responder.

**Acceptance Criteria:**
1. Campo de resposta no Inbox envia mensagem via API do provedor WhatsApp.
2. Mensagem enviada salva no Supabase e aparece no chat instantaneamente.
3. Status de envio: enviando → enviado → entregue → lido (quando suportado pelo provedor).
4. Tratamento de erro: mensagem não enviada → retry visual + notificação.
5. Rate limiting: respeitar limites do provedor WhatsApp.

---

## 12. Checklist Results Report

*A ser preenchido pelo @po durante a validação dos artefatos.*

---

## 13. Next Steps

### UX Expert Prompt
> @ux-design-expert: Use este PRD e o project-brief.md para criar a Frontend Specification (`front-end-spec.md`). Foque em: design system tokens, inventário de componentes (Atomic Design), mapa de telas com wireframes de baixa fidelidade, e padrões de interação (wizard, drawer, inbox 3-col, rule builder).

### Architect Prompt
> @architect: Use este PRD, o project-brief.md e o front-end-spec.md para criar a Fullstack Architecture (`fullstack-architecture.md`). Defina: estrutura de pastas, schema de banco (Supabase), API Routes, integração WhatsApp, estratégia de deploy, e decisões de infra.

---

*— Morgan, orquestrando o produto 📋*
