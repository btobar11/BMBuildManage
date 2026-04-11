import React, { useEffect, useRef, useState } from 'react';
import DxfParser from 'dxf-parser';
import * as fabric from 'fabric';

interface CADViewerProps {
  dxfString: string;
  onSelectGeometry: (area: number, length: number, layer: string) => void;
}

type DxfEntity = {
  type: string;
  layer: string;
  color?: number;
  vertices: { x: number; y: number }[];
  radius?: number;
  center?: { x: number; y: number };
  shape?: boolean;
};

export const CADViewer: React.FC<CADViewerProps> = ({ dxfString, onSelectGeometry }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [layers, setLayers] = useState<string[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('all');

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = new fabric.Canvas('dxf-canvas', {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      backgroundColor: '#111',
      selection: false
    });
    canvasRef.current = canvas;

    const handleResize = () => {
      if (containerRef.current) {
        canvas.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dxfString) return;

    try {
      const parser = new DxfParser();
      const dxf = parser.parseSync(dxfString);
      if (!dxf) return;

      canvas.clear();
      canvas.backgroundColor = '#111';

      const foundLayers = new Set<string>();
      const objects: fabric.Object[] = [];

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      function updateBounds(x: number, y: number) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }

      dxf.entities.forEach((entity: any) => {
        if (selectedLayer !== 'all' && entity.layer !== selectedLayer) return;
        foundLayers.add(entity.layer);
        
        let fabricObj: fabric.Object | null = null;

        if (entity.type === 'LINE') {
          fabricObj = new fabric.Line([entity.vertices[0].x, entity.vertices[0].y, entity.vertices[1].x, entity.vertices[1].y], {
            stroke: entity.color ? `#${entity.color.toString(16).padStart(6, '0')}` : '#888',
            strokeWidth: 1,
            selectable: true,
            hasControls: false,
            hasBorders: true
          });

          updateBounds(entity.vertices[0].x, entity.vertices[0].y);
          updateBounds(entity.vertices[1].x, entity.vertices[1].y);
        } else if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
          const points = entity.vertices.map((v: { x: number; y: number }) => ({ x: v.x, y: v.y }));
          fabricObj = new fabric.Polyline(points, {
            stroke: entity.color ? `#${entity.color.toString(16).padStart(6, '0')}` : '#3b82f6',
            strokeWidth: 1,
            fill: entity.shape ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            selectable: true,
            hasControls: false,
            hasBorders: true
          });

          points.forEach((p: { x: number; y: number }) => updateBounds(p.x, p.y));
        } else if (entity.type === 'CIRCLE') {
          fabricObj = new fabric.Circle({
            radius: entity.radius,
            left: entity.center.x,
            top: entity.center.y,
            stroke: '#888',
            strokeWidth: 1,
            fill: 'transparent',
            selectable: true,
            hasControls: false,
            originX: 'center',
            originY: 'center'
          });

          updateBounds(entity.center.x - entity.radius, entity.center.y - entity.radius);
          updateBounds(entity.center.x + entity.radius, entity.center.y + entity.radius);
        }

        if (fabricObj) {
          objects.push(fabricObj);
        }
      });

      setLayers(['all', ...Array.from(foundLayers)]);

      if (objects.length > 0) {
        const group = new fabric.Group(objects);
        
        // Auto-scale and center
        const width = maxX - minX;
        const height = maxY - minY;
        const scale = Math.min(
          (canvas.width! * 0.9) / width,
          (canvas.height! * 0.9) / height
        );

        canvas.add(group);
        canvas.setViewportTransform([scale, 0, 0, -scale, canvas.width! / 2 - (minX + width / 2) * scale, canvas.height! / 2 + (minY + height / 2) * scale]);
        canvas.requestRenderAll();
      }

      canvas.on('mouse:down', (options) => {
        const target = options.target as any;
        if (target && target.data) {
          const entity = target.data as DxfEntity;
          let area = 0;
          let length = 0;

          if (entity.type === 'LWPOLYLINE' || entity.type === 'POLYLINE') {
            for (let i = 0; i < entity.vertices.length; i++) {
              const v1 = entity.vertices[i];
              const v2 = entity.vertices[(i + 1) % entity.vertices.length];
              area += (v1.x * v2.y) - (v2.x * v1.y);
              length += Math.sqrt(Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2));
            }
            area = Math.abs(area) / 2;
          } else if (entity.type === 'LINE') {
            length = Math.sqrt(Math.pow(entity.vertices[1].x - entity.vertices[0].x, 2) + Math.pow(entity.vertices[1].y - entity.vertices[0].y, 2));
          } else if (entity.type === 'CIRCLE') {
            area = Math.PI * Math.pow(entity.radius || 0, 2);
            length = 2 * Math.PI * (entity.radius || 0);
          }

          onSelectGeometry(area, length, entity.layer);
          
          // Flash effect
          target.set('stroke', '#fbbf24');
          canvas.requestRenderAll();
          setTimeout(() => {
            if (target) {
              target.set('stroke', entity.color ? `#${entity.color.toString(16).padStart(6, '0')}` : '#3b82f6');
              canvas.requestRenderAll();
            }
          }, 500);
        }
      });


    } catch (err) {
      console.error('DXF Parse Error', err);
    }
  }, [dxfString, selectedLayer, onSelectGeometry]);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex items-center gap-4 px-4 bg-muted/30 py-2 rounded-xl border border-border">
        <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Capa (Layer):</label>
        <select 
          value={selectedLayer}
          onChange={(e) => setSelectedLayer(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-semibold"
        >
          {layers.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground italic font-medium uppercase tracking-tight">Click en líneas para medir</span>
      </div>
      
      <div ref={containerRef} className="relative flex-1 bg-neutral-900 rounded-2xl overflow-hidden border border-border min-h-[400px] shadow-inner">
        <canvas id="dxf-canvas" />
      </div>
    </div>
  );
};
