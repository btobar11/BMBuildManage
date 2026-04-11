# ==============================================================================
# BM BUILD MANAGE - PLAYBOOK DE DESPLIEGUE A PRODUCCIÓN
# ==============================================================================

## ESTADO ACTUAL: ✅ DESPLIEGUE CONFIGURADO EN VERCEL
- **Frontend**: https://bmbuildmanage.vercel.app (o dominio personalizado)
- **Backend**: API desplegada como Serverless Functions en Vercel
- **Autodeploy**: Configurado - cada push a `main` activa deployment automáticamente

---

## ARQUITECTURA
- **Frontend**: React 19 + Vite 8 (Web app SPA)
- **Backend**: NestJS 11 + TypeORM 0.3 (API REST)
- **Base de datos**: Supabase PostgreSQL
- **Auth**: Supabase Auth + JWT custom guard

---

## FASE 1: ACTUALIZAR Y DESPLEGAR (AUTO-DEPLOY)

### Paso a paso - Solo hacer push:

```bash
# 1. Verificar estado actual
git status

# 2. Agregar cambios
git add .

# 3. Commit con mensaje descriptivo
git commit -m "feat: nueva funcionalidad o fix"

# 4. Push al repositorio (trigger automático)
git push origin main
```

### Ver progreso del despliegue:
1. Ve a https://vercel.com/dashboard
2. Busca los proyectos: `bm-build-manage-web` y `bm-build-manage-api`
3. Click en el commit para ver logs en tiempo real
4. Esperar ~2-3 minutos hasta que ambos pasen de "Ready" a "Live"

---

## FASE 2: VERIFICACIÓN LOCAL (Pre-commit)

```bash
# Build completo
npm run build

# Tests
cd apps/api && npm run test    # 1256 tests passing

# Lint
npm run lint    # Sin errores
```

---

## FASE 3: VERIFICACIÓN POST-DESPLIEGUE

### 3.1 Health Check
```bash
curl https://api.bmbuildmanage.com/api/v1/health
```

### 3.2 Verificar CORS
```bash
curl -I -X OPTIONS https://api.bmbuildmanage.com/api/v1/projects \
  -H "Origin: https://bmbuildmanage.com"
```

### 3.3 Verificar Rate Limiting
```bash
# Envía más de 100 requests en 60 segundos
# Debería recibir 429 Too Many Requests
```

---

## FASE 4: MIGRACIONES DE BASE DE DATOS

### Ver estado de migraciones:
```bash
cd apps/api
npm run migration:show
```

### Aplicar migraciones pendientes:
```bash
npm run migration:run
```

> ⚠️ **Nota**: Las migraciones se ejecutan desde el dashboard de Vercel o manualmente si es necesario.

---

## FASE 5: CONFIGURACIÓN EN VERCEL (Referencia)

### Frontend (apps/web)
- Root Directory: `apps/web`
- Build Command: `npm run build`
- Output Directory: `dist`

### Backend (apps/api)
- Root Directory: `apps/api`
- Build Command: `npm run build`
- Framework Preset: `Other`

---

## FASE 6: CHECKLIST FINAL

| ✅ | Item |
|---|------|
| ✅ | Build local pasa sin errores |
| ✅ | Tests pasan (1256) |
| ✅ | Lint pasa sin errores |
| ✅ | Push a main triggera autodeploy |
| ✅ | Health check responde |
| ✅ | CORS configurado correctamente |
| ✅ | Rate limiting activo |

---

## TROUBLESHOOTING

### Error: "Cannot find module dist/main"
```bash
cd apps/api && npm run build
```

### Error: CORS blocked
- Verificar que FRONTEND_URL coincide exactamente con la URL de producción

### Error: 429 Too Many Requests
- Normal - Rate limiting funcionando correctamente

### Error: Build fails in Vercel
- Verificar que las variables de entorno estén configuradas en Vercel
- Revisar logs en Vercel Dashboard → Functions → Logs

---

## VARIABLES DE ENTORNO (Referencia)

### API (.env)
```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
JWT_SECRET=...
NODE_ENV=production
ALLOW_DEV_TOKEN=false
FRONTEND_URL=https://...
```

### Web (.env)
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://api...
VITE_NODE_ENV=production
```

---

## SOPORTE
- **Dashboard Vercel**: https://vercel.com/dashboard
- **Estado API**: https://api.bmbuildmanage.com/api/v1/health