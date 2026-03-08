# TrackerAi Pro

Roteamento inteligente de conversas WhatsApp para equipes de atendimento.

## Stack

- **Next.js 16** (App Router + Turbopack)
- **Supabase** (Auth + Postgres + RLS)
- **Tailwind CSS 4** + shadcn/ui
- **Zustand** (state management)
- **Vitest** (testes unitários)

## Funcionalidades

- ⚡ **Routing Engine** — direciona mensagens por palavras-chave com prioridade
- 🔄 **Fallback automático** — encaminha para triagem quando nenhuma regra bate
- 🧪 **Simulador de Roteamento** — teste interativo no dashboard
- 📊 **Dashboard operacional** — métricas em tempo real
- 🏢 **Multi-setor** — Financeiro, Comercial, Suporte, Ouvidoria...
- 📱 **Webhook WhatsApp** — recebe mensagens via API
- 🔐 **Autenticação** — login/registro com Supabase Auth

## Rodando localmente

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local

# Rodar em dev
npm run dev

# Rodar testes
npm test
```

Acesse `http://localhost:3000`

## Estrutura

```
src/
├── app/              # Pages (App Router)
│   ├── (auth)/       # Login, Register
│   ├── (dashboard)/  # Dashboard, Conversas, Setores, Simulador
│   ├── api/          # Webhooks + Simulate endpoint
│   └── setup/        # Wizard de configuração
├── components/       # UI components
├── lib/
│   ├── routing/      # Engine de roteamento
│   ├── api/          # API clients
│   └── supabase/     # Supabase clients
├── stores/           # Zustand stores
└── types/            # TypeScript types
```

## Testes

```bash
npm test
# ✓ tests/api/routing-engine.test.ts (7 tests)
# ✓ tests/api/webhook.test.ts (5 tests)
# Tests: 12 passed
```
