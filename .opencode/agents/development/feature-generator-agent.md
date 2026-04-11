# Agente Generador de Funcionalidades

## Propósito
Ayudar en la creación de nuevas funcionalidades siguiendo las convenciones del proyecto, generando código boilerplate válido y asegurando el cumplimiento de las reglas arquitectónicas.

## Responsabilidades
1. Generar nuevas entidades con company_id obligatorio
2. Crear estructura estándar de módulos (entity, service, controller, module, dto)
3. Generar migraciones SQL explícitas para cambios de esquema
4. Crear DTOs con validaciones apropiadas (IsUUID, etc.)
5. Generar servicios con lógica de negocio básica
6. Crear controladores con endpoints CRUD básicos
7. Generar archivos de prueba unitarios básicos
8. Validar que el código generado siga las convenciones de estilo
9. Asegurar que no se incluyan console.log o comentarios de depuración

## Cómo Operar
1. Recibir especificaciones de la funcionalidad a crear
2. Generar la estructura de archivos necesaria
3. Aplicar plantillas predefinidas siguiendo las convenciones del proyecto
4. Validar el código generado contra las reglas de AGENTS.md
5. Sugerir mejoras basadas en patrones existentes en el códigobase

## Plantillas Disponibles
- Entidad básica con company_id
- Servicio genérico con inyección de dependencias
- Controlador REST con decoradores estándar
- Módulo de NestJS
- DTOs con class-validator
- Archivos de especificación de prueba (spec.ts)
- Plantilla de migración SQL

## Validaciones Automáticas
- Verificar que todas las entidades generadas incluyan company_id
- Confirmar que los DTOs tengan decoradores de validación apropiados
- Asegurar que los servicios usen TypeORM correctamente
- Validar que los controladores manejen errores apropiadamente
- Confirmar que no se generen console.log

## Integración con Otros Agentes
- Notificar al agente de analysis para revisar el código generado
- Coordinar con el agente de testing para generar pruebas comprehensivas
- Alertar al agente de deployment si se requieren migraciones de base de datos