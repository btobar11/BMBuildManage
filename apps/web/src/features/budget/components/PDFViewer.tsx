import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import * as fabric from 'fabric';
import { Ruler, Trash2, CheckCircle2, Square, Hash } from 'lucide-react';

// Use a stable worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  onMeasure: (area: number, length: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ onMeasure }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [scaleFactor, setScaleFactor] = useState(100); // 1m = 100px
  const [drawMode, setDrawMode] = useState<'line' | 'polygon' | 'calibrate' | 'none'>('none');
  const [points, setPoints] = useState<{ x: number, y: number }[]>([]);
  const [measurements, setMeasurements] = useState<{ area: number, length: number }>({ area: 0, length: 0 });
  const [calibrationDistPx, setCalibrationDistPx] = useState(0);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [tempRealMeters, setTempRealMeters] = useState('1.0');

  const updateCanvasSize = useCallback(() => {
    if (containerRef.current && canvasRef.current) {
      canvasRef.current.setDimensions({
        width: containerRef.current.clientWidth,
        height: 600
      });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const canvas = new fabric.Canvas('pdf-measure-canvas', {
      width: containerRef.current.clientWidth,
      height: 600,
      backgroundColor: '#111',
      selection: false
    });
    
    canvasRef.current = canvas;

    canvas.on('mouse:down', (options) => {
      if (drawMode === 'none') return;
      
      const pointer = canvas.getScenePoint(options.e as MouseEvent);
      const newPoint = { x: pointer.x, y: pointer.y };

      if (drawMode === 'line') {
        if (points.length === 0) {
          setPoints([newPoint]);
        } else {
          const p1 = points[0];
          const distPx = Math.sqrt(Math.pow(newPoint.x - p1.x, 2) + Math.pow(newPoint.y - p1.y, 2));
          const distM = distPx / scaleFactor;
          
          setMeasurements({ area: 0, length: distM });
          onMeasure(0, distM);
          
          // Draw the final line
          const line = new fabric.Line([p1.x, p1.y, newPoint.x, newPoint.y], {
            stroke: '#3b82f6',
            strokeWidth: 2,
            selectable: false
          });
          canvas.add(line);
          setPoints([]);
          setDrawMode('none');
        }
      } else if (drawMode === 'calibrate') {
        if (points.length === 0) {
          setPoints([newPoint]);
        } else {
          const p1 = points[0];
          const distPx = Math.sqrt(Math.pow(newPoint.x - p1.x, 2) + Math.pow(newPoint.y - p1.y, 2));
          
          setCalibrationDistPx(distPx);
          setShowCalibrationModal(true);
          setPoints([]);
          setDrawMode('none');
        }
      } else if (drawMode === 'polygon') {
        setPoints(prev => [...prev, newPoint]);
        
        // Visual indicator for the point
        const circle = new fabric.Circle({
          left: newPoint.x,
          top: newPoint.y,
          radius: 3,
          fill: '#3b82f6',
          originX: 'center',
          originY: 'center',
          selectable: false
        });
        canvas.add(circle);

        if (points.length > 0) {
          const lastPoint = points[points.length - 1];
          const line = new fabric.Line([lastPoint.x, lastPoint.y, newPoint.x, newPoint.y], {
            stroke: '#3b82f6',
            strokeWidth: 1,
            selectable: false
          });
          canvas.add(line);
        }
      }
    });

    window.addEventListener('resize', updateCanvasSize);
    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      canvas.dispose();
    };
  }, [drawMode, points, scaleFactor, onMeasure, updateCanvasSize]);

  const finishPolygon = () => {
    if (points.length < 3 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Close the polygon visually
    const lastLine = new fabric.Line([points[points.length - 1].x, points[points.length - 1].y, points[0].x, points[0].y], {
      stroke: '#3b82f6',
      strokeWidth: 1,
      selectable: false
    });
    canvas.add(lastLine);

    // Calculate Area using Shoelace Formula
    let areaPx = 0;
    let perimeterPx = 0;
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        areaPx += (p1.x * p2.y) - (p2.x * p1.y);
        perimeterPx += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    areaPx = Math.abs(areaPx) / 2;
    
    const areaM2 = areaPx / (scaleFactor * scaleFactor);
    const perimeterM = perimeterPx / scaleFactor;

    setMeasurements({ area: areaM2, length: perimeterM });
    onMeasure(areaM2, perimeterM);
    setPoints([]);
    setDrawMode('none');
  };

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clear();
      canvasRef.current.backgroundColor = '#111';
      setPoints([]);
      setMeasurements({ area: 0, length: 0 });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);

    const reader = new FileReader();
    reader.onload = async () => {
      const typedarray = new Uint8Array(reader.result as ArrayBuffer);
      const pdf = await pdfjsLib.getDocument(typedarray).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2.0 });
      const offscreenCanvas = document.createElement('canvas');
      const context = offscreenCanvas.getContext('2d')!;
      offscreenCanvas.height = viewport.height;
      offscreenCanvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const imgElement = document.createElement('img');
        imgElement.src = offscreenCanvas.toDataURL();
        
        imgElement.onload = () => {
          const fabricImage = new fabric.Image(imgElement, {
            selectable: false,
            evented: false,
            opacity: 0.9
          });
          
          canvas.setDimensions({ width: viewport.width, height: viewport.height });
          canvas.clear();
          canvas.backgroundColor = '#111';
          canvas.add(fabricImage);
          canvas.sendObjectToBack(fabricImage);
          canvas.requestRenderAll();
        };
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 bg-muted/20 p-5 rounded-2xl border border-border shadow-sm">
        <div className="relative group">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileUpload}
            id="pdf-upload"
            className="hidden"
          />
          <label 
            htmlFor="pdf-upload"
            className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-all shadow-[0_4px_15px_-5px_rgba(37,99,235,0.4)] active:scale-95"
          >
            <Hash className="w-4 h-4" />
            {pdfFile ? 'Cambiar PDF' : 'Subir Plano PDF'}
          </label>
        </div>
        
        {pdfFile && (
          <div className="flex flex-wrap items-center gap-4 border-l border-border pl-6 ml-2">
            <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
              <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Escala:</span>
              <input 
                type="number" 
                value={scaleFactor} 
                onChange={(e) => setScaleFactor(Number(e.target.value))}
                className="w-16 bg-transparent text-blue-600 text-sm font-mono font-bold focus:outline-none dark:text-blue-400"
              />
              <span className="text-[10px] text-muted-foreground font-bold italic lowercase">px / m</span>
            </div>
            
            <div className="h-8 w-px bg-border mx-2" />
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => { setDrawMode('line'); setPoints([]); }}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${drawMode === 'line' ? 'bg-blue-600 text-white shadow-[0_4px_15px_-5px_rgba(37,99,235,0.4)]' : 'bg-card text-muted-foreground border border-border hover:bg-muted'}`}
              >
                <Ruler className="w-4 h-4" />
                Medir Distancia
              </button>
              <button 
                onClick={() => { setDrawMode('polygon'); setPoints([]); }}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${drawMode === 'polygon' ? 'bg-indigo-600 text-white shadow-[0_4px_15px_-5px_rgba(79,70,229,0.4)]' : 'bg-card text-muted-foreground border border-border hover:bg-muted'}`}
              >
                <Square className="w-4 h-4" />
                Medir Área
              </button>
              
              <div className="h-8 w-px bg-border mx-2" />

              <button 
                onClick={() => { setDrawMode('calibrate'); setPoints([]); }}
                className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${drawMode === 'calibrate' ? 'bg-amber-600 text-white shadow-[0_4px_15px_-5px_rgba(245,158,11,0.4)]' : 'bg-card text-muted-foreground border border-border hover:bg-muted'}`}
              >
                <Ruler className="w-4 h-4 text-amber-500" />
                Calibrar Escala
              </button>
              
              {drawMode === 'polygon' && points.length >= 3 && (
                <button 
                  onClick={finishPolygon}
                  className="flex items-center gap-3 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_4px_15px_-5px_rgba(5,150,105,0.4)] animate-pulse"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar
                </button>
              )}
            </div>

            <button 
              onClick={clearCanvas}
              className="p-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20"
              title="Limpiar medidas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <div ref={containerRef} className="relative w-full overflow-auto bg-neutral-900 rounded-2xl border border-border shadow-2xl min-h-[600px] flex items-center justify-center p-4">
            <canvas id="pdf-measure-canvas" className="rounded-lg shadow-2xl bg-white" />
            {!pdfFile && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-8 p-12 text-center pointer-events-none">
                <div className="w-24 h-24 bg-card rounded-3xl flex items-center justify-center border border-border rotate-6 shadow-xl transition-all group-hover:rotate-0">
                  <Ruler className="w-12 h-12 text-blue-500/40" />
                </div>
                <div>
                  <h3 className="text-foreground text-xl font-bold mb-3 uppercase tracking-tighter">Visor de Planos PDF</h3>
                  <p className="text-sm text-muted-foreground max-w-sm leading-relaxed px-4">
                    Importa un archivo <span className="text-blue-600 font-bold dark:text-blue-400">PDF</span> para iniciar el levantamiento de cantidades manual asistido.
                  </p>
                </div>
              </div>
            )}
            {drawMode !== 'none' && (
              <div className="absolute top-6 left-6 bg-blue-600/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl border border-border">
                Motor: {drawMode === 'line' ? 'Longitud Directa' : 'Geometría de Área'}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-card p-8 rounded-3xl border border-border shadow-xl h-full flex flex-col justify-between">
              <div>
                <h4 className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-8">Resultados de Lectura</h4>
                
                <div className="space-y-10">
                  <div className="group">
                    <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-wider group-hover:text-blue-500 transition-colors">Extensión Calculada</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl font-black text-foreground tabular-nums tracking-tighter">
                        {measurements.length.toFixed(2)}
                      </p>
                      <span className="text-lg font-bold text-blue-600/60 lowercase italic dark:text-blue-400/60">ml</span>
                    </div>
                  </div>

                  <div className="group">
                    <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-wider group-hover:text-emerald-500 transition-colors">Superficie Total</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl font-black text-foreground tabular-nums tracking-tighter">
                        {measurements.area.toFixed(2)}
                      </p>
                      <span className="text-lg font-bold text-emerald-600/60 lowercase italic dark:text-emerald-400/60">m²</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-border">
                <div className="bg-muted p-4 rounded-xl flex items-start gap-3">
                  <div className="p-1 bg-amber-500/20 rounded">
                    <Hash className="w-3 h-3 text-amber-500" />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Escala activa: <span className="text-foreground font-black">1m = {scaleFactor}px</span>. Calibra siempre usando un eje conocido antes de medir.
                  </p>
                </div>
              </div>
           </div>
        </div>
      </div>
      {/* Calibration Modal Overlay */}
      {showCalibrationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Ruler className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2 uppercase tracking-tight">Calibración de Escala</h3>
            <p className="text-xs text-muted-foreground text-center mb-8">Has medido <span className="text-foreground font-bold">{calibrationDistPx.toFixed(1)}px</span>. ¿A cuántos metros reales corresponde?</p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Largo Real (mts)</label>
                <input 
                  type="number"
                  step="0.01"
                  autoFocus
                  value={tempRealMeters}
                  onChange={(e) => setTempRealMeters(e.target.value)}
                  className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-center text-2xl font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all dark:text-blue-400"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowCalibrationModal(false)}
                  className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    const realMeters = parseFloat(tempRealMeters);
                    if (realMeters > 0) {
                      setScaleFactor(Math.round(calibrationDistPx / realMeters));
                    }
                    setShowCalibrationModal(false);
                  }}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

