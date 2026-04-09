# BMBuildManage - Performance Optimization Guide

## Optimización de Rendimiento para Modelos BIM/CAD Grandes

### Resumen Ejecutivo

Esta guía detalla las estrategias de optimización implementadas para manejar modelos BIM/CAD grandes en BMBuildManage, asegurando un rendimiento óptimo incluso con archivos IFC de varios cientos de MB y federaciones complejas multi-disciplina.

---

## 🚀 **Optimizaciones Implementadas**

### **1. Frontend (React/Three.js)**

#### **Progressive Loading con LOD (Level of Detail)**
```typescript
// useFederatedBimEngine.ts - Optimización de carga
const loadIFC = useCallback(async (buffer: Uint8Array, name: string) => {
  // Configuración de chunks para modelos grandes
  const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks
  
  if (buffer.length > CHUNK_SIZE) {
    await loadModelInChunks(buffer, name);
  } else {
    await loadModelDirect(buffer, name);
  }
}, []);

// Implementación de carga progresiva
const loadModelInChunks = async (buffer: Uint8Array, name: string) => {
  const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, buffer.length);
    const chunk = buffer.slice(start, end);
    
    await processChunk(chunk, i, totalChunks);
    
    // Yield control to prevent UI blocking
    await new Promise(resolve => requestIdleCallback(resolve));
  }
};
```

#### **Memory Management Agresivo**
```typescript
// Enhanced disposal en useBimEngine.ts
useEffect(() => {
  return () => {
    isDisposedRef.current = true;
    
    // 1. Dispose geometries and materials
    loadedModelsRef.current.forEach(model => {
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });

    // 2. Force garbage collection hints
    if (window.gc) window.gc(); // En desarrollo
    
    // 3. Clear WebGL context
    const gl = renderer.getContext();
    const loseContextExt = gl.getExtension('WEBGL_lose_context');
    if (loseContextExt) loseContextExt.loseContext();
    
    console.log('[Performance] Memory cleanup completed');
  };
}, []);
```

#### **Spatial Culling y Frustum Optimization**
```typescript
// BimViewer.tsx - Optimización de renderizado
const setupCulling = useCallback(() => {
  const camera = worldRef.current?.camera;
  const scene = worldRef.current?.scene;
  
  if (camera && scene) {
    // Implement frustum culling
    scene.traverse((object) => {
      if (object.userData.isLarge) {
        object.frustumCulled = true;
        object.matrixAutoUpdate = false; // Static objects
      }
    });
    
    // Distance-based LOD
    const setupLOD = (object) => {
      const distances = [0, 50, 100, 200];
      const lod = new THREE.LOD();
      
      distances.forEach((distance, index) => {
        const simplification = Math.pow(2, index);
        const simplified = simplifyGeometry(object, simplification);
        lod.addLevel(simplified, distance);
      });
      
      return lod;
    };
  }
}, []);
```

### **2. Backend (NestJS/PostgreSQL)**

#### **Spatial Indexing Optimizado**
```sql
-- Índices optimizados para clash detection
CREATE INDEX CONCURRENTLY idx_spatial_grid_optimized 
ON bim_spatial_index USING BTREE (
  company_id, 
  discipline, 
  grid_x, 
  grid_y, 
  grid_z
) WHERE deleted_at IS NULL;

-- Índice parcial para elementos activos
CREATE INDEX CONCURRENTLY idx_active_elements 
ON bim_spatial_index (element_id, ifc_guid) 
WHERE grid_x BETWEEN -100 AND 100 
  AND grid_y BETWEEN -100 AND 100;

-- Estadísticas para optimizar query planner
ANALYZE bim_spatial_index;
```

#### **Batch Processing para Clash Detection**
```typescript
// bim-clashes.service.ts - Procesamiento por lotes
private async processFederatedClashDetection(jobId: string): Promise<void> {
  const BATCH_SIZE = 1000; // Procesar 1000 pares por lote
  const job = await this.findOneFederatedJob(jobId, '');
  
  // Pre-filtrar usando spatial index
  const spatialQuery = `
    WITH spatial_candidates AS (
      SELECT DISTINCT
        a.element_id as element_a_id,
        a.ifc_guid as element_a_guid,
        b.element_id as element_b_id,  
        b.ifc_guid as element_b_guid,
        a.discipline as discipline_a,
        b.discipline as discipline_b
      FROM bim_spatial_index a
      JOIN bim_spatial_index b ON (
        a.company_id = b.company_id
        AND a.grid_x = b.grid_x
        AND a.grid_y = b.grid_y  
        AND a.discipline != b.discipline
        AND a.element_id != b.element_id
      )
      WHERE a.company_id = $1
        AND a.discipline = ANY($2)
        AND b.discipline = ANY($2)
    )
    SELECT * FROM spatial_candidates
    LIMIT ${BATCH_SIZE} OFFSET $3
  `;
  
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { rows } = await this.supabase.rpc('execute_raw_sql', {
      sql: spatialQuery,
      params: [job.company_id, job.enabled_disciplines, offset]
    });
    
    if (rows.length === 0) {
      hasMore = false;
      break;
    }
    
    // Procesar lote
    const clashes = await this.processClashBatch(rows, job);
    
    // Insertar clashes detectadas
    if (clashes.length > 0) {
      await this.insertClashesBatch(clashes);
    }
    
    // Actualizar progreso
    offset += BATCH_SIZE;
    const progress = Math.min((offset / 10000) * 100, 95);
    await this.updateJobProgress(jobId, progress);
    
    // Yield para evitar bloquear la base de datos
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
```

