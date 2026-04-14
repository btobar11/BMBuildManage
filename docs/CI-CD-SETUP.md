# BM Build Manage - CI/CD Setup Guide

## Resumen de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD Pipeline BM Build Manage                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  GitHub Pull Request (main)                                                │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐  │
│  │ Lint & Types   │ ──▶ │ Unit Tests      │ ──▶ │ Build Verification │  │
│  │ • npm run lint │     │ • 1212 tests    │     │ • npm run build    │  │
│  │ • tsc --noEmit │     │ • PostgreSQL    │     │ • API + Web        │  │
│  └─────────────────┘     └─────────────────┘     └─────────────────────┘  │
│           │                       │                        │                │
│           ▼                       ▼                        ▼                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Deployment Gate (Status Check)                  │   │
│  │              ✅ Todos los checks pasan → Vercel permite deploy      │   │
│  │              ❌ Algún check falla → Vercel bloquea deploy           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Archivo: `.github/workflows/ci-pipeline.yml`

El archivo ya está creado en `C:\Users\benja\OneDrive\Escritorio\BMBuildManage\.github\workflows\ci-pipeline.yml`

### Jobs Incluidos:

| Job | Propósito | Tiempo Estimado |
|-----|-----------|-----------------|
| `lint-and-types` | Validar lint y tipos TypeScript | ~30s |
| `unit-tests` | Ejecutar 1212 tests unitarios | ~2-3 min |
| `build-verification` | Compilar API y Web | ~1 min |
| `deployment-gate` | Verificar que todo pasó antes de deploy | ~5s |

---

## Paso 2: Configurar Vercel para Bloquear Deployments

### Instrucciones para el Product Owner:

#### 1. Acceder a Vercel Dashboard
1. Ir a https://vercel.com/dashboard
2. Seleccionar el proyecto **BMBuildManage**

#### 2. Configurar Git Protection
1. Ir a **Settings** → **Git** → **Protected Deployments**
2. Activar **"Require GitHub checks"**
3. Seleccionar los siguientes checks:
   - ✅ `ci-pipeline / lint-and-types`
   - ✅ `ci-pipeline / unit-tests`
   - ✅ `ci-pipeline / build-verification`
4. Guardar cambios

#### 3. Configurar Production Deployment
1. Ir a **Settings** → **Git** → **Production Deployments**
2. Asegurar que esté seleccionado **"main"** como rama de producción
3. Activar **"Auto-cancel on pipeline failure"**

### Resultado Esperado:
```
┌────────────────────────────────────────────────────────────┐
│  Vercel Dashboard - Protected Deployments                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ✅ Protected Deployment: Enabled                          │
│  ✅ Required Checks:                                       │
│     • ci-pipeline / lint-and-types                        │
│     • ci-pipeline / unit-tests                             │
│     • ci-pipeline / build-verification                    │
│                                                            │
│  ❌ Si algún check falla: Deployment se cancela          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Paso 3: Gestionar Migraciones de Base de Datos

### Estrategia para BM Build Manage v2.3+:

#### Flujo de Migraciones:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Estrategia de Migraciones                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DESARROLLO (local)                                                 │
│     ├── Crear migración en supabase/migrations/                       │
│     ├── Ejecutar: supabase db push                                     │
│     ├── Verificar en local                                             │
│     └── Commit + Push                                                   │
│           │                                                             │
│           ▼                                                             │
│  2. CI/GITHUB (PR a main)                                              │
│     ├── Validar sintaxis SQL                                            │
│     ├── Verificar que no hay breaking changes                          │
│     └── SIEMPRE: --dry-run                                              │
│           │                                                             │
│           ▼                                                             │
│  3. STAGING (preview deploy)                                           │
│     ├── Aplicar migración automáticamente                              │
│     ├── Tests E2E contra staging                                        │
│     └── Si falla: Rollback manual                                       │
│           │                                                             │
│           ▼                                                             │
│  4. PRODUCCION (main merge + tag)                                      │
│     ├── NO automático - requiere aprobación manual                     │
│     ├── Ejecutar: supabase db push --db-url=PROD_URL                   │
│     └── Monitoring post-deploy                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Comandos para Migraciones:

```bash
# Desarrollo local
supabase db push                                    # Apply local migrations
supabase db diff                                   # Show pending changes
supabase db remote commit                          # Show remote changes

# Staging/Producción (usar con precaución)
supabase db push --db-url=$PRODUCTION_URL         # Apply to production
supabase db reset --db-url=$PRODUCTION_URL        # ⚠️ Reset database (destruye datos)

# En CI/CD - Solo validación (nunca apply automático en prod)
supabase db diff --linked                          # Validate schema
```

#### Reglas de Oro:

1. **Nunca** usar `synchronize: true` en producción (ya validado en código)
2. **Siempre** crear migraciones explícitas (no rely en TypeORM auto-schema)
3. **Verificar** que las políticas RLS siguen intactas después de cada migración
4. **Probar** migraciones en staging antes de producción

---

## Resumen de Configuración Rápida

### Para el Product Owner:

| # | Acción | Ubicación | Tiempo |
|---|--------|-----------|--------|
| 1 | ✅ Archivo CI ya creado | `.github/workflows/ci-pipeline.yml` | - |
| 2 | Configurar Protected Deployments | Vercel Dashboard → Settings → Git | 2 min |
| 3 | Definir estrategia de migraciones | Documentación arriba | - |

### Secrets Requeridos (GitHub):

```bash
# Ir a: GitHub → Settings → Secrets → Actions

SUPABASE_PROJECT_REF=xxxxxx        # ID del proyecto Supabase
SUPABASE_DB_PASSWORD=xxxxxx        # Password de la DB (para validación)
```

### Variables de Entorno (CI):

El pipeline automáticamente configura:
```bash
DATABASE_URL=postgresql://test:test@localhost:5432/bmbuildmanage_test
SUPABASE_URL=https://localhost:54321
SUPABASE_ANON_KEY=test-anon-key
NODE_ENV=test
ALLOW_DEV_TOKEN=true
```

---

## Notas Importantes

1. **El pipeline está diseñado para blockers**: No permite merge si lint, types, tests o build fallan
2. **Vercel espera check exitoso**: Solo desplegará si `deployment-gate` termina con éxito
3. **Migraciones son manuales en prod**: Por seguridad, el apply a producción requiere intervención manual
4. **Caché acelerada**: El pipeline usa cache de npm para speed up en jobs subsecuentes