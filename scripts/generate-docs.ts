import * as fs from 'fs';
import * as path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');
const ENTITIES_DIR = path.join(ROOT_DIR, 'apps/api/src/modules');
const OUTPUT_FILE = path.join(ROOT_DIR, 'docs/MANUAL-USUARIO.md');

interface EntityInfo {
  name: string;
  module: string;
  columns: string[];
  relations: string[];
}

function extractEntityInfo(entityPath: string, moduleName: string): EntityInfo | null {
  const content = fs.readFileSync(entityPath, 'utf-8');
  
  const classMatch = content.match(/export class (\w+)/);
  if (!classMatch) return null;
  
  const entityName = classMatch[1];
  const columns: string[] = [];
  const relations: string[] = [];

  const columnMatches = content.matchAll(/@Column\([^)]*\)\s*\n\s*(\w+):/g);
  for (const match of columnMatches) {
    columns.push(match[1]);
  }

  const oneToManyMatches = content.matchAll(/@OneToMany\(\(\w+\) => (\w+)/g);
  for (const match of oneToManyMatches) {
    relations.push(match[1]);
  }

  const manyToOneMatches = content.matchAll(/@ManyToOne\(\(\w+\) => (\w+)/g);
  for (const match of manyToOneMatches) {
    relations.push(match[1]);
  }

  return { name: entityName, module: moduleName, columns, relations };
}

function getModules(): { name: string; path: string }[] {
  const modules: { name: string; path: string }[] = [];
  const dirs = fs.readdirSync(ENTITIES_DIR, { withFileTypes: true });
  
  for (const dir of dirs) {
    if (dir.isDirectory()) {
      const moduleName = dir.name;
      const entityFiles = fs.readdirSync(path.join(ENTITIES_DIR, moduleName))
        .filter(f => f.endsWith('.entity.ts'));
      
      if (entityFiles.length > 0) {
        modules.push({ name: moduleName, path: path.join(ENTITIES_DIR, moduleName) });
      }
    }
  }
  return modules;
}

function generateDocumentation(entities: EntityInfo[]): string {
  const now = new Date().toISOString().split('T')[0];
  
  let md = `# MANUAL DE USUARIO - BMBuildManage

> Documento auto-generado el ${now}
> Este archivo se actualiza ejecutando: \`npm run docs:generate\`

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
`;

  const moduleCounts: Record<string, number> = {};
  entities.forEach(e => {
    moduleCounts[e.module] = (moduleCounts[e.module] || 0) + 1;
  });

  const moduleOrder = [
    'companies', 'users', 'clients', 'projects', 'budgets', 'stages', 'items',
    'expenses', 'invoices', 'documents', 'workers', 'worker-assignments', 'worker-payments',
    'resources', 'materials', 'machinery', 'units', 'apu', 'subcontractors', 'templates',
    'rfis', 'submittals', 'punch-list', 'schedule', 'bim-models', 'bim-clashes',
    'contingencies', 'execution', 'audit-logs', 'clients'
  ];

  let idx = 1;
  for (const mod of moduleOrder) {
    if (moduleCounts[mod]) {
      const purpose = getModulePurpose(mod);
      md += `| ${idx++} | **${mod}** | ${moduleCounts[mod]} entidad(es) |\n`;
    }
  }

  md += `

---

## 3. Entidades del Sistema

`;

  for (const entity of entities) {
    md += `### ${entity.name} (${entity.module})\n`;
    if (entity.columns.length > 0) {
      md += `**Campos:** ${entity.columns.join(', ')}\n\n`;
    }
    if (entity.relations.length > 0) {
      md += `**Relaciones:** ${entity.relations.join(', ')}\n\n`;
    }
  }

  md += `

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

\`\`\`
Company → Users → Clients → Project → Budget → Stages → Items
                              ↓
                        Resources + Workers + APU
                              ↓
                        Expenses + Documents
                              ↓
                        Execution → Reportes
\`\`\`

---

## 6. Comandos de Desarrollo

\`\`\`bash
# Generar documentación
npm run docs:generate

# Iniciar API
cd apps/api && npm run dev

# Iniciar Web
cd apps/web && npm run dev

# Build total
npm run build
\`\`\`

---

*Manual auto-generado por BMBuildManage*`;

  return md;
}

function getModulePurpose(moduleName: string): string {
  const purposes: Record<string, string> = {
    'companies': 'Empresas constructoras (multi-tenant)',
    'users': 'Usuarios del sistema',
    'clients': 'Clientes/propietarios',
    'projects': 'Proyectos de construcción',
    'budgets': 'Presupuestos',
    'stages': 'Etapas/capítulos',
    'items': 'Ítems de cubicación',
    'expenses': 'Gastos reales',
    'invoices': 'Facturas',
    'documents': 'Documentos',
    'workers': 'Mano de obra',
    'worker-assignments': 'Asignaciones',
    'worker-payments': 'Pagos',
    'resources': 'Biblioteca de recursos',
    'materials': 'Materiales',
    'machinery': 'Maquinaria',
    'units': 'Unidades de medida',
    'apu': 'Análisis de Precios Unitarios',
    'subcontractors': 'Subcontratistas',
    'templates': 'Plantillas',
    'rfis': 'Consultas técnicas',
    'submittals': 'Envíos',
    'punch-list': 'Lista de defectos',
    'schedule': 'Cronograma',
    'bim-models': 'Modelos IFC',
    'bim-clashes': 'Conflictos BIM',
    'contingencies': 'Contingencias',
    'execution': 'Ejecución presupuestal',
    'audit-logs': 'Auditoría',
  };
  return purposes[moduleName] || 'Módulo';
}

function main() {
  console.log('🔄 Generando documentación automática...\n');
  
  const modules = getModules();
  const entities: EntityInfo[] = [];
  
  for (const mod of modules) {
    const files = fs.readdirSync(mod.path).filter(f => f.endsWith('.entity.ts'));
    for (const file of files) {
      const info = extractEntityInfo(path.join(mod.path, file), mod.name);
      if (info) {
        entities.push(info);
        console.log(`  ✓ ${info.name} (${mod.name})`);
      }
    }
  }
  
  console.log(`\n📊 Total entidades: ${entities.length}\n`);
  
  const md = generateDocumentation(entities);
  fs.writeFileSync(OUTPUT_FILE, md, 'utf-8');
  
  console.log(`✅ Documentación generada: ${OUTPUT_FILE}\n`);
}

main();