# MANUAL DE USUARIO - BMBuildManage

> Documento auto-generado el 2026-04-09
> Este archivo se actualiza ejecutando: `npm run docs:generate`

---

## 1. Introducción al Sistema

BMBuildManage es una plataforma SaaS B2B para la gestión integral de proyectos de construcción.

### 1.1 Arquitectura del Sistema

| Componente | Tecnología |
|------------|------------|
| API Backend | NestJS 11 (puerto 3001) |
| Frontend | React 19 + Vite 8 |
| Base de Datos | Supabase PostgreSQL |
| Autenticación | Supabase Auth + JWT |

---

## 2. Módulos del Sistema

| # | Módulo | Entidades |
|---|--------|-----------|
| 1 | **companies** | 1 entidad(es) |
| 2 | **users** | 1 entidad(es) |
| 3 | **clients** | 1 entidad(es) |
| 4 | **projects** | 2 entidad(es) |
| 5 | **budgets** | 1 entidad(es) |
| 6 | **stages** | 1 entidad(es) |
| 7 | **items** | 1 entidad(es) |
| 8 | **expenses** | 1 entidad(es) |
| 9 | **invoices** | 1 entidad(es) |
| 10 | **documents** | 1 entidad(es) |
| 11 | **workers** | 1 entidad(es) |
| 12 | **worker-assignments** | 1 entidad(es) |
| 13 | **worker-payments** | 1 entidad(es) |
| 14 | **resources** | 2 entidad(es) |
| 15 | **materials** | 1 entidad(es) |
| 16 | **machinery** | 1 entidad(es) |
| 17 | **units** | 1 entidad(es) |
| 18 | **apu** | 2 entidad(es) |
| 19 | **subcontractors** | 1 entidad(es) |
| 20 | **templates** | 3 entidad(es) |
| 21 | **rfis** | 1 entidad(es) |
| 22 | **submittals** | 1 entidad(es) |
| 23 | **punch-list** | 1 entidad(es) |
| 24 | **schedule** | 1 entidad(es) |
| 25 | **bim-models** | 1 entidad(es) |
| 26 | **contingencies** | 1 entidad(es) |
| 27 | **execution** | 2 entidad(es) |
| 28 | **audit-logs** | 1 entidad(es) |
| 29 | **clients** | 1 entidad(es) |


---

## 3. Entidades del Sistema

### ApuResource (apu)
**Campos:** apu_id, resource_id, resource_type, coefficient

### ApuTemplate (apu)
**Campos:** company_id, name, unit_id, description, category, default_formula, default_geometry_layer

### AuditLog (audit-logs)
**Campos:** company_id, project_id, user_id, entity_name, entity_id, action, old_value, new_value, description

### ProjectModel (bim-models)
**Campos:** project_id, company_id, name, storage_path, file_size, format, processing_status, file_url

### Budget (budgets)
**Campos:** project_id, status, is_active, notes, rejection_reason, total_estimated_cost, total_estimated_price, professional_fee_percentage, estimated_utility, markup_percentage

### Client (clients)
**Campos:** company_id, name, email, phone, address

### Company (companies)
**Campos:** name, country, tax_id, address, logo_url, email, phone, specialty, seismic_zone, region_code, library_seeded, seeded_at

### ProjectContingency (contingencies)
**Campos:** project_id, description, quantity, unit_cost, total_cost, notes

### Document (documents)
**Campos:** project_id, company_id, name, file_url, type

### BudgetExecutionLog (execution)
**Campos:** budget_item_id, quantity_executed, real_cost, note

### ResourceConsumption (execution)
**Campos:** project_id, budget_item_id, resource_id, quantity, unit_cost, total_cost, note

### Expense (expenses)
**Campos:** project_id, company_id, item_id, description, amount, expense_type, date, document_url, document_id

### Invoice (invoices)
**Campos:** project_id, company_id, supplier, invoice_number, amount, date, file_url

### Item (items)
**Campos:** stage_id, name, type, description, quantity, unit, unit_cost, total_cost, unit_price, total_price, cost_code, position, apu_template_id, cubication_mode, dim_length, dim_width, dim_height, dim_thickness, dim_count, dim_holes, formula, geometry_data, ifc_global_id, quantity_executed, real_cost, is_price_overridden

### Machinery (machinery)
**Campos:** company_id, name, category, price_per_hour, price_per_day, notes

### Material (materials)
**Campos:** name, category, unit, default_price, supplier

### ProjectPayment (projects)
**Campos:** project_id, amount, date, description, payment_method

### Project (projects)
**Campos:** company_id, client_id, name, description, location, type, folder, status, start_date, end_date, estimated_budget, estimated_price

### PunchItem (punch-list)
### ResourcePriceHistory (resources)
**Campos:** resource_id, price

### Resource (resources)
**Campos:** company_id, name, type, unit_id, category, description, base_price, has_vat

### Rfi (rfis)
### ScheduleTask (schedule)
**Campos:** project_id, name, description, start_date, end_date, progress, status, priority, parent_id, position, duration, dependency_days, assigned_to, budget, project_id, name, description, target_date, completed, completed_date, position, project_id, resource_id, resource_type, start_date, end_date, allocation_percentage

### Stage (stages)
**Campos:** budget_id, name, position, total_cost, total_price

### Subcontractor (subcontractors)
**Campos:** company_id, name, trade, nit, email, phone, address, contract_value, status, rating, notes, project_id, subcontractor_id, scope, description, contract_type, contract_amount, approved_amount, paid_amount, start_date, end_date, is_completed, completed_date, contract_id, amount, payment_date, invoice_number, description, approved, approved_by, approved_date, contract_id, item, description, approved_quantity, unit_price, executed_quantity

### Submittal (submittals)
### TemplateItem (templates)
**Campos:** template_stage_id, name, unit, default_quantity, default_cost

### TemplateStage (templates)
**Campos:** template_id, name, position

### Template (templates)
**Campos:** company_id, name, description

### Unit (units)
**Campos:** name, symbol, category

### User (users)
**Campos:** email, name, role, company_id

### WorkerAssignment (worker-assignments)
**Campos:** worker_id, project_id, daily_rate, start_date, end_date, performance_rating, performance_notes, task_description, total_paid

### WorkerPayment (worker-payments)
**Campos:** worker_id, project_id, amount, payment_type, date, notes

### Worker (workers)
**Campos:** company_id, name, role, daily_rate, phone, skills, rating, notes



---

## 4. Autenticación y Roles

### Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| admin | Administrador de empresa |
| engineer | Ingeniero de proyectos |
| architect | Arquitecto |
| site_supervisor | Supervisor de obra |
| foreman | Capataz |
| accounting | Contabilidad |

---

## 5. Flujo de Trabajo

```
Company → Users → Clients → Project → Budget → Stages → Items
                              ↓
                        Resources + Workers + APU
                              ↓
                        Expenses + Documents
                              ↓
                        Execution → Reportes
```

---

## 6. Comandos de Desarrollo

```bash
# Generar documentación
npm run docs:generate

# Iniciar API
cd apps/api && npm run dev

# Iniciar Web
cd apps/web && npm run dev

# Build total
npm run build
```

---

*Manual auto-generado por BMBuildManage*