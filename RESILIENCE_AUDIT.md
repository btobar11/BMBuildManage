# Auditoría de Resiliencia de Datos - BMBuildManage BI Dashboard

## Resumen Ejecutivo

| Métrica | Valor |
|--------|-------|
| **EndPoints Auditados** | 7 |
| **Zod Schemas Comparados** | 12 (frontend) |
| **Casos Límite Identificados** | 8 |
| **Puntos de Quiebre** | 5 críticos |
| **Fallbacks Propuestos** | 7 |

---

## 1. Análisis de Esquemas: Frontend vs Backend

### 1.1 Financial Summary

| Campo | Backend (AnalyticsService) | Frontend (Zod) | Estado |
|-------|---------------------------|----------------|--------|
| `company_id` | `string` | `z.string().uuid()` | ⚠️ FALTA validación UUID |
| `project_id` | `string` | `z.string().uuid()` | ⚠️ FALTA validación UUID |
| `project_name` | `string` | `z.string()` | ✅ OK |
| `total_budgeted` | `number` | `z.number().min(0)` | ✅ OK |
| `total_spent` | `number` | `z.number().min(0)` | ✅ OK |
| `percent_executed` | `number` | `z.number().min(0).max(100)` | ✅ OK |
| `calculated_at` | `Date` | `z.string().datetime()` | ⚠️ TIPO NO COINCIDE (Date vs string) |

### 1.2 Physical Progress

| Campo | Backend (AnalyticsService) | Frontend (Zod) | Estado |
|-------|---------------------------|----------------|--------|
| `project_name` | `string` | No existe en Zod | ❌ ESQUEMA INCOMPLETO |
| `physical_progress_percent` | `number` | No existe en Zod | ❌ ESQUEMA INCOMPLETO |
| `total_items` | `number` | No existe en Zod | ❌ ESQUEMA INCOMPLETO |

### 1.3 Clash Health

| Campo | Backend (AnalyticsService) | Frontend (Zod) | Estado |
|-------|---------------------------|----------------|--------|
| `total_clashes` | `number` | `z.number().int().min(0)` | ✅ OK |
| `resolution_rate_percent` | `number` | No existe en Zod | ❌ ESQUEMA INCOMPLETO |
| `critical_count` | `number` | No existe en Zod | ❌ ESQUEMA INCOMPLETO |

---

## 2. Puntos de Quiebre (Critical Breaking Points)

### 🔴 PUNTO 1: Proyecto Sin Colisiones

```json
// GET /api/v1/analytics/clashes/:projectId
// Response cuando NO hay colisiones:
{
  "company_id": "uuid-valor",
  "project_id": "uuid-valor", 
  "total_clashes": 0,
  "pending_clashes": 0,
  "accepted_clashes": 0,
  "resolved_clashes": 0,
  "ignored_clashes": 0,
  "resolution_rate_percent": 0,  // ⚠️ DIVISIÓN POR CERO MANEADA EN SQL
  "critical_count": 0,
  "high_count": 0,
  "medium_count": 0,
  "low_count": 0,
  "calculated_at": "2026-04-11T00:00:00Z"
}
```

**Problema**: El frontend `analyticsClashSchema` espera campos (`id`, `projectId`, `severity`, etc.) que **NO EXISTEN** en el response real de la vista SQL.

**Impacto**: UI se rompe, muestra datos vacíos o incorrectos.

**Fallback**: Ver sección 3.1

---

### 🔴 PUNTO 2: APU con Valor Cero

```typescript
// En el budget, si APU tiene unit_cost: 0 o quantity: 0
// La vista bi_financial_summary retorna:
{
  "total_budgeted": 0,        // ⚠️ CERO EXPLÍCITO
  "total_spent": 0,
  "percent_executed": NaN,   // ⚠️ CÁLCULO INVÁLIDO (SQL maneja esto)
  "material_budgeted": 0,
  ...
}
```

**Problema**: 
- `percent_executed` puede retornar `NaN` o `Infinity` si `total_budgeted = 0`
- El frontend puede intentar `0 / 0` resultando en `NaN`

**Fallback**: Ver sección 3.2

---

### 🔴 PUNTO 3: Error 500 del Servidor

```typescript
// Durante carga del Dashboard
// GET /api/v1/analytics/dashboard

// Error 500 Internal Server Error:
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "InternalError"
}
```

**Problema**: 
- El frontend NO tiene Try/Catch en las queries de React Query
- Si el servidor devuelve 500, la UI queda en estado de error sin feedback al usuario

**Fallback**: Ver sección 3.3

---

### 🔴 PUNTO 4: Proyecto Sin Budget (Primera Vez)