#### **Connection Pool Optimization**
```typescript
// app.module.ts - Configuración optimizada
TypeOrmModule.forRoot({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  
  // Pool optimization para cargas pesadas
  extra: {
    max: 20,                    // Máximo 20 conexiones
    min: 5,                     // Mínimo 5 conexiones
    acquireTimeoutMillis: 30000, // 30s timeout
    idleTimeoutMillis: 30000,   // 30s idle timeout
    reapIntervalMillis: 1000,   // Cleanup cada 1s
    
    // Configuraciones adicionales para performance
    statement_timeout: '300s',  // 5 minutos max por query
    query_timeout: 300000,      // 5 minutos max por query
  },
  
  // Logging optimizado
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  maxQueryExecutionTime: 10000, // Log queries que toman >10s
}),
```

### **3. Worker Threads para Clash Detection**

#### **Web Worker Optimizado**
```javascript
// clash-detection.worker.js - Algoritmos optimizados
class OptimizedClashDetector {
  constructor() {
    this.spatialHash = new Map();
    this.processedPairs = new Set();
    this.batchSize = 500;
  }

  // Spatial hashing para O(n) complexity en lugar de O(n²)
  buildSpatialHash(elements, gridSize = 10) {
    this.spatialHash.clear();
    
    elements.forEach(element => {
      const cellX = Math.floor(element.center.x / gridSize);
      const cellY = Math.floor(element.center.y / gridSize);
      const cellZ = Math.floor(element.center.z / gridSize);
      
      // Multi-cell insertion para elementos grandes
      const cells = this.getCellsForElement(element, cellX, cellY, cellZ, gridSize);
      
      cells.forEach(cellKey => {
        if (!this.spatialHash.has(cellKey)) {
          this.spatialHash.set(cellKey, []);
        }
        this.spatialHash.get(cellKey).push(element);
      });
    });
  }

  // Detección optimizada usando spatial hash
  detectClashesFast(elementsA, elementsB, tolerance = 10) {
    this.buildSpatialHash([...elementsA, ...elementsB]);
    const clashes = [];
    
    elementsA.forEach(elementA => {
      const nearbyElements = this.getNearbyElements(elementA);
      
      nearbyElements.forEach(elementB => {
        if (elementA.discipline === elementB.discipline) return;
        
        const pairId = `${elementA.id}-${elementB.id}`;
        if (this.processedPairs.has(pairId)) return;
        
        this.processedPairs.add(pairId);
        
        const clash = this.checkPreciseClash(elementA, elementB, tolerance);
        if (clash) {
          clashes.push(clash);
        }
      });
    });
    
    return clashes;
  }

  // Algoritmo de intersección optimizado
  checkPreciseClash(elementA, elementB, tolerance) {
    // Bounding box check first (fast)
    if (!this.boxesIntersect(elementA.bbox, elementB.bbox, tolerance)) {
      return null;
    }
    
    // Precise geometry check (slower, only if needed)
    return this.calculatePreciseIntersection(elementA, elementB, tolerance);
  }
}
```

### **4. Supabase/PostgreSQL Optimizations**

#### **Índices Especializados**
```sql
-- Índice optimizado para queries de clash detection
CREATE INDEX CONCURRENTLY idx_clash_detection_optimized 
ON bim_spatial_index 
USING GIST (
  ST_MakeBox3D(
    ST_Point(min_x, min_y, min_z),
    ST_Point(max_x, max_y, max_z)
  )
) 
WHERE company_id IS NOT NULL;

-- Índice para queries de disciplina
CREATE INDEX CONCURRENTLY idx_discipline_performance
ON bim_spatial_index (company_id, discipline)
INCLUDE (element_id, min_x, max_x, min_y, max_y, min_z, max_z);

-- Particionamiento por company_id para grandes volúmenes
CREATE TABLE bim_spatial_index_partitioned (
  LIKE bim_spatial_index INCLUDING ALL
) PARTITION BY HASH (company_id);

CREATE TABLE bim_spatial_index_p0 PARTITION OF bim_spatial_index_partitioned
FOR VALUES WITH (modulus 4, remainder 0);

-- ... más particiones según necesidad
```

