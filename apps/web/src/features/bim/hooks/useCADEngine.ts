/**
 * useCADEngine — Hook for managing CAD file processing and interaction
 * 
 * Provides functionality for:
 * - DXF file loading and parsing
 * - 2D/3D coordinate transformation
 * - CAD element selection and properties
 * - Integration with BIM federation
 */
import { useState, useCallback, useRef } from 'react';

export interface CADElement {
  id: string;
  type: string;
  layer: string;
  color: string;
  properties: Record<string, any>;
  geometry: {
    coordinates: number[];
    bounds: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
  };
}

export interface CADMeasurement {
  id: string;
  distance: number;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  units: string;
  createdAt: Date;
}

export interface CADEngineState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  fileName: string | null;
  layers: Array<{
    name: string;
    color: string;
    visible: boolean;
    entityCount: number;
  }>;
  selectedElements: CADElement[];
  measurements: CADMeasurement[];
  currentTool: 'select' | 'pan' | 'zoom' | 'measure';
  viewState: {
    zoom: number;
    panX: number;
    panY: number;
    center: { x: number; y: number };
  };
}

interface UseCADEngineOptions {
  onElementSelect?: (elements: CADElement[]) => void;
  onMeasurementComplete?: (measurement: CADMeasurement) => void;
  onError?: (error: string) => void;
}

export function useCADEngine(options?: UseCADEngineOptions) {
  const [state, setState] = useState<CADEngineState>({
    isLoaded: false,
    isLoading: false,
    error: null,
    fileName: null,
    layers: [],
    selectedElements: [],
    measurements: [],
    currentTool: 'select',
    viewState: {
      zoom: 1,
      panX: 0,
      panY: 0,
      center: { x: 0, y: 0 },
    },
  });

  const dxfDataRef = useRef<any>(null);

  /**
   * Load DXF file from ArrayBuffer
   */
  const loadDXFFile = useCallback(async (
    buffer: ArrayBuffer, 
    fileName: string = 'drawing.dxf'
  ): Promise<void> => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));

    try {
      // Dynamic import to avoid loading dxf-parser in SSR
      const { default: DxfParser } = await import('dxf-parser');
      
      const parser = new DxfParser();
      const text = new TextDecoder().decode(buffer);
      const dxf = parser.parseSync(text);

      if (!dxf) {
        throw new Error('Failed to parse DXF file');
      }

      dxfDataRef.current = dxf;

      // Process layers
      const layersMap = new Map();
      const entities = dxf.entities || [];

      entities.forEach((entity: any) => {
        const layerName = entity.layer || '0';
        if (!layersMap.has(layerName)) {
          layersMap.set(layerName, {
            name: layerName,
            color: getEntityColor(entity),
            visible: true,
            entityCount: 0,
          });
        }
        layersMap.get(layerName).entityCount++;
      });

      const layers = Array.from(layersMap.values());

      // Calculate drawing bounds
      const bounds = calculateDrawingBounds(entities);
      const center = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      };

      setState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        fileName,
        layers,
        viewState: {
          ...prev.viewState,
          center,
        },
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      options?.onError?.(errorMessage);
    }
  }, [options]);

  /**
   * Load DXF from URL
   */
  const loadDXFFromUrl = useCallback(async (url: string): Promise<void> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch DXF file: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const fileName = url.split('/').pop() || 'drawing.dxf';
      
      await loadDXFFile(buffer, fileName);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load DXF file';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoading: false 
      }));
      
      options?.onError?.(errorMessage);
    }
  }, [loadDXFFile, options]);

  /**
   * Select elements at point
   */
  const selectElementsAtPoint = useCallback((x: number, y: number, tolerance = 5): CADElement[] => {
    if (!dxfDataRef.current) return [];

    const entities = dxfDataRef.current.entities || [];
    const selectedElements: CADElement[] = [];

    entities.forEach((entity: any, index: number) => {
      if (isPointNearEntity(x, y, entity, tolerance)) {
        const element: CADElement = {
          id: `${entity.type}_${index}`,
          type: entity.type,
          layer: entity.layer || '0',
          color: getEntityColor(entity),
          properties: extractEntityProperties(entity),
          geometry: {
            coordinates: extractEntityCoordinates(entity),
            bounds: calculateEntityBounds(entity),
          },
        };
        selectedElements.push(element);
      }
    });

    setState(prev => ({ ...prev, selectedElements }));
    options?.onElementSelect?.(selectedElements);

    return selectedElements;
  }, [options]);

  /**
   * Add measurement
   */
  const addMeasurement = useCallback((
    startPoint: { x: number; y: number }, 
    endPoint: { x: number; y: number }
  ): CADMeasurement => {
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    const measurement: CADMeasurement = {
      id: `measure_${Date.now()}`,
      distance,
      startPoint,
      endPoint,
      units: 'mm', // Default units, could be configurable
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      measurements: [...prev.measurements, measurement],
    }));

    options?.onMeasurementComplete?.(measurement);
    return measurement;
  }, [options]);

  /**
   * Remove measurement
   */
  const removeMeasurement = useCallback((measurementId: string): void => {
    setState(prev => ({
      ...prev,
      measurements: prev.measurements.filter(m => m.id !== measurementId),
    }));
  }, []);

  /**
   * Clear all measurements
   */
  const clearMeasurements = useCallback((): void => {
    setState(prev => ({ ...prev, measurements: [] }));
  }, []);

  /**
   * Toggle layer visibility
   */
  const toggleLayerVisibility = useCallback((layerName: string): void => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.name === layerName
          ? { ...layer, visible: !layer.visible }
          : layer
      ),
    }));
  }, []);

  /**
   * Set current tool
   */
  const setCurrentTool = useCallback((tool: CADEngineState['currentTool']): void => {
    setState(prev => ({ ...prev, currentTool: tool }));
  }, []);

  /**
   * Update view state
   */
  const updateViewState = useCallback((
    viewUpdate: Partial<CADEngineState['viewState']>
  ): void => {
    setState(prev => ({
      ...prev,
      viewState: { ...prev.viewState, ...viewUpdate },
    }));
  }, []);

  /**
   * Fit drawing to view
   */
  const fitToView = useCallback((): void => {
    if (!dxfDataRef.current) return;

    const entities = dxfDataRef.current.entities || [];
    const bounds = calculateDrawingBounds(entities);
    
    const center = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };

    // Calculate zoom to fit (this would depend on canvas/viewport size)
    const zoom = 1; // Simplified - would calculate based on viewport

    setState(prev => ({
      ...prev,
      viewState: {
        ...prev.viewState,
        center,
        zoom,
        panX: 0,
        panY: 0,
      },
    }));
  }, []);

  /**
   * Export drawing data
   */
  const exportDrawingData = useCallback(() => {
    return {
      fileName: state.fileName,
      layers: state.layers,
      measurements: state.measurements,
      bounds: dxfDataRef.current ? calculateDrawingBounds(dxfDataRef.current.entities || []) : null,
      metadata: dxfDataRef.current?.header || {},
    };
  }, [state]);

  return {
    state,
    loadDXFFile,
    loadDXFFromUrl,
    selectElementsAtPoint,
    addMeasurement,
    removeMeasurement,
    clearMeasurements,
    toggleLayerVisibility,
    setCurrentTool,
    updateViewState,
    fitToView,
    exportDrawingData,
  };
}

// Helper functions

function getEntityColor(entity: any): string {
  const colorIndex = entity.colorIndex || entity.color || 7;
  const colorMap: Record<number, string> = {
    0: '#000000', 1: '#FF0000', 2: '#FFFF00', 3: '#00FF00',
    4: '#00FFFF', 5: '#0000FF', 6: '#FF00FF', 7: '#FFFFFF',
  };
  return colorMap[colorIndex] || '#CCCCCC';
}

function extractEntityProperties(entity: any): Record<string, any> {
  return {
    type: entity.type,
    layer: entity.layer,
    color: entity.color,
    lineType: entity.lineType,
    lineWeight: entity.lineWeight,
    ...entity.extendedData,
  };
}

function extractEntityCoordinates(entity: any): number[] {
  switch (entity.type) {
    case 'LINE':
      return [
        entity.vertices[0].x, entity.vertices[0].y,
        entity.vertices[1].x, entity.vertices[1].y,
      ];
    case 'CIRCLE':
      return [entity.center.x, entity.center.y, entity.radius];
    case 'POLYLINE':
    case 'LWPOLYLINE':
      return entity.vertices.flatMap((v: any) => [v.x, v.y]);
    default:
      return [];
  }
}

function calculateEntityBounds(entity: any): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const updateBounds = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };

  switch (entity.type) {
    case 'LINE':
      updateBounds(entity.vertices[0].x, entity.vertices[0].y);
      updateBounds(entity.vertices[1].x, entity.vertices[1].y);
      break;
    case 'CIRCLE':
      updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
      updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
      break;
    case 'POLYLINE':
    case 'LWPOLYLINE':
      entity.vertices.forEach((v: any) => updateBounds(v.x, v.y));
      break;
  }

  return { minX, minY, maxX, maxY };
}

function calculateDrawingBounds(entities: any[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  entities.forEach(entity => {
    const bounds = calculateEntityBounds(entity);
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  });

  return { minX, minY, maxX, maxY };
}

function isPointNearEntity(x: number, y: number, entity: any, tolerance: number): boolean {
  const bounds = calculateEntityBounds(entity);
  return (
    x >= bounds.minX - tolerance &&
    x <= bounds.maxX + tolerance &&
    y >= bounds.minY - tolerance &&
    y <= bounds.maxY + tolerance
  );
}