```json
// bi_financial_summary para proyecto nuevo (sin budget aprobado):
{
  "company_id": "uuid",
  "project_id": "nuevo-proyecto-id",
  "project_name": "Nuevo Proyecto",
  "total_budgeted": 0,    // ⚠️ PROYECTO SIN PRESUPUESTO
  "total_spent": 0,
  "variance": 0,
  "percent_executed": 0,
  "material_budgeted": 0,
  ...
}
```

**Problema**: El dashboard muestra "0%" de ejecución pero el proyecto simplemente no tiene presupuesto aún.

**Fallback**: Ver sección 3.4

---

### 🔴 PUNTO 5: Red de Espera (Timeout)

```
Request: GET /api/v1/analytics/financial
Timeout: 30 segundos (configurable en ThrottlerModule)

// La query puede quedarse "pensando" si hay millones de registros
// El frontend usa React Query con networkTimeout por defecto

// Error típico: "Network request failed"
```

**Fallback**: Ver sección 3.5

---

## 3. Fallbacks Propuestos (UI Guards)

### 3.1 Fallback: Sin Colisiones

```typescript
// lib/hooks/useBIData.ts

export const useBIDashboard = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/analytics/dashboard'),
    // FALLBACK: datos vacíos pero válidos si falla
    placeholderData: () => ({
      financial: [],
      physical: [],
      clash: []
    }),
    // REINTENTO automático si falla
    retry: 2,
    retryDelay: 1000,
  });
};

// En componente:
const { data, isLoading, error } = useBIDashboard();

// SI: data?.clash?.length === 0
// MOSTRAR: "No hay colisiones detectadas para este proyecto"
// NO: intentar renderizar datos que no existen
```

### 3.2 Fallback: Valor Cero en Budget

```typescript
// lib/utils/analyticsUtils.ts

export const calculateExecutionPercent = (spent: number, budgeted: number): number => {
  if (budgeted === 0) return 0;
  if (isNaN(spent) || !isFinite(spent)) return 0;
  return Math.min(100, Math.max(0, spent / budgeted * 100));
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0';
  }
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(value);
};

export const getBudgetStatus = (
  percent: number,
  budgeted: number
): 'empty' | 'on_track' | 'over_budget' | 'warning' => {
  if (budgeted === 0) return 'empty';
  if (percent >= 100) return 'over_budget';
  if (percent >= 80) return 'warning';
  return 'on_track';
};
```

### 3.3 Fallback: Error 500

```typescript
// lib/hooks/useBIData.ts

export const useBIDashboard = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/analytics/dashboard'),
    // MANEJO DE ERRORES
    useErrorBoundary: true, // Evita que toda la app CRASHEE
    meta: {
      onError: (error: Error) => {
        console.error('[BIDashboard] Error:', error.message);
        // REPORTAR a monitoring service
        reportError({
          component: 'BIDashboard',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      },
    },
  });
};

// En componente:
if (error) {
  return (
    <ErrorFallback 
      message="No se pudieron cargar los datos del dashboard"
      onRetry={() => queryClient.invalidateQueries(['analytics'])}
    />
  );
}
```

### 3.4 Fallback: Proyecto Sin Budget

```typescript
// lib/components/DashboardWidgets/BudgetWidget.tsx

interface BudgetWidgetProps {
  data: FinancialSummary[];
  projectId: string;
}

export const BudgetWidget = ({ data, projectId }: BudgetWidgetProps) => {
  const projectData = data.find(d => d.project_id === projectId);
  
  // MANEJO: Proyecto sin presupuesto
  if (!projectData || projectData.total_budgeted === 0) {
    return (
      <Card>
        <div className="p-4 text-center text-gray-500">
          <CalculatorIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Este proyecto no tiene presupuesto aprobado</p>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/projects/${projectId}/budgets/new`)}
          >
            Crear Budget
          </Button>
        </div>
      </Card>
    );
  }
  
  // RENDER normal
  return <BudgetChart data={projectData} />;
};
```

### 3.5 Fallback: Timeout de Red

```typescript
// lib/hooks/useBIData.ts

export const useBIDashboard = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get('/analytics/dashboard', {
      timeout: 15000, // 15 segundos
    }),
    // CANCELAR request si excede tiempo
    signal: AbortSignal.timeout(15000),
    // ESTADOS
    gcTime: 5 * 60 * 1000, // Cache por 5 minutos
    staleTime: 60 * 1000, // Datos válidos por 1 minuto
  });
};

// Loading state más específico:
if (isLoading) {
  return (
    <SkeletonWidget 
      animation="pulse"
      className="animate-pulse"
    />
  );
}
```

---

## 4. Validaciones Faltantes en Frontend Zod

### 4.1 Esquemas a Agregar (apps/web/src/lib/schemas/index.ts)

```typescript
// AGREGAR estos esquemas que faltan:

export const analyticsFinancialSummarySchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  project_name: z.string(),
  total_budgeted: z.number().min(0),
  total_spent: z.number().min(0),
  variance: z.number(),
  percent_executed: z.number().min(0).max(100),
  material_budgeted: z.number().min(0),
  labor_budgeted: z.number().min(0),
  equipment_budgeted: z.number().min(0),
  material_spent: z.number().min(0),
  labor_spent: z.number().min(0),
  equipment_spent: z.number().min(0),
  calculated_at: z.string(), // Cambiar de Date a string
});

export const analyticsPhysicalProgressSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  project_name: z.string(),
  total_quantity_budgeted: z.number().min(0),
  total_quantity_executed: z.number().min(0),
  physical_progress_percent: z.number().min(0).max(100),
  total_items: z.number().int().min(0),
  items_with_progress: z.number().int().min(0),
  completed_items: z.number().int().min(0),
  calculated_at: z.string(),
});

export const analyticsClashHealthSchema = z.object({
  company_id: z.string().uuid(),
  project_id: z.string().uuid(),
  total_clashes: z.number().int().min(0),
  pending_clashes: z.number().int().min(0),
  accepted_clashes: z.number().int().min(0),
  resolved_clashes: z.number().int().min(0),
  ignored_clashes: z.number().int().min(0),
  resolution_rate_percent: z.number().min(0).max(100),
  critical_count: z.number().int().min(0),
  high_count: z.number().int().min(0),
  medium_count: z.number().int().min(0),
  low_count: z.number().int().min(0),
  calculated_at: z.string(),
});

// Type guards
export function isAnalyticsFinancialSummary(data: unknown): data is AnalyticsFinancialSummary {
  return analyticsFinancialSummarySchema.safeParse(data).success;
}

export function isAnalyticsPhysicalProgress(data: unknown): data is AnalyticsPhysicalProgress {
  return analyticsPhysicalProgressSchema.safeParse(data).success;
}

export function isAnalyticsClashHealth(data: unknown): data is AnalyticsClashHealth {
  return analyticsClashHealthSchema.safeParse(data).success;
}
```

---

## 5. Recomendaciones de Implementación

### Prioridad Alta (Fix Inmediato)

| # | Acción | Archivo |
|---|--------|---------|
| 1 | Agregar esquemas Zod faltantes | `apps/web/src/lib/schemas/index.ts` |
| 2 | Agregar Try/Catch en queries React Query | `apps/web/src/lib/hooks/useBIData.ts` |
| 3 | Agregar fallback para proyectos sin budget | Componentes de dashboard |
| 4 | Agregar fallback para colisiones vacías | Clash widgets |

### Prioridad Media (Próxima Iteración)

| # | Acción | Archivo |
|---|--------|---------|
| 5 | Implementar ErrorBoundary específico | `apps/web/src/components/ErrorBoundary.tsx` |
| 6 | Agregar retry logic con expo backoff | React Query config |
| 7 | Agregar caching strategy | Query configs |

---

## 6. Testing de Resiliencia

### Casos de Prueba

```typescript
// test/analytics.resilience.spec.ts

describe('Analytics Resilience', () => {
  it('handles empty clash response', () => {
    const emptyClash = {
      company_id: 'uuid',
      project_id: 'uuid',
      total_clashes: 0,
      // ... all zeros
    };
    
    expect(isAnalyticsClashHealth(emptyClash)).toBe(true);
  });

  it('handles zero budget', () => {
    const zeroBudget = {
      total_budgeted: 0,
      total_spent: 0,
      percent_executed: 0,
    };
    
    const percent = calculateExecutionPercent(
      zeroBudget.total_spent, 
      zeroBudget.total_budgeted
    );
    
    expect(percent).toBe(0); // No NaN
  });

  it('handles network error gracefully', async () => {
    // Simular error 500
    mockApi.get.mockRejectedValue(new Error('500'));
    
    const { result } = renderHook(() => useBIDashboard());
    
    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
```

---

## 7. Métricas de Monitoreo

### Errores a Rastrear

```typescript
// lib/monitoring/analytics.ts

export const trackAnalyticsEvent = (
  event: 'load_success' | 'load_error' | 'timeout' | 'empty_data',
  metrics: {
    duration: number;
    endpoint: string;
    responseSize: number;
  }
) => {
  // Enviar a analytics
  mixpanel.track('BI_Analytics_Event', {
    event,
    ...metrics,
    timestamp: Date.now(),
  });
};
```

---

**Documento generado**: 2026-04-11  
**Auditor**: Code Review Agent  
**Próxima revisión**: Al integrate endpoints BI con frontend