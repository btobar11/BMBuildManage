# AGENTS.md — BMBuildManage

SaaS B2B para gestión de construcción. Máxima prioridad: integridad transaccional, rendimiento DB y protección multi-tenant.

## Stack
- **API**: NestJS 11 + TypeORM 0.3 (`apps/api`)
- **Web**: React 19 + Vite 8 + Tailwind 4 (`apps/web`)
- **DB**: Supabase PostgreSQL
- **Monorepo**: Turborepo

## Reglas Inquebrantables

1. **Multi-Tenant**: Toda tabla DEBE tener `company_id`. RLS estrictas, NO `USING (true)`
2. **Schema**: Prod usa `synchronize: false`. Migraciones SQL explícitas
3. **Código Limpio**: PROHIBIDO `console.log`, depuración en producción

## Commands
```bash
# Root
npm run build       # turbo build
npm run lint        # turbo lint

# API
cd apps/api && npm run dev         # http://localhost:3001/api/v1
cd apps/api && npm run start:dev # watch mode alternativo
cd apps/api && npm run test     # Jest unit (908 tests)
cd apps/api && npm run test:e2e # E2E (16 tests)
cd apps/api && npm run test:cov  # Coverage

# Web  
cd apps/web && npm run dev       # http://localhost:5173
cd apps/web && npm run typecheck # TypeScript
```

## Estructura
```
apps/api/src/modules/{module}/
  {module}.entity.ts      # company_id obligatorio
  {module}.service.ts  
  {module}.controller.ts
  {module}.module.ts

apps/web/src/features/{feature}/
  {Feature}Page.tsx
  components/
```

## Auth
- Guard: `apps/api/src/common/guards/supabase-auth.guard.ts`
- Request: `{ id, email, company_id, role }`
- Dev bypass: token `dev-token` (requiere `ALLOW_DEV_TOKEN=true`)

## Supabase MCP
- Config: `.opencode/config.json`
- Queries directas, migraciones SQL, verificar RLS
- Features: `docs, account, database, debugging, development, functions, branching`

## Módulos API (40+)
Auth, Users, Companies, Clients, Projects, Budgets, Stages, Items, Expenses, Workers, Worker-Assignments, Worker-Payments, Invoices, APU, Resources, Units, Templates, Documents, Machinery, Materials, Execution, Contingencies, BIM-Models, BIM-Clashes, RFIs, Submittals, Punch-List, Schedule, Subcontractors, AI, Audit-Logs, Seed, Analytics, BimApuLink, Purchase-Orders, Subscriptions, Billing, AI-Sales, PLG, Leads