START# BMBuildManage - Documentacion Arquitectonica

> Documento tecnico para onboarding
> Ultima actualizacion: 2026-04-11

---

## 1. Stack Tecnologico

| Paquete | Version | Proposito |
|---------|---------|-----------|
| NestJS | ^11.0.1 | Framework backend API REST |
| NestJS Common | ^11.0.1 | Core del framework |
| NestJS TypeORM | ^11.0.0 | Integracion ORM |
| TypeORM | ^0.3.28 | ORM PostgreSQL |
| @supabase/supabase-js | ^2.99.1 | Cliente Supabase |
| Passport JWT | ^4.0.1 | Estrategia JWT |
| PDFKit | ^0.18.0 | Generacion PDFs |
| ExcelJS | ^4.4.0 | Exportacion Excel |

| React | ^19.2.4 | Framework UI |
| Vite | ^8.0.0 | Build tool |
| Tailwind CSS | ^4.2.1 | Estilos |
| @thatopen/components | ^3.3.3 | Visor 3D IFC |
| @thatopen/components-front | ^3.3.3 | UI componentes BIM |
| @thatopen/fragments | ^3.3.7 | Fragmentos BIM |
| Three.js | ^0.183.2 | WebGL 3D |
| @tanstack/react-query | ^5.90.21 | Estado servidor |
| @tanstack/react-table | ^8.21.3 | Tablas |
| React Router DOM | ^7.13.1 | Enrutamiento |
| Recharts | ^3.8.1 | Graficos |
| Fabric | ^7.2.0 | Lienzo 2D |
| Axios | ^1.13.6 | HTTP client |

| Jest | ^30.0.0 | Testing API |
| Vitest | ^4.1.3 | Testing Web |
| @playwright/test | ^1.59.0 | E2E testing |

| Turborepo | ^2.9.6 | Monorepo management |
| TypeScript | ^5.7.3 / ~5.9.3 | Lenguaje |
| ESLint | ^9.18.0 / ^9.39.4 | Linting |
| Prettier | ^3.4.2 | Formateo |

---

## 2. Matriz de Seguridad (RBAC)

### 2.1 Roles del Sistema

| Rol | Descripcion |
|-----|-------------|
| ADMIN | Administrador de empresa |
| ENGINEER | Ingeniero de proyectos |
| ARCHITECT | Arquitecto BIM |
| SITESUPERVISOR | Supervisor de obra |
| FOREMAN | Capataz |
| ACCOUNTING | Contabilidad |
| VIEWER | Solo visualizacion |
| WORKER | Trabajador |

### 2.2 Permisos por Rol

| Modulo | ADMIN | ENGINEER | ARCHITECT | SITESUPERVISOR | FOREMAN | ACCOUNTING | VIEWER | WORKER |
|--------|-------|----------|-----------|---------------|---------|------------|-------|--------|-------|
| Users | CRU | R | - | - | - | - | R | - |
| Companies | CRU | R | R | - | - | R | R | - |
| Projects | CRU | CRU | R | R | R | R | R | - |
| Budgets | CRU | CRU | R | R | R | R | R | - |
| Stages | CRU | CRU | R | R | R | - | R | - |
| Items | CRU | CRU | R | R | R | - | R | R |
| Expenses | CRU | CRU | R | R | R | CRU | R | - |
| Workers | CRU | CRU | R | CRU | CRU | R | R | R |
| Invoices | CRU | CRU | - | - | - | CRU | R | - |
| APU | CRU | CRU | R | R | R | R | R | - |
| BIM-Models | CRU | CRU | CRU | R | R | - | R | - |
| BIM-Clashes | R | R | CRU | R | R | - | R | - |
| Schedule | CRU | CRU | CRU | CRU | R | R | R | - |
| Audit-Logs | R | R | R | R | R | R | R | R |

### 2.3 Convenciones

- C = Create (Crear)
- R = Read (Leer)
- U = Update (Actualizar)
- D = Delete (Eliminar) - solo ADMIN
- - = Sin acceso
---

## 3. Flujo de Datos Critico: BIM-to-APU

### 3.1 Arquitectura de Vinculacion

1. Load IFC with @thatopen/components
2. Select element to get globalId
3. Get quantities (NetVolume, NetArea, Length)
4. Open BimItemLinker modal
5. POST /bim-apu-link with {ifc_global_id, item_id}
6. BimApuLink created linking Element to Item
7. Auto-sync updates quantity on Item

### 3.2 Entidad BimApuLink

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | uuid | Primary key |
| company_id | uuid | Tenant ID |
| project_id | uuid | Project ID |
| item_id | uuid | Budget item ID |
| ifc_global_id | string(64) | IFC element GUID |
| ifc_type | string(64) | IfcWall, IfcSlab, etc |
| net_volume | decimal | Volume (m3) |
| net_area | decimal | Area (m2) |
| quantity_type | enum | volume/area/length/count |
| quantity_multiplier | decimal | Multiplier factor |
| auto_sync_enabled | boolean | Auto-sync flag |
| last_synced_at | timestamp | Last sync time |

### 3.3 Endpoints API

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /bim-apu-link | Create link |
| GET | /bim-apu-link/project/:id | Links by project |
| GET | /bim-apu-link/item/:id | Links by item |
| POST | /bim-apu-link/sync/:id | Sync quantities |
| DELETE | /bim-apu-link/:id | Delete link |

### 3.4 IFC Category to Unit Mapping

| Categoria IFC | Unidad | Propiedad |
|-------------|--------|-------------|
| IfcWall | m3 | NetVolume |
| IfcSlab | m2 | NetArea |
| IfcBeam | ml | Length |
| IfcColumn | m3 | NetVolume |
| IfcDoor | m2 | NetArea |
| IfcWindow | m2 | NetArea |

---

## 4. Estrategia Multi-Tenant

### 4.1 Flujo de Aislamiento

1. Request comes with JWT Bearer Token
2. SupabaseAuthGuard validates token with Supabase Auth
3. Fetch user from users table
4. Extract company_id
5. Attach {id, email, company_id, role} to request
6. Service layer filters all queries by company_id
7. PostgreSQL: WHERE company_id = request.user.company_id

### 4.2 SupabaseAuthGuard

Location: common/guards/supabase-auth.guard.ts
- Extracts token from Authorization header
- Validates with Supabase Auth
- Fetches company_id from users table
- Attaches user context to request

### 4.3 Filter Obligatorio en Servicios

All service methods MUST filter by company_id:
`	ypescript
async findAll(companyId: string) {
  return this.repo.find({ where: { company_id: companyId } });
}
`

---

## 5. Variables de Entorno

### 5.1 API (.env)


| Variable | Tipo | Descripcion |
|----------|------|------------|
| NODE_ENV | development/production | Entorno |
| PORT | number | Puerto (default: 3001) |
| DATABASE_URL | string | PostgreSQL connection |
| SUPABASE_URL | string | URL Supabase |
| SUPABASE_ANON_KEY | string | Anon key |
| SUPABASE_SERVICE_ROLE_KEY | string | Service role key |
| JWT_SECRET | string | JWT secret |
| ALLOW_DEV_TOKEN | true/false | Dev bypass |
| ANTHROPIC_API_KEY | string | Claude API key |

### 5.2 Web (.env)

| Variable | Tipo | Descripcion |
|----------|------|------------|
| VITE_SUPABASE_URL | string | URL Supabase |
| VITE_SUPABASE_ANON_KEY | string | Anon key |
| VITE_API_URL | string | API URL |
| VITE_ANTHROPIC_API_KEY | string | Claude API key |

---

Documento generado para onboarding tecnico.