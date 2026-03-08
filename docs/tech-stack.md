# Tech Stack — Roteador de Atendimento

> Gerado por @po (Pax) — Fase 2: Document Sharding

## Core Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.x |
| Framework | Next.js (App Router) | 15.x |
| Runtime | Node.js | 22.x |
| CSS | Tailwind CSS | 4.x |
| Components | shadcn/ui (Radix) | latest |
| State | Zustand | 5.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Auth | Supabase Auth | latest |
| Realtime | Supabase Realtime | latest |
| Icons | Lucide React | latest |
| Forms | React Hook Form + Zod | latest |
| Testing | Vitest + Playwright | latest |
| Deploy | Vercel + Supabase Cloud | — |
| CI/CD | GitHub Actions | — |

## Commands

```bash
# Dev
npm run dev              # Next.js dev (port 3000)
npx supabase start       # Local Supabase (port 54321)

# Test
npm run test             # Vitest
npm run test:e2e         # Playwright

# Build
npm run build            # Production build
npm run lint             # ESLint
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_WEBHOOK_SECRET=
WHATSAPP_API_KEY=
WHATSAPP_API_URL=
```
