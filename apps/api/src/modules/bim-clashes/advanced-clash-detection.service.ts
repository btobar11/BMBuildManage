import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface BoundingBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

interface BIMElement {
  id: string;
  ifc_guid: string;
  ifc_type: string;
  name: string;
  model_id: string;
  discipline: string;
  bounding_box: BoundingBox;
  storey_name?: string;
  priority: number; // 1-5, 1 being highest priority
}

interface ClashResult {
  element_a_id: string;
  element_b_id: string;
  element_a_guid: string;
  element_b_guid: string;
  clash_type: 'hard' | 'soft' | 'clearance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  intersection_volume: number;
  clearance_distance: number;
  clash_center: {
    x: number;
    y: number;
    z: number;
  };
  confidence: number; // 0-1, confidence in clash detection
  resolution_priority: number; // 1-10, priority for resolution
}

interface ClashDetectionConfig {
  tolerance_mm: number;
  hard_clash_threshold: number;
  soft_clash_buffer: number;
  clearance_requirements: Record<string, Record<string, number>>;
  discipline_priorities: Record<string, number>;
  element_type_priorities: Record<string, number>;
  performance_mode: 'accurate' | 'fast' | 'balanced';
}

interface SpatialIndex {
  elements: Map<string, BIMElement>;
  grid: Map<string, Set<string>>; // grid cell -> element IDs
  cellSize: number;
}

