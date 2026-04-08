# Tareas Pendientes - Pre-Lanzamiento Pilot Validation

## 1. Configuración de Producción (Deployment)

**Descripción:** Configurar las variables de entorno en el hosting (Vercel/Netlify) y asegurar que el middleware.ts redireccione correctamente a los usuarios no autenticados.

**Archivos a revisar:**
- `apps/web/.env.production` - Variables de entorno necesarias
- `apps/web/src/middleware.ts` - Autenticación y redirección
- `apps/api/.env` - Supabase keys y configuración

**Pasos:**
1. [ ] Definir variables necesarias (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
2. [ ] Configurar en Vercel/Netlify dashboard
3. [ ] Verificar middleware.ts redirecciona a /login
4. [ ] Probar flujo: usuario no autenticado → login → dashboard

---

## 2. Corrección BLK-001: Trigger para company_id en usuarios

**Descripción:** Resolver el blocker de RLS creando un trigger que asigne automáticamente company_id a nuevos usuarios.

**Problema:** Los usuarios existentes no tienen `company_id` en la tabla `profiles`, lo cual bloquea el acceso a datos.

**Solución requerida:**
```sql
-- Trigger para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear perfil con company_id null o crear company default
  INSERT INTO public.profiles (id, email, company_id)
  VALUES (NEW.id, NEW.email, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar trigger con auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Pasos:**
1. [ ] Crear función `handle_new_user()` en Supabase
2. [ ] Crear trigger en `auth.users`
3. [ ] Verificar usuarios nuevos tienen perfil
4. [ ] Migra usuarios existentes a tener company_id

---

## 3. Generación de Assets PWA - Iconos Mobile

**Descripción:** Generar iconos apple-touch-icon y android-chrome para que la PWA se vea profesional.

**Tamaños requeridos:**
- `apple-touch-icon.png` - 180x180
- `android-chrome-192x192.png` - 192x192
- `android-chrome-512x512.png` - 512x512
- `favicon.ico` - 32x32

**Fuente:** Usar isotipo del cubo esmeralda de `BMLogo.tsx`

**Pasos:**
1. [ ] Exportar SVG del isotipo como PNG en diferentes tamaños
2. [ ] Guardar en `apps/web/public/` con nombres correctos
3. [ ] Actualizar `manifest.webmanifest` con referencias
4. [ ] Verificar en móvil: "Añadir a pantalla de inicio"

---

## 4. Dashboard de Telemetría

**Descripción:** Crear vista interna (solo admin) para mostrar logs de Error 23514 y capturar datos inválidos.

**Requisitos:**
- Ruta `/admin/telemetry` o `/settings/logs`
- Solo accesible para role admin
- Mostrar: timestamp, usuario, tabla, constraint, valor attempted
- Filtrar por: fecha, tipo de error, tabla

**Archivos a crear:**
- `apps/web/src/features/admin/TelemetryDashboard.tsx`
- `apps/api/src/modules/admin/telemetry.controller.ts`
- `apps/api/src/modules/admin/telemetry.service.ts`

**Pasos:**
1. [ ] Crear endpoint API `/api/admin/telemetry`
2. [ ] Crear componente React para dashboard
3. [ ] Implementar tabla con filtros
4. [ ] Agregar protección de rol admin
5. [ ] Testear: intentar crear item con quantity=-1 y verificar logs

---

## Checklist Final Pre-Lanzamiento

- [ ] Variables de entorno configuradas en hosting
- [ ] Middleware redirecciona correctamente
- [ ] Trigger company_id activo y funcionando
- [ ] Iconos PWA generados e instalados
- [ ] Dashboard telemetría operativo
- [ ] Smoke tests pasando
- [ ] RLS strict verificado

---

**Asignación:** Equipo de DevOps / QA  
**Prioridad:** Alta  
**Fecha objetivo:** Antes del Pilot Launch
