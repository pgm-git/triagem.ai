# Coding Standards — Roteador de Atendimento

> Gerado por @po (Pax) — Fase 2: Document Sharding

## Critical Rules

1. **Supabase Client:** Browser → `@/lib/supabase/client`, Server → `@/lib/supabase/server`. Never import the wrong one.
2. **API Calls:** Use service layer (`@/lib/api/*`), never raw `supabase.from()` in components.
3. **Types:** Import from `@/types/database` (generated). Run `npx supabase gen types typescript` after schema changes.
4. **RLS:** Every new table must have RLS enabled + at least one policy.
5. **Env Vars:** `NEXT_PUBLIC_*` = client-safe. Never expose `SUPABASE_SERVICE_ROLE_KEY`.
6. **Error Handling:** API routes return `{ data, error }` pattern. Frontend shows toast on error.
7. **Components:** Use shadcn/ui as base. Custom components in feature folders (`components/sectors/`, etc).
8. **Server Components:** Default to Server Components. Only use `"use client"` for interactive features.

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `SectorCard.tsx` |
| Hooks | camelCase + `use` | `useSectors.ts` |
| API Routes | kebab-case folders | `/api/routing-logs/` |
| DB Tables | snake_case | `routing_logs` |
| Stores | camelCase + `use` | `useAuthStore` |
| Types | PascalCase | `Conversation` |
| CSS Classes | Tailwind utilities | `className="flex gap-4"` |

## File Organization

- Feature components go in `src/components/{feature}/`
- Shared/reusable → `src/components/shared/`
- shadcn/ui primitives → `src/components/ui/` (auto-generated)
- One component per file, co-locate related components in same folder