@Injectable()
export class AdvancedClashDetectionService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AdvancedClashDetectionService.name);

  // Default clearance requirements (in mm) between disciplines
  private readonly DEFAULT_CLEARANCES: Record<string, Record<string, number>> =
    {
      structure: {
        mep_hvac: 100,
        mep_plumbing: 50,
        mep_electrical: 75,
        architecture: 25,
      },
      mep_hvac: {
        mep_plumbing: 150,
        mep_electrical: 100,
        architecture: 50,
        structure: 100,
      },
      mep_plumbing: {
        mep_hvac: 150,
        mep_electrical: 75,
        architecture: 25,
        structure: 50,
      },
      mep_electrical: {
        mep_hvac: 100,
        mep_plumbing: 75,
        architecture: 25,
        structure: 75,
      },
      architecture: {
        structure: 25,
        mep_hvac: 50,
        mep_plumbing: 25,
        mep_electrical: 25,
      },
    };

  private readonly ELEMENT_TYPE_PRIORITIES: Record<string, number> = {
    // Critical structural elements (highest priority)
    IfcColumn: 1,
    IfcBeam: 1,
    IfcFoundation: 1,
    IfcFooting: 1,

    // Primary MEP elements
    IfcDuctSegment: 2,
    IfcPipeSegment: 2,
    IfcCableSegment: 2,

    // Secondary structural
    IfcSlab: 3,
    IfcWall: 3,

    // Building services equipment
    IfcPump: 4,
    IfcFan: 4,
    IfcValve: 4,

    // Architectural elements
    IfcDoor: 5,
    IfcWindow: 5,
    IfcCovering: 5,
  };

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') ||
        process.env.SUPABASE_URL ||
        '',
      this.configService.get<string>('supabase.anonKey') ||
        process.env.SUPABASE_ANON_KEY ||
        '',
    );
  }

  async performAdvancedClashDetection(
    companyId: string,
    jobId: string,
    config: Partial<ClashDetectionConfig> = {},
  ): Promise<ClashResult[]> {
    const fullConfig: ClashDetectionConfig = {
      tolerance_mm: config.tolerance_mm || 10,
      hard_clash_threshold: config.hard_clash_threshold || 0.1, // 0.1 mm³
      soft_clash_buffer: config.soft_clash_buffer || 50, // 50mm buffer zone
      clearance_requirements:
        config.clearance_requirements || this.DEFAULT_CLEARANCES,
      discipline_priorities: config.discipline_priorities || {},
      element_type_priorities:
        config.element_type_priorities || this.ELEMENT_TYPE_PRIORITIES,
      performance_mode: config.performance_mode || 'balanced',
      ...config,
    };

    // Get all BIM elements for clash detection
    const elements = await this.getBIMElementsForClashDetection(
      companyId,
      jobId,
    );

    if (elements.length < 2) {
      return [];
    }

    this.logger.debug(
      `Starting advanced clash detection for ${elements.length} elements`,
    );

    // Build spatial index for performance
    const spatialIndex = this.buildSpatialIndex(elements, fullConfig);

    // Perform clash detection with optimized algorithms
    const clashes = await this.detectClashesWithSpatialIndex(
      spatialIndex,
      fullConfig,
    );

    // Post-process and filter clashes
    const filteredClashes = this.postProcessClashes(clashes, fullConfig);

    // Sort by resolution priority
    filteredClashes.sort(
      (a, b) => b.resolution_priority - a.resolution_priority,
    );

    this.logger.debug(
      `Detected ${filteredClashes.length} clashes after filtering`,
    );

    return filteredClashes;
  }

  private async getBIMElementsForClashDetection(
    companyId: string,
    jobId: string,
  ): Promise<BIMElement[]> {
    // Get job details to determine which models to analyze
    const { data: job } = await this.supabase
      .from('bim_federated_clash_jobs')
      .select('enabled_disciplines, federation_id')
      .eq('id', jobId)
      .eq('company_id', companyId)
      .single();

    if (!job) {
      throw new Error('Clash detection job not found');
    }

    // Get elements from enabled disciplines
    const { data: elements, error } = await this.supabase
      .from('bim_elements')
      .select(
        `
        id,
        ifc_guid,
        ifc_type,
        name,
        model_id,
        bounding_box,
        storey_name,
        bim_models!inner(discipline)
      `,
      )
      .eq('company_id', companyId)
      .in('bim_models.discipline', job.enabled_disciplines)
      .not('bounding_box', 'is', null);

    if (error) {
      throw new Error(`Error fetching BIM elements: ${error.message}`);
    }

    return (elements || []).map((e) => ({
      id: e.id,
      ifc_guid: e.ifc_guid,
      ifc_type: e.ifc_type,
      name: e.name,
      model_id: e.model_id,
      discipline: (e.bim_models as any)?.discipline,
      bounding_box: e.bounding_box,
      storey_name: e.storey_name,
      priority: this.ELEMENT_TYPE_PRIORITIES[e.ifc_type] || 5,
    }));
  }

  private buildSpatialIndex(
    elements: BIMElement[],
    config: ClashDetectionConfig,
  ): SpatialIndex {
    // Determine optimal grid cell size based on element sizes and performance mode
    let cellSize = 1000; // Default 1m cells

    if (config.performance_mode === 'fast') {
      cellSize = 2000; // Larger cells for faster performance
    } else if (config.performance_mode === 'accurate') {
      cellSize = 500; // Smaller cells for higher accuracy
    }

    const spatialIndex: SpatialIndex = {
      elements: new Map(),
      grid: new Map(),
      cellSize,
    };

    this.logger.debug(`Building spatial index with cell size: ${cellSize}mm`);

    elements.forEach((element) => {
      spatialIndex.elements.set(element.id, element);

      // Calculate which grid cells this element occupies
      const cells = this.getGridCellsForBoundingBox(
        element.bounding_box,
        cellSize,
      );

      cells.forEach((cellKey) => {
        if (!spatialIndex.grid.has(cellKey)) {
          spatialIndex.grid.set(cellKey, new Set());
        }
        spatialIndex.grid.get(cellKey)!.add(element.id);
      });
    });

    this.logger.debug(
      `Spatial index built: ${spatialIndex.grid.size} cells, avg ${
        Array.from(spatialIndex.grid.values()).reduce(
          (sum, set) => sum + set.size,
          0,
        ) / spatialIndex.grid.size
      } elements per cell`,
    );

    return spatialIndex;
  }

  private getGridCellsForBoundingBox(
    bbox: BoundingBox,
    cellSize: number,
  ): string[] {
    const cells: string[] = [];

    const minCellX = Math.floor(bbox.minX / cellSize);
    const maxCellX = Math.floor(bbox.maxX / cellSize);
    const minCellY = Math.floor(bbox.minY / cellSize);
    const maxCellY = Math.floor(bbox.maxY / cellSize);
    const minCellZ = Math.floor(bbox.minZ / cellSize);
    const maxCellZ = Math.floor(bbox.maxZ / cellSize);

    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        for (let z = minCellZ; z <= maxCellZ; z++) {
          cells.push(`${x},${y},${z}`);
        }
      }
    }

    return cells;
  }

  private async detectClashesWithSpatialIndex(
    spatialIndex: SpatialIndex,
    config: ClashDetectionConfig,
  ): Promise<ClashResult[]> {
    const clashes: ClashResult[] = [];
    const processedPairs = new Set<string>();

    let totalComparisons = 0;
    let actualChecks = 0;

    // Process each grid cell
    for (const [cellKey, elementIds] of spatialIndex.grid) {
      const elementsInCell = Array.from(elementIds).map(
        (id) => spatialIndex.elements.get(id)!,
      );

      // Check elements within the same cell
      for (let i = 0; i < elementsInCell.length - 1; i++) {
        for (let j = i + 1; j < elementsInCell.length; j++) {
          const elementA = elementsInCell[i];
          const elementB = elementsInCell[j];

          const pairKey = `${elementA.id}_${elementB.id}`;
          const reversePairKey = `${elementB.id}_${elementA.id}`;

          if (
            processedPairs.has(pairKey) ||
            processedPairs.has(reversePairKey)
          ) {
            continue;
          }

          processedPairs.add(pairKey);
          totalComparisons++;

          // Skip if same model (no self-clashes within same discipline model)
          if (elementA.model_id === elementB.model_id) {
            continue;
          }

          // Apply discipline-based filtering
          if (
            !this.shouldCheckDisciplinePair(
              elementA.discipline,
              elementB.discipline,
            )
          ) {
            continue;
          }

          actualChecks++;

          // Perform detailed clash detection
          const clash = this.detectClashBetweenElements(
            elementA,
            elementB,
            config,
          );
          if (clash) {
            clashes.push(clash);
          }

          // Progress reporting every 1000 checks
          if (actualChecks % 1000 === 0) {
            await this.updateJobProgress(
              spatialIndex.elements.size,
              actualChecks,
              totalComparisons,
            );
          }
        }
      }
    }

    this.logger.debug(
      `Clash detection completed: ${totalComparisons} total pairs, ${actualChecks} actual checks, ${clashes.length} clashes found`,
    );

    return clashes;
  }

  private shouldCheckDisciplinePair(
    disciplineA: string,
    disciplineB: string,
  ): boolean {
    // Skip pairs that are unlikely to clash or are not relevant
    const skipPairs = [
      ['architecture', 'architecture'], // Same discipline
      ['structure', 'structure'],
      ['mep_hvac', 'mep_hvac'],
      ['mep_plumbing', 'mep_plumbing'],
      ['mep_electrical', 'mep_electrical'],
    ];

    return !skipPairs.some(
      ([a, b]) =>
        (disciplineA === a && disciplineB === b) ||
        (disciplineA === b && disciplineB === a),
    );
  }

  private detectClashBetweenElements(
    elementA: BIMElement,
    elementB: BIMElement,
    config: ClashDetectionConfig,
  ): ClashResult | null {
    const bboxA = elementA.bounding_box;
    const bboxB = elementB.bounding_box;

    // Fast bounding box intersection test
    const intersection = this.calculateBoundingBoxIntersection(bboxA, bboxB);

    if (!intersection) {
      // Check for clearance violations
      const distance = this.calculateMinimumDistance(bboxA, bboxB);
      const requiredClearance = this.getRequiredClearance(
        elementA,
        elementB,
        config,
      );

      if (distance < requiredClearance) {
        return this.createClashResult(
          elementA,
          elementB,
          'clearance',
          intersection || { volume: 0 },
          distance,
          requiredClearance,
          config,
        );
      }

      return null;
    }

    // Determine clash type based on disciplines and element types
    const clashType = this.determineClashType(elementA, elementB);
    const distance = 0; // Elements are intersecting

    return this.createClashResult(
      elementA,
      elementB,
      clashType,
      intersection,
      distance,
      0,
      config,
    );
  }

  private calculateBoundingBoxIntersection(
    bboxA: BoundingBox,
    bboxB: BoundingBox,
  ): { volume: number; center: { x: number; y: number; z: number } } | null {
    // Check if bounding boxes intersect
    if (
      bboxA.maxX < bboxB.minX ||
      bboxA.minX > bboxB.maxX ||
      bboxA.maxY < bboxB.minY ||
      bboxA.minY > bboxB.maxY ||
      bboxA.maxZ < bboxB.minZ ||
      bboxA.minZ > bboxB.maxZ
    ) {
      return null;
    }

    // Calculate intersection volume
    const overlapX =
      Math.min(bboxA.maxX, bboxB.maxX) - Math.max(bboxA.minX, bboxB.minX);
    const overlapY =
      Math.min(bboxA.maxY, bboxB.maxY) - Math.max(bboxA.minY, bboxB.minY);
    const overlapZ =
      Math.min(bboxA.maxZ, bboxB.maxZ) - Math.max(bboxA.minZ, bboxB.minZ);

    const volume =
      Math.max(0, overlapX) * Math.max(0, overlapY) * Math.max(0, overlapZ);

    // Calculate intersection center
    const center = {
      x:
        (Math.max(bboxA.minX, bboxB.minX) + Math.min(bboxA.maxX, bboxB.maxX)) /
        2,
      y:
        (Math.max(bboxA.minY, bboxB.minY) + Math.min(bboxA.maxY, bboxB.maxY)) /
        2,
      z:
        (Math.max(bboxA.minZ, bboxB.minZ) + Math.min(bboxA.maxZ, bboxB.maxZ)) /
        2,
    };

    return { volume, center };
  }

  private calculateMinimumDistance(
    bboxA: BoundingBox,
    bboxB: BoundingBox,
  ): number {
    const dx = Math.max(
      0,
      Math.max(bboxA.minX - bboxB.maxX, bboxB.minX - bboxA.maxX),
    );
    const dy = Math.max(
      0,
      Math.max(bboxA.minY - bboxB.maxY, bboxB.minY - bboxA.maxY),
    );
    const dz = Math.max(
      0,
      Math.max(bboxA.minZ - bboxB.maxZ, bboxB.minZ - bboxA.maxZ),
    );

    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private getRequiredClearance(
    elementA: BIMElement,
    elementB: BIMElement,
    config: ClashDetectionConfig,
  ): number {
    const clearances = config.clearance_requirements;

    // Look up required clearance between disciplines
    const disciplineA = elementA.discipline;
    const disciplineB = elementB.discipline;

    if (clearances[disciplineA] && clearances[disciplineA][disciplineB]) {
      return clearances[disciplineA][disciplineB];
    }

    if (clearances[disciplineB] && clearances[disciplineB][disciplineA]) {
      return clearances[disciplineB][disciplineA];
    }

    // Default clearance based on element types
    if (
      this.isStructuralElement(elementA) ||
      this.isStructuralElement(elementB)
    ) {
      return 50; // 50mm clearance from structural elements
    }

    if (this.isMEPElement(elementA) && this.isMEPElement(elementB)) {
      return 100; // 100mm clearance between MEP elements
    }

    return config.tolerance_mm; // Default to tolerance
  }

  private isStructuralElement(element: BIMElement): boolean {
    return [
      'IfcColumn',
      'IfcBeam',
      'IfcSlab',
      'IfcWall',
      'IfcFooting',
    ].includes(element.ifc_type);
  }

  private isMEPElement(element: BIMElement): boolean {
    return [
      'IfcDuctSegment',
      'IfcPipeSegment',
      'IfcCableSegment',
      'IfcPump',
      'IfcFan',
    ].includes(element.ifc_type);
  }

  private determineClashType(
    elementA: BIMElement,
    elementB: BIMElement,
  ): 'hard' | 'soft' | 'clearance' {
    // Hard clashes: Solid structural elements intersecting
    if (
      this.isStructuralElement(elementA) &&
      this.isStructuralElement(elementB)
    ) {
      return 'hard';
    }

    // Hard clashes: MEP going through structural without proper opening
    if (
      (this.isStructuralElement(elementA) && this.isMEPElement(elementB)) ||
      (this.isMEPElement(elementA) && this.isStructuralElement(elementB))
    ) {
      return 'hard';
    }

    // Soft clashes: MEP elements intersecting (might be intentional connections)
    if (this.isMEPElement(elementA) && this.isMEPElement(elementB)) {
      // Check if they're the same type (might be intentional connections)
      if (elementA.ifc_type === elementB.ifc_type) {
        return 'soft';
      }
      return 'hard'; // Different MEP types intersecting is usually a hard clash
    }

    // Default to soft clash
    return 'soft';
  }

  private createClashResult(
    elementA: BIMElement,
    elementB: BIMElement,
    clashType: 'hard' | 'soft' | 'clearance',
    intersection: {
      volume: number;
      center?: { x: number; y: number; z: number };
    },
    distance: number,
    requiredClearance: number,
    config: ClashDetectionConfig,
  ): ClashResult {
    // Calculate severity based on multiple factors
    const severity = this.calculateClashSeverity(
      elementA,
      elementB,
      clashType,
      intersection.volume,
      distance,
      requiredClearance,
    );

    // Calculate confidence based on element types and intersection characteristics
    const confidence = this.calculateClashConfidence(
      elementA,
      elementB,
      intersection.volume,
      distance,
    );

    // Calculate resolution priority
    const resolutionPriority = this.calculateResolutionPriority(
      elementA,
      elementB,
      severity,
      clashType,
    );

    // Default center if not provided
    const center =
      intersection.center || this.calculateElementsCentroid(elementA, elementB);

    return {
      element_a_id: elementA.id,
      element_b_id: elementB.id,
      element_a_guid: elementA.ifc_guid,
      element_b_guid: elementB.ifc_guid,
      clash_type: clashType,
      severity,
      intersection_volume: intersection.volume,
      clearance_distance: Math.max(0, requiredClearance - distance),
      clash_center: center,
      confidence,
      resolution_priority: resolutionPriority,
    };
  }

  private calculateClashSeverity(
    elementA: BIMElement,
    elementB: BIMElement,
    clashType: 'hard' | 'soft' | 'clearance',
    intersectionVolume: number,
    distance: number,
    requiredClearance: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical: Hard clashes between critical elements
    if (
      clashType === 'hard' &&
      (elementA.priority <= 2 || elementB.priority <= 2)
    ) {
      return 'critical';
    }

    // Critical: Very large intersection volumes
    if (intersectionVolume > 1000000) {
      // > 1m³
      return 'critical';
    }

    // High: Hard clashes with significant volume
    if (clashType === 'hard' && intersectionVolume > 100000) {
      // > 0.1m³
      return 'high';
    }

    // High: Major clearance violations
    if (clashType === 'clearance' && requiredClearance - distance > 100) {
      // > 100mm violation
      return 'high';
    }

    // Medium: Moderate intersections or clearance violations
    if (intersectionVolume > 10000 || requiredClearance - distance > 50) {
      return 'medium';
    }

    // Low: Minor intersections or violations
    return 'low';
  }

  private calculateClashConfidence(
    elementA: BIMElement,
    elementB: BIMElement,
    intersectionVolume: number,
    distance: number,
  ): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for larger intersections
    if (intersectionVolume > 1000) confidence += 0.2;
    if (intersectionVolume > 100000) confidence += 0.1;

    // Higher confidence for well-defined element types
    const wellDefinedTypes = [
      'IfcColumn',
      'IfcBeam',
      'IfcSlab',
      'IfcDuctSegment',
      'IfcPipeSegment',
    ];
    if (
      wellDefinedTypes.includes(elementA.ifc_type) &&
      wellDefinedTypes.includes(elementB.ifc_type)
    ) {
      confidence += 0.1;
    }

    // Lower confidence for very small intersections (might be rounding errors)
    if (intersectionVolume < 10 && distance < 1) {
      confidence -= 0.3;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private calculateResolutionPriority(
    elementA: BIMElement,
    elementB: BIMElement,
    severity: 'low' | 'medium' | 'high' | 'critical',
    clashType: 'hard' | 'soft' | 'clearance',
  ): number {
    let priority = 5; // Base priority

    // Severity factor
    const severityMultiplier = {
      critical: 3,
      high: 2,
      medium: 1.5,
      low: 1,
    };
    priority *= severityMultiplier[severity];

    // Clash type factor
    const clashTypeMultiplier = {
      hard: 2,
      soft: 1.5,
      clearance: 1,
    };
    priority *= clashTypeMultiplier[clashType];

    // Element priority factor (lower priority number = higher importance)
    const avgElementPriority = (elementA.priority + elementB.priority) / 2;
    priority *= 6 - avgElementPriority; // Invert so lower priority numbers give higher score

    return Math.min(10, Math.max(1, Math.round(priority)));
  }

  private calculateElementsCentroid(
    elementA: BIMElement,
    elementB: BIMElement,
  ): { x: number; y: number; z: number } {
    const bboxA = elementA.bounding_box;
    const bboxB = elementB.bounding_box;

    return {
      x: ((bboxA.minX + bboxA.maxX) / 2 + (bboxB.minX + bboxB.maxX) / 2) / 2,
      y: ((bboxA.minY + bboxA.maxY) / 2 + (bboxB.minY + bboxB.maxY) / 2) / 2,
      z: ((bboxA.minZ + bboxA.maxZ) / 2 + (bboxB.minZ + bboxB.maxZ) / 2) / 2,
    };
  }

  private postProcessClashes(
    clashes: ClashResult[],
    config: ClashDetectionConfig,
  ): ClashResult[] {
    // Remove low-confidence clashes
    let filtered = clashes.filter((clash) => clash.confidence > 0.3);

    // Remove duplicate clashes (very close clashes between same elements)
    filtered = this.removeDuplicateClashes(filtered);

    // Filter by severity if needed
    if (config.performance_mode === 'fast') {
      filtered = filtered.filter((clash) => clash.severity !== 'low');
    }

    return filtered;
  }

  private removeDuplicateClashes(clashes: ClashResult[]): ClashResult[] {
    const uniqueClashes = new Map<string, ClashResult>();

    clashes.forEach((clash) => {
      const key = `${clash.element_a_guid}_${clash.element_b_guid}`;
      const reverseKey = `${clash.element_b_guid}_${clash.element_a_guid}`;

      if (!uniqueClashes.has(key) && !uniqueClashes.has(reverseKey)) {
        uniqueClashes.set(key, clash);
      } else {
        // Keep the one with higher confidence/priority
        const existing =
          uniqueClashes.get(key) || uniqueClashes.get(reverseKey);
        if (
          existing &&
          (clash.confidence > existing.confidence ||
            clash.resolution_priority > existing.resolution_priority)
        ) {
          uniqueClashes.delete(key);
          uniqueClashes.delete(reverseKey);
          uniqueClashes.set(key, clash);
        }
      }
    });

    return Array.from(uniqueClashes.values());
  }

  private async updateJobProgress(
    totalElements: number,
    actualChecks: number,
    totalComparisons: number,
  ): Promise<void> {
    // This would update the job progress in the database
    // Implementation depends on job tracking system
    this.logger.debug(
      `Progress: ${actualChecks}/${totalComparisons} checks completed (${totalElements} elements)`,
    );
  }

  // Public method to get clash detection statistics
  async getClashDetectionStats(
    companyId: string,
    projectId?: string,
  ): Promise<any> {
    let query = this.supabase
      .from('bim_clashes')
      .select('*')
      .eq('company_id', companyId);

    if (projectId) {
      // Join with models to filter by project
      const { data: modelIds } = await this.supabase
        .from('bim_models')
        .select('id')
        .eq('project_id', projectId);

      if (modelIds && modelIds.length > 0) {
        query = query.in(
          'model_a_id',
          modelIds.map((m) => m.id),
        );
      }
    }

    const { data: clashes } = await query;

    if (!clashes) return null;

    return {
      totalClashes: clashes.length,
      bySeverity: {
        critical: clashes.filter((c) => c.severity === 'critical').length,
        high: clashes.filter((c) => c.severity === 'high').length,
        medium: clashes.filter((c) => c.severity === 'medium').length,
        low: clashes.filter((c) => c.severity === 'low').length,
      },
      byType: {
        hard: clashes.filter((c) => c.clash_type === 'hard').length,
        soft: clashes.filter((c) => c.clash_type === 'soft').length,
        clearance: clashes.filter((c) => c.clash_type === 'clearance').length,
      },
      byStatus: {
        pending: clashes.filter((c) => c.status === 'pending').length,
        accepted: clashes.filter((c) => c.status === 'accepted').length,
        resolved: clashes.filter((c) => c.status === 'resolved').length,
        ignored: clashes.filter((c) => c.status === 'ignored').length,
      },
    };
  }
}
