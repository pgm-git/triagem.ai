# Source Tree — Roteador de Atendimento

> Gerado por @po (Pax) — Fase 2: Document Sharding

## Project Structure

```
roteador-atendimento/
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx              # Story 1.2
│   │   ├── (auth)/register/page.tsx           # Story 1.2
│   │   ├── (auth)/layout.tsx                  # Story 1.2
│   │   ├── (dashboard)/layout.tsx             # Story 1.3
│   │   ├── (dashboard)/dashboard/page.tsx     # Story 5.1
│   │   ├── (dashboard)/conversas/page.tsx     # Story 4.1-4.4
│   │   ├── (dashboard)/roteador/page.tsx      # Story 3.3-3.4
│   │   ├── (dashboard)/setores/page.tsx       # Story 3.1-3.2
│   │   ├── (dashboard)/canais/page.tsx        # Story 6.1
│   │   ├── (dashboard)/logs/page.tsx          # Story 5.2
│   │   ├── (dashboard)/configuracoes/page.tsx # Future
│   │   ├── setup/page.tsx                     # Story 2.1-2.5
│   │   ├── setup/layout.tsx                   # Story 2.1
│   │   ├── api/organizations/                 # Story 1.2
│   │   ├── api/sectors/                       # Story 3.1-3.2
│   │   ├── api/rules/                         # Story 3.3-3.4
│   │   ├── api/conversations/                 # Story 4.1-4.3
│   │   ├── api/channels/                      # Story 6.1
│   │   ├── api/webhooks/whatsapp/route.ts     # Story 6.2
│   │   ├── layout.tsx                         # Story 1.1
│   │   └── globals.css                        # Story 1.1
│   ├── components/
│   │   ├── ui/                                # Story 1.1 (shadcn init)
│   │   ├── layout/                            # Story 1.3
│   │   ├── sectors/                           # Story 3.1-3.2
│   │   ├── rules/                             # Story 3.3-3.4
│   │   ├── inbox/                             # Story 4.1-4.3
│   │   ├── wizard/                            # Story 2.1-2.5
│   │   ├── dashboard/                         # Story 5.1
│   │   └── shared/                            # Story 1.3
│   ├── lib/
│   │   ├── supabase/client.ts                 # Story 1.1
│   │   ├── supabase/server.ts                 # Story 1.1
│   │   ├── api/sectors.ts                     # Story 3.1
│   │   ├── api/rules.ts                       # Story 3.3
│   │   ├── api/conversations.ts               # Story 4.1
│   │   ├── api/channels.ts                    # Story 6.1
│   │   ├── routing/engine.ts                  # Story 6.2
│   │   └── utils.ts                           # Story 1.1
│   ├── stores/
│   │   ├── auth.ts                            # Story 1.2
│   │   ├── setup.ts                           # Story 2.1
│   │   ├── inbox.ts                           # Story 4.1
│   │   └── ui.ts                              # Story 1.3
│   ├── types/
│   │   ├── database.ts                        # Story 1.1
│   │   └── index.ts                           # Story 1.1
│   └── hooks/
│       ├── use-sectors.ts                     # Story 3.1
│       ├── use-rules.ts                       # Story 3.3
│       ├── use-conversations.ts               # Story 4.1
│       └── use-realtime.ts                    # Story 4.4
├── supabase/
│   ├── migrations/001_initial_schema.sql      # Story 1.1
│   └── seed.sql                               # Story 1.1
├── tests/
├── .env.local.example                         # Story 1.1
├── package.json                               # Story 1.1
└── next.config.ts                             # Story 1.1
```

## Story → File Mapping

| Story | Key Files |
|-------|-----------|
| 1.1 Setup | `package.json`, `globals.css`, `layout.tsx`, `supabase/`, `types/`, `lib/supabase/` |
| 1.2 Auth | `(auth)/`, `stores/auth.ts`, `middleware.ts` |
| 1.3 Shell | `components/layout/`, `stores/ui.ts`, `(dashboard)/layout.tsx` |
| 2.1-2.5 Wizard | `setup/`, `components/wizard/`, `stores/setup.ts` |
| 3.1-3.2 Setores | `(dashboard)/setores/`, `components/sectors/`, `lib/api/sectors.ts` |
| 3.3-3.4 Roteador | `(dashboard)/roteador/`, `components/rules/`, `lib/api/rules.ts` |
| 4.1-4.4 Inbox | `(dashboard)/conversas/`, `components/inbox/`, `stores/inbox.ts`, `hooks/use-realtime.ts` |
| 5.1 Dashboard | `(dashboard)/dashboard/`, `components/dashboard/` |
| 5.2 Logs | `(dashboard)/logs/` |
| 6.1 Canais | `(dashboard)/canais/`, `lib/api/channels.ts` |
| 6.2 Webhook | `api/webhooks/whatsapp/`, `lib/routing/engine.ts` |
| 6.3 Envio | `components/inbox/message-input.tsx`, `lib/api/conversations.ts` |
