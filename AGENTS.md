# AGENTS.md — BMBuildManage

## Contexto del Proyecto
SaaS B2B para gestión de construcción. Máxima prioridad: integridad transaccional, rendimiento de base de datos y protección multi-tenant absoluta.

## Stack
- **API**: NestJS 11 + TypeORM 0.3 (apps/api)
- **Web**: React 19 + Vite 8 + Tailwind 4 (apps/web)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth + JWT via custom guard
- **Monorepo**: Turborepo

## Reglas Inquebrantables

### 1. Seguridad Multi-Tenant (RLS)
- Toda tabla creada o modificada DEBE incluir columna `company_id`
- Implementar políticas Row Level Security (RLS) estrictas para aislar datos por empresa
- **PROHIBIDO**: Usar políticas permisivas como `USING (true)`

### 2. Integridad de Esquema
- Producción: TypeORM con `synchronize: false`
- Toda mutación de esquema mediante migraciones SQL explícitas
- El código ya valida esto: `app.module.ts` lanza error fatal si `synchronize: true` en prod

### 3. Arquitectura de Datos
- Para módulos analíticos: priorizar Vistas Materializadas y CTEs en SQL
- Delegar carga computacional pesada al servidor, no al cliente

### 4. Código Limpio
- **PROHIBIDO**: `console.log`, comentarios de depuración, código comentado en producción

## Commands
```bash
# Root (monorepo)
npm run build       # turbo build
npm run lint        # turbo lint

# API
cd apps/api && npm run dev     # http://localhost:3001/api/v1
cd apps/api && npm run build   # nest build

# Web
cd apps/web && npm run dev     # http://localhost:5173
cd apps/web && npm run typecheck
```

## Arquitectura API

### Estructura de Módulos
```
apps/api/src/modules/{module-name}/
  {name}.entity.ts      # Entidad con company_id obligatorio
  {name}.service.ts     # Lógica de negocio
  {name}.controller.ts  # Endpoints
  {name}.module.ts      # Registro en AppModule
```

### Módulos Activos (32)
Auth, Users, Companies, Projects, Budgets, Stages, Items, Expenses, Workers, 
Worker-Assignments, Worker-Payments, Invoices, APU, Resources, Units, Templates,
Documents, Machinery, Materials, Execution, Contingencies, BIM-Models, BIM-Clashes,
RFIs, Submittals, Punch-List, Schedule, Subcontractors, AI, Audit-Logs, Seed, Clients

### Auth Guard
- Ubicación: `apps/api/src/common/guards/supabase-auth.guard.ts`
- Adjunta al request: `{ id, email, company_id, role }`
- Dev bypass: token `dev-token` (requiere `ALLOW_DEV_TOKEN=true`)

### Entidades con company_id
Todas las entidades ya incluyen `company_id`. Verificar al crear nuevas:
```typescript
@Column()
company_id: string;
```

## Key Files
| Archivo | Propósito |
|---------|-----------|
| `apps/api/src/main.ts` | Entry point API |
| `apps/api/src/app.module.ts` | Root module, config TypeORM |
| `apps/api/src/common/guards/supabase-auth.guard.ts` | Auth middleware |
| `apps/api/src/modules/projects/project.entity.ts` | Entity de referencia |
| `apps/web/src/App.tsx` | Router frontend |
| `apps/web/src/lib/supabase.ts` | Cliente Supabase web |

## Testing Status

### Unit Tests
- **Total**: 908 passing
- **Test Suites**: 131
- **Location**: `apps/api/src/modules/**/*.spec.ts`

### E2E Tests  
- **Total**: 16 passing
- **Location**: `apps/api/test/full-product-suite.spec.ts`

### Test Coverage
- **Statements**: 93.77%
- **Branches**: 76.33%
- **Functions**: 81.02%
- **Lines**: 94.68%

### Test Commands
```bash
cd apps/api
npm run test          # Unit tests (908 passing)
npm run test:e2e     # E2E tests (16 passing)
npm run test:cov     # Coverage report
npm run lint         # Lint check (passing)
```

### Coverage by Module Type
| Type | Coverage | Notes |
|------|----------|-------|
| Services | ~95% | All business logic tested |
| Controllers | ~90% | All endpoints tested |
| Guards/Filters | ~100% | All auth/validation tested |
| Entities | ~85% | Logic methods tested |
| Formula Engine | 100% | Cubication calculations |
| BIM-Clashes | 78.72% | External API integration |
| PDF Export | 90%+ | PDF generation |

### Key Test Files (131 test suites)
```
apps/api/src/modules/*/
├── */services/*.spec.ts      # Service unit tests
├── */controllers/*.spec.ts  # Controller unit tests
├── */entities/*.spec.ts      # Entity unit tests
├── */utils/*.spec.ts         # Utilities (formula-engine)
└── */dto/*.spec.ts          # DTO validation tests

apps/api/src/common/
├── guards/*.spec.ts         # Auth guards
├── filters/*.spec.ts        # Exception filters
├── interceptors/*.spec.ts   # Response transformers
├── decorators/*.spec.ts     # Custom decorators
└── interfaces/*.spec.ts    # Type definitions

apps/api/test/
├── full-product-suite.spec.ts    # E2E: Health, CRUD, Multi-tenant
└── jest-e2e.json                 # E2E config
```

### Recent Improvements
- Added comprehensive tests for bim-clashes.service.ts (35 tests)
- Added tests for auth/guards/roles.guard.ts (16 tests)
- Added tests for projects.service.ts (bulkRemove, payments)
- Added tests for financial.service.ts (calculateBudgetTotals)
- Added tests for pdf-export.service.ts (edge cases)
- Fixed console.error/console.warn violations
- Updated Jest coverage exclusions for non-testable files

### Companies Controller UUID Validation
- Added `IsUUIDValidationPipe` for param validation on `/companies/:id`
- Returns 400 for invalid UUIDs, 404 for non-existent resources

### Non-Covered Files (Not Testable)
- Module files (`.module.ts`) - Dependency wiring only
- Index files - Export declarations
- Config files - Runtime configuration
- Entity columns - TypeORM decorators
- main.ts - Bootstrap code (excluded via Jest config)
- telemetry.service.ts - Browser localStorage (excluded via Jest config)

## Supabase MCP (Database Direct Access)
Configuración: `.opencode/config.json`

El MCP de Supabase permite queries directas a la base de datos para:
- Verificar esquemas y RLS policies
- Hacer queries analíticas
- Debug de datos
- Ejecutar migraciones SQL

Features habilitadas: `docs, account, database, debugging, development, functions, branching`

Para activar: reiniciar OpenCode (cerrar y abrir)

## Env Variables
### API (.env)
```
DATABASE_URL=postgresql://postgres.sfzkrnfyfwonxyceugya:BMBuildManage1102@aws-1-sa-east-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://sfzkrnfyfwonxyceugya.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmemtybmZ5Zndvbnh5Y2V1Z3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjE5MDcsImV4cCI6MjA4ODk5NzkwN30.4AAIwrvdA1LK5w-mDDqvmr_EVzfJ502j6nJ2JT3xjeg...
NODE_ENV=development|production
ALLOW_DEV_TOKEN=true  # solo dev
```

### Web (.env)
```
VITE_SUPABASE_URL=https://sfzkrnfyfwonxyceugya.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmemtybmZ5Zndvbnh5Y2V1Z3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MjE5MDcsImV4cCI6MjA4ODk5NzkwN30.4AAIwrvdA1LK5w-mDDqvmr_EVzfJ502j6nJ2JT3xjeg...
```
