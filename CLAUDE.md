# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BM Build Manage is a construction management SaaS for Chilean contractors. It handles budgets, APUs (Análisis de Precios Unitarios), BIM model management, worker management, and project scheduling.

## Build Commands

```bash
# Root level (turbo monorepo)
npm run build        # Build all apps
npm run dev         # Run all apps in dev mode (watch)

# API (NestJS)
cd apps/api
npm run build       # Compile to dist/
npm run start:dev   # Watch mode with hot reload
npm run lint         # ESLint with auto-fix
npm run test         # Jest unit tests
npm run test:watch  # Jest watch mode
npm run test:cov    # Coverage report

# Web (React + Vite)
cd apps/web
npm run dev         # Vite dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # TypeScript checks
npm run test         # Vitest tests
npm run test:watch   # Vitest watch mode
```

## Architecture

### Monorepo Structure

```
apps/
├── api/           # NestJS backend (TypeORM + Supabase)
│   └── src/
│       ├── modules/          # Feature modules (budgets, projects, bim-models, etc.)
│       ├── common/           # Shared: guards, interceptors, filters, decorators, DTOs
│       └── config/           # App, database, Supabase config
├── web/            # React 19 frontend (Vite + TanStack)
│   └── src/
│       ├── features/         # Feature pages (auth, budget, bim, dashboard, etc.)
│       ├── components/      # Shared UI components (ui/, auth/, layout/)
│       ├── context/         # React contexts (Auth, Theme, Notifications)
│       ├── hooks/           # Custom React hooks
│       └── lib/             # API client, utilities
└── packages/
    └── types/     # Shared TypeScript interfaces (Project, Budget, Stage, Item, etc.)
```

### Backend Architecture

**Multi-tenancy**: Supabase-based auth with JWT passport strategy. Row Level Security (RLS) policies enforce tenant isolation at the database level.

**API Modules** (in `apps/api/src/modules/`):
- `budgets/` - Budget management with version control
- `projects/` - Project CRUD
- `apu/` - Análisis de Precios Unitarios (unit price analysis)
- `bim-models/` - IFC model uploads and metadata
- `bim-clashes/` - Clash detection results
- `items/` - Budget line items (belongs to stages)
- `stages/` - Budget stages grouping items
- `workers/` - Worker management with assignments
- `invoices/` - Invoice uploads
- `documents/` - Project documents
- `ai/` - AI-powered BIM analytics, reports, and budget assistance
- `schedule/` - Project scheduling
- Other: companies, clients, resources, expenses, contingencies, subcontractors, submittals, punch-list, rfis, audit-logs, templates, units, users

**Auth Flow**:
1. `SupabaseAuthGuard` validates JWT from Authorization header
2. `@GetCurrentUser()` decorator extracts user from token
3. `RolesGuard` enforces role-based access

**Budget Hierarchy**: Budget → Stages → Items (items have quantity, unitCost, totalCost)

### Frontend Architecture

**State Management**: TanStack Query for server state, React Context for UI state (Auth, Theme, Notifications)

**Key Libraries**:
- `@thatopen/components` + `@thatopen/components-front` - BIM/IFC 3D viewing
- `@tanstack/react-table` - Budget tables with inline editing
- `react-router-dom` v7 - Routing
- `framer-motion` - Animations
- `tailwindcss` v4 - Styling

**Feature Pages** (in `apps/web/src/features/`):
- `auth/` - Login, Register, Onboarding
- `budget/` - BudgetEditor, BudgetTable, CubicacionModal, BIM tab, Cashflow, etc.
- `bim/` - BimViewer, BimLibrary, FederatedModelUploader, clash detection
- `dashboard/` - DashboardPage, FolderSidebar, Project creation
- `apu/` - ApuLibraryPage, ApuPickerModal
- `workers/` - WorkersPage with assignments and payment tracking
- `invoices/`, `rfis/`, `submittals/`, `punch-list/`, `schedule/`, `resources/`, `company/`

**API Client**: Axios-based with interceptors for auth headers and error handling

### Database

Supabase (PostgreSQL) with TypeORM entities. RLS policies enforce organization-level tenant isolation.

## Key Patterns

### Adding a new API module
1. Create module in `apps/api/src/modules/<name>/`
2. Add controller, service, entities, DTOs
3. Register in `AppModule`
4. Use SupabaseAuthGuard on controllers

### Adding a new frontend feature
1. Create folder in `apps/web/src/features/<name>/`
2. Add page component and modals/components
3. Add route in `App.tsx`
4. Use TanStack Query hooks for data fetching

### Testing
- API: Jest with ts-jest transformer, `.spec.ts` files
- Web: Vitest with `@testing-library/react`, jsdom environment