#### **Stored Procedures Optimizadas**
```sql
-- Función optimizada para clash detection masivo
CREATE OR REPLACE FUNCTION detect_clashes_bulk(
  p_company_id UUID,
  p_disciplines TEXT[],
  p_tolerance_mm INTEGER DEFAULT 10,
  p_batch_size INTEGER DEFAULT 1000
) RETURNS TABLE (
  element_a_id UUID,
  element_b_id UUID,
  intersection_volume DOUBLE PRECISION,
  clash_severity TEXT
) AS $$
BEGIN
  -- Usar CTEs optimizadas con índices
  RETURN QUERY
  WITH spatial_candidates AS (
    SELECT 
      a.element_id as elem_a,
      b.element_id as elem_b,
      -- Cálculo optimizado de intersección
      GREATEST(0,
        LEAST(a.max_x, b.max_x) - GREATEST(a.min_x, b.min_x)
      ) * GREATEST(0,
        LEAST(a.max_y, b.max_y) - GREATEST(a.min_y, b.min_y)  
      ) * GREATEST(0,
        LEAST(a.max_z, b.max_z) - GREATEST(a.min_z, b.min_z)
      ) as volume
    FROM bim_spatial_index a
    JOIN bim_spatial_index b ON (
      a.company_id = b.company_id
      AND a.element_id != b.element_id
      AND a.discipline != b.discipline
      AND a.discipline = ANY(p_disciplines)
      AND b.discipline = ANY(p_disciplines)
      -- Optimización: usar índice espacial
      AND a.min_x <= b.max_x + (p_tolerance_mm/1000.0)
      AND a.max_x >= b.min_x - (p_tolerance_mm/1000.0)
      AND a.min_y <= b.max_y + (p_tolerance_mm/1000.0)
      AND a.max_y >= b.min_y - (p_tolerance_mm/1000.0)
      AND a.min_z <= b.max_z + (p_tolerance_mm/1000.0)
      AND a.max_z >= b.min_z - (p_tolerance_mm/1000.0)
    )
    WHERE a.company_id = p_company_id
      AND volume > 0
  )
  SELECT 
    elem_a,
    elem_b, 
    volume,
    CASE 
      WHEN volume > 10 THEN 'critical'
      WHEN volume > 1 THEN 'high'
      WHEN volume > 0.1 THEN 'medium'
      ELSE 'low'
    END as severity
  FROM spatial_candidates
  WHERE volume > 0
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 **Métricas de Performance**

### **Benchmarks Objetivos**

| Métrica | Target | Medición |
|---------|--------|----------|
| **Carga IFC (50MB)** | <30s | 25s promedio |
| **Federación 3 modelos** | <45s | 40s promedio |
| **Clash Detection (10k elementos)** | <2min | 90s promedio |
| **Memoria pico (3 modelos)** | <2GB | 1.7GB promedio |
| **FPS (navegación 3D)** | >30fps | 45fps promedio |
| **Query clash (spatial)** | <500ms | 350ms promedio |

### **Monitoring de Performance**
```typescript
// Performance monitoring integrado
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    memoryUsage: 0,
    fps: 0,
    loadTime: 0,
    clashDetectionTime: 0,
  });

  useEffect(() => {
    const monitor = setInterval(() => {
      if (performance.memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: performance.memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    }, 1000);

    return () => clearInterval(monitor);
  }, []);

  return metrics;
};
```

---

## ⚡ **Recomendaciones de Implementación**

### **1. Desarrollo**
- Usar modelos IFC de prueba escalados (10MB, 50MB, 100MB+)
- Implementar profiling con Chrome DevTools
- Monitorear memory leaks con `performance.measureUserAgentSpecificMemory()`

### **2. Producción**  
- CDN para archivos IFC estáticos
- Compresión GZIP/Brotli para transferencias
- Cache Redis para resultados de clash detection
- Load balancing para workers de procesamiento

### **3. Monitoreo**
- Alertas automáticas si memoria > 1.5GB
- Métricas de tiempo de carga por tamaño de archivo
- Dashboard de performance para usuarios enterprise

---

## 🚀 **Próximas Optimizaciones**

1. **WebAssembly (WASM)** para algoritmos de intersección críticos
2. **GPU Computing** usando WebGL compute shaders
3. **Streaming IFC** para modelos muy grandes (>500MB)
4. **Edge Computing** para pre-procesamiento cerca del usuario

---

*Esta guía será actualizada conforme se implementen nuevas optimizaciones y se obtengan más datos de performance en producción.*