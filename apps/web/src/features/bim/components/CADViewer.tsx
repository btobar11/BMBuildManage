/**
 * CADViewer — 2D CAD Viewer for DXF Files
 * 
 * Advanced 2D viewer with:
 * - DXF file parsing and rendering using dxf-parser
 * - Interactive canvas with fabric.js
 * - Pan, zoom, and measurement tools
 * - Layer management and visibility controls
 * - High-performance rendering for large drawings
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import * as DxfParser from 'dxf-parser';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Ruler,
  Layers,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Maximize,
  Grid3X3,
  MousePointer,
  AlertCircle,
} from 'lucide-react';

interface CADViewerProps {
  dxfUrl?: string;
  dxfBuffer?: ArrayBuffer;
  className?: string;
  onElementSelect?: (element: any) => void;
  onMeasurement?: (measurement: { distance: number; startPoint: fabric.Point; endPoint: fabric.Point }) => void;
}

interface CADLayer {
  name: string;
  color: string;
  visible: boolean;
  entities: fabric.Object[];
}

interface CADViewerState {
  isLoading: boolean;
  error: string | null;
  loadedFile: string | null;
  layers: CADLayer[];
  currentTool: 'select' | 'pan' | 'measure';
  showGrid: boolean;
  showLayers: boolean;
}

// DXF entity colors mapping (AutoCAD Color Index)
const DXF_COLORS: Record<number, string> = {
  0: '#000000', // ByBlock
  1: '#FF0000', // Red
  2: '#FFFF00', // Yellow  
  3: '#00FF00', // Green
  4: '#00FFFF', // Cyan
  5: '#0000FF', // Blue
  6: '#FF00FF', // Magenta
  7: '#FFFFFF', // White/Black
  8: '#414141', // Dark Gray
  9: '#808080', // Light Gray
  250: '#333333', // Default
};

const DEFAULT_DXF_COLOR = '#CCCCCC';

export function CADViewer({
  dxfUrl,
  dxfBuffer,
  className = '',
  onElementSelect,
  onMeasurement,
}: CADViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [viewerState, setViewerState] = useState<CADViewerState>({
    isLoading: false,
    error: null,
    loadedFile: null,
    layers: [],
    currentTool: 'select',
    showGrid: true,
    showLayers: false,
  });

  const [measurementMode, setMeasurementMode] = useState(false);
  const [measurementPoints, setMeasurementPoints] = useState<fabric.Point[]>([]);
  const [zoom, setZoom] = useState(1);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a', // Dark CAD background
      selection: viewerState.currentTool === 'select',
    });

    fabricCanvasRef.current = canvas;

    // Enable zoom with mouse wheel
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      setZoom(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Handle panning
    canvas.on('mouse:down', (opt) => {
      if (viewerState.currentTool === 'pan') {
        canvas.isDragging = true;
        canvas.selection = false;
        canvas.lastPosX = opt.e.clientX;
        canvas.lastPosY = opt.e.clientY;
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (canvas.isDragging && viewerState.currentTool === 'pan') {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += opt.e.clientX - canvas.lastPosX;
          vpt[5] += opt.e.clientY - canvas.lastPosY;
          canvas.requestRenderAll();
          canvas.lastPosX = opt.e.clientX;
          canvas.lastPosY = opt.e.clientY;
        }
      }
    });

    canvas.on('mouse:up', () => {
      canvas.setViewportTransform(canvas.viewportTransform);
      canvas.isDragging = false;
      canvas.selection = viewerState.currentTool === 'select';
    });

    // Handle measurement tool
    canvas.on('mouse:down', (opt) => {
      if (viewerState.currentTool === 'measure') {
        const pointer = canvas.getPointer(opt.e);
        const newPoint = new fabric.Point(pointer.x, pointer.y);
        
        if (measurementPoints.length === 0) {
          setMeasurementPoints([newPoint]);
        } else if (measurementPoints.length === 1) {
          const distance = measurementPoints[0].distanceFrom(newPoint);
          
          // Draw measurement line
          const line = new fabric.Line([
            measurementPoints[0].x,
            measurementPoints[0].y,
            newPoint.x,
            newPoint.y,
          ], {
            stroke: '#00FF00',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          });

          // Add distance text
          const text = new fabric.Text(`${distance.toFixed(2)}`, {
            left: (measurementPoints[0].x + newPoint.x) / 2,
            top: (measurementPoints[0].y + newPoint.y) / 2 - 10,
            fill: '#00FF00',
            fontSize: 14,
            fontFamily: 'monospace',
            selectable: false,
            evented: false,
          });

          canvas.add(line, text);
          
          onMeasurement?.({
            distance,
            startPoint: measurementPoints[0],
            endPoint: newPoint,
          });

          setMeasurementPoints([]);
          setMeasurementMode(false);
          setViewerState(prev => ({ ...prev, currentTool: 'select' }));
        }
      }
    });

    // Handle selection
    canvas.on('selection:created', (opt) => {
      const activeObject = opt.selected?.[0];
      if (activeObject && onElementSelect) {
        onElementSelect({
          type: activeObject.type,
          data: activeObject.toObject(),
        });
      }
    });

    return () => {
      canvas.dispose();
    };
  }, [canvasRef.current, viewerState.currentTool, measurementPoints, onElementSelect, onMeasurement]);

  // Load DXF file
  const loadDxfFile = useCallback(async (buffer: ArrayBuffer) => {
    if (!fabricCanvasRef.current) return;

    setViewerState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const parser = new DxfParser();
      const text = new TextDecoder().decode(buffer);
      const dxf = parser.parseSync(text);

      if (!dxf) {
        throw new Error('Failed to parse DXF file');
      }

      const canvas = fabricCanvasRef.current;
      canvas.clear();

      // Process entities by layer
      const layersMap = new Map<string, CADLayer>();
      const entities = dxf.entities || [];

      for (const entity of entities) {
        const layerName = entity.layer || '0';
        
        if (!layersMap.has(layerName)) {
          layersMap.set(layerName, {
            name: layerName,
            color: DXF_COLORS[entity.colorIndex] || DEFAULT_DXF_COLOR,
            visible: true,
            entities: [],
          });
        }

        const layer = layersMap.get(layerName)!;
        const fabricObject = convertDxfEntityToFabric(entity, layer.color);
        
        if (fabricObject) {
          layer.entities.push(fabricObject);
          canvas.add(fabricObject);
        }
      }

      // Update layers state
      const layers = Array.from(layersMap.values());
      setViewerState(prev => ({
        ...prev,
        isLoading: false,
        layers,
        loadedFile: 'drawing.dxf',
      }));

      // Fit canvas to content
      fitToContent();

    } catch (error) {
      console.error('Error loading DXF file:', error);
      setViewerState(prev => ({
        ...prev,
        isLoading: false,
        error: `Error loading DXF file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
    }
  }, []);

  // Convert DXF entity to Fabric.js object
  const convertDxfEntityToFabric = (entity: any, color: string): fabric.Object | null => {
    switch (entity.type) {
      case 'LINE':
        return new fabric.Line([
          entity.vertices[0].x,
          -entity.vertices[0].y, // Flip Y coordinate
          entity.vertices[1].x,
          -entity.vertices[1].y,
        ], {
          stroke: color,
          strokeWidth: 1,
          selectable: true,
          hoverCursor: 'pointer',
        });

      case 'POLYLINE':
      case 'LWPOLYLINE':
        if (entity.vertices && entity.vertices.length > 1) {
          const points = entity.vertices.map((v: any) => ({ x: v.x, y: -v.y }));
          return new fabric.Polyline(points, {
            stroke: color,
            strokeWidth: 1,
            fill: '',
            selectable: true,
            hoverCursor: 'pointer',
          });
        }
        return null;

      case 'CIRCLE':
        return new fabric.Circle({
          left: entity.center.x - entity.radius,
          top: -entity.center.y - entity.radius,
          radius: entity.radius,
          stroke: color,
          strokeWidth: 1,
          fill: '',
          selectable: true,
          hoverCursor: 'pointer',
        });

      case 'ARC':
        // Convert arc to path
        const startAngle = entity.startAngle * (180 / Math.PI);
        const endAngle = entity.endAngle * (180 / Math.PI);
        return new fabric.Circle({
          left: entity.center.x - entity.radius,
          top: -entity.center.y - entity.radius,
          radius: entity.radius,
          stroke: color,
          strokeWidth: 1,
          fill: '',
          startAngle: startAngle,
          endAngle: endAngle,
          selectable: true,
          hoverCursor: 'pointer',
        });

      case 'TEXT':
        return new fabric.Text(entity.text, {
          left: entity.startPoint.x,
          top: -entity.startPoint.y,
          fill: color,
          fontSize: entity.textHeight || 10,
          fontFamily: 'Arial',
          selectable: true,
          hoverCursor: 'pointer',
        });

      default:
        console.warn(`Unsupported DXF entity type: ${entity.type}`);
        return null;
    }
  };

  // Fit canvas to content
  const fitToContent = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (objects.length === 0) return;

    const group = new fabric.Group(objects);
    const boundingRect = group.getBoundingRect();
    
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    
    const scaleX = canvasWidth / boundingRect.width;
    const scaleY = canvasHeight / boundingRect.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% of available space

    canvas.setZoom(scale);
    canvas.absolutePan(new fabric.Point(
      -boundingRect.left * scale + (canvasWidth - boundingRect.width * scale) / 2,
      -boundingRect.top * scale + (canvasHeight - boundingRect.height * scale) / 2
    ));

    setZoom(scale);
    group.destroy(); // Clean up temporary group
    canvas.renderAll();
  }, []);

  // Tool handlers
  const handleToolChange = (tool: 'select' | 'pan' | 'measure') => {
    setViewerState(prev => ({ ...prev, currentTool: tool }));
    setMeasurementMode(tool === 'measure');
    
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.selection = tool === 'select';
      canvas.defaultCursor = tool === 'pan' ? 'grab' : 'default';
    }
  };

  const handleZoomIn = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const zoom = Math.min(canvas.getZoom() * 1.1, 20);
      canvas.setZoom(zoom);
      setZoom(zoom);
      canvas.renderAll();
    }
  };

  const handleZoomOut = () => {
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      const zoom = Math.max(canvas.getZoom() * 0.9, 0.01);
      canvas.setZoom(zoom);
      setZoom(zoom);
      canvas.renderAll();
    }
  };

  const handleResetView = () => {
    fitToContent();
  };

  const toggleLayerVisibility = (layerName: string) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setViewerState(prev => ({
      ...prev,
      layers: prev.layers.map(layer => {
        if (layer.name === layerName) {
          const newVisible = !layer.visible;
          
          // Update fabric objects visibility
          layer.entities.forEach(obj => {
            obj.visible = newVisible;
          });
          
          canvas.renderAll();
          
          return { ...layer, visible: newVisible };
        }
        return layer;
      }),
    }));
  };

  // Load file on prop change
  useEffect(() => {
    if (dxfBuffer) {
      loadDxfFile(dxfBuffer);
    } else if (dxfUrl) {
      fetch(dxfUrl)
        .then(response => response.arrayBuffer())
        .then(loadDxfFile)
        .catch(error => {
          setViewerState(prev => ({
            ...prev,
            error: `Failed to load DXF file: ${error.message}`,
          }));
        });
    }
  }, [dxfUrl, dxfBuffer, loadDxfFile]);

  // Resize canvas when container changes
  useEffect(() => {
    const handleResize = () => {
      const canvas = fabricCanvasRef.current;
      if (canvas && canvasRef.current?.parentElement) {
        const parent = canvasRef.current.parentElement;
        canvas.setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
        canvas.renderAll();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`flex h-full bg-gray-900 text-white ${className}`}>
      {/* Toolbar */}
      <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4 space-y-2">
        <button
          onClick={() => handleToolChange('select')}
          className={`p-3 rounded-lg transition-colors ${
            viewerState.currentTool === 'select'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Select Tool"
        >
          <MousePointer size={20} />
        </button>
        
        <button
          onClick={() => handleToolChange('pan')}
          className={`p-3 rounded-lg transition-colors ${
            viewerState.currentTool === 'pan'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Pan Tool"
        >
          <Move size={20} />
        </button>
        
        <button
          onClick={() => handleToolChange('measure')}
          className={`p-3 rounded-lg transition-colors ${
            viewerState.currentTool === 'measure'
              ? 'bg-blue-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Measure Tool"
        >
          <Ruler size={20} />
        </button>

        <div className="w-full h-px bg-gray-700 my-2" />

        <button
          onClick={handleZoomIn}
          className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        
        <button
          onClick={handleZoomOut}
          className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        
        <button
          onClick={handleResetView}
          className="p-3 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Fit to Content"
        >
          <Maximize size={20} />
        </button>

        <div className="w-full h-px bg-gray-700 my-2" />

        <button
          onClick={() => setViewerState(prev => ({ ...prev, showLayers: !prev.showLayers }))}
          className={`p-3 rounded-lg transition-colors ${
            viewerState.showLayers
              ? 'bg-green-500 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title="Toggle Layers"
        >
          <Layers size={20} />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 px-4 py-2 flex items-center justify-between text-sm z-10">
          <div className="flex items-center space-x-4">
            {viewerState.loadedFile && (
              <span className="text-gray-300">📄 {viewerState.loadedFile}</span>
            )}
            <span className="text-gray-400">Zoom: {Math.round(zoom * 100)}%</span>
            {measurementMode && (
              <span className="text-green-400">Click two points to measure distance</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">
              {viewerState.layers.length} layer(s)
            </span>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ marginTop: '40px' }}
        />

        {/* Loading Overlay */}
        {viewerState.isLoading && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Loading DXF file...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {viewerState.error && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center max-w-md">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Error Loading DXF</p>
              <p className="text-gray-300 text-sm">{viewerState.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Layers Panel */}
      {viewerState.showLayers && (
        <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white">Layers</h3>
            <p className="text-sm text-gray-400 mt-1">
              {viewerState.layers.length} layer(s) loaded
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {viewerState.layers.length === 0 ? (
              <p className="text-gray-400 text-sm">No layers available</p>
            ) : (
              <div className="space-y-2">
                {viewerState.layers.map((layer, index) => (
                  <div
                    key={layer.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <div
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: layer.color }}
                      />
                      <span className="text-sm text-white truncate">
                        {layer.name}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => toggleLayerVisibility(layer.name)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title={layer.visible ? 'Hide layer' : 'Show layer'}
                    >
                      {layer.visible ? (
                        <Eye size={16} />
                      ) : (
                        <EyeOff size={16} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}