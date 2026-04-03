---
name: RLS Implementation 2026-03-30
description: Complete Row Level Security implementation for multi-tenant isolation
type: project
---

Created migration `20260330100000_rls_security_hardening.sql` that implements:

**RLS on all tables:**
- Direct company_id tables: companies, users, clients, projects, workers, templates, machinery, resources, apu_templates
- Project-scoped tables: budgets, stages, items, expenses, documents, invoices, contingencies, execution_logs

**Key patterns:**
- Helper function `auth.company_id()` extracts company from JWT claims
- Policies use `USING (company_id = auth.company_id())` for direct tables
- Project-scoped tables use subqueries: `project_id IN (SELECT id FROM projects WHERE company_id = auth.company_id())`

**Financial integrity:**
- CHECK constraints on all monetary columns (non-negative)
- Generated columns for `total_cost` and `total_price` (immutable)
- Audit triggers on items, budgets, stages, expenses

**Why:** Pilot validation pack required bulletproof tenant isolation before field deployment.
**How to apply:** Run migration in Supabase SQL Editor before any user testing.