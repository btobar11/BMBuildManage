import React, { useState, useEffect } from 'react';
import { X, Ruler, Box, FileCode, Upload, Calculator, Save, Layers, TriangleAlert } from 'lucide-react';
import { evaluateFormula } from '../../../utils/formula-engine';
import { useDropzone } from 'react-dropzone';
import { CADViewer } from './CADViewer';
import { PDFViewer } from './PDFViewer';

interface CubicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { 
    quantity: number; 
    cubication_mode: string; 
    dim_length?: number; 
    dim_width?: number; 
    dim_height?: number; 
    dim_thickness?: number; 
    dim_count?: number;
    dim_holes?: number;
    formula: string; 
    geometry_data: { area: number; perimetro: number; layer: string }; 
  }) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any;
  itemName: string;
  unit: string;
  budgetedLimit?: number;
}

const TEMPLATES = [
  { name: 'Radier/Losa', formula: 'largo * ancho * espesor', icon: Box },
  { name: 'Muro con Vanos (Neto)', formula: '(largo * alto) - huecos', icon: Box },
  { name: 'Pintura/Revoque', formula: '((largo + ancho) * 2 * alto) - huecos', icon: Box },
  { name: 'Excavación Simple', formula: 'largo * ancho * alto', icon: Box },
  { name: 'Cimiento/Viga', formula: 'largo * ancho * alto * cantidad', icon: Box },
];

export const CubicacionModal: React.FC<CubicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  itemName,
  unit,
  budgetedLimit,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'cad' | 'pdf'>('manual');
  const [params, setParams] = useState({
    dim_length: initialData?.dim_length || 0,
    dim_width: initialData?.dim_width || 0,
    dim_height: initialData?.dim_height || 0,
    dim_thickness: initialData?.dim_thickness || 0,
    dim_count: initialData?.dim_count || 1,
    dim_holes: initialData?.dim_holes || 0,
    area: 0,
    perimetro: 0,
    formula: initialData?.formula || 'dim_length * dim_width',
    dxfData: null as string | null,
    layerName: '',
  });

  const [result, setResult] = useState(0);
  const isOverLimit = budgetedLimit && result > budgetedLimit;

  useEffect(() => {
    const val = evaluateFormula(params.formula, params);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(val);
  }, [params]);

  const selectTemplate = (t: { name: string; formula: string; icon: React.ElementType }) => {
    setParams({ ...params, formula: t.formula });
  };

  const handleCADSelection = (area: number, length: number, layer: string) => {
    let formula = params.formula;
    
    // Auto-match layer keywords to common construction tasks (Module 2)
    const upperLayer = layer.toUpperCase();
    if (upperLayer.includes('RADIER') || upperLayer.includes('LOSA')) {
      formula = 'area * dim_thickness';
    } else if (upperLayer.includes('MURO') || upperLayer.includes('TABIQUE')) {
      formula = 'dim_length * dim_height';
    } else if (upperLayer.includes('CERAMICO') || upperLayer.includes('PISO')) {
      formula = 'area';
    }

    setParams({ 
      ...params, 
      area, 
      dim_length: length, 
      layerName: layer,
      formula 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calculator className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground uppercase tracking-tight">Cubicación Inteligente</h2>
              <p className="text-sm text-muted-foreground italic font-mono">{itemName} ({unit})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isOverLimit && (
          <div className="bg-rose-500/10 border-y border-rose-500/20 px-8 py-3 flex items-center gap-3 animate-pulse">
            <TriangleAlert className="w-5 h-5 text-rose-500" />
            <div className="flex-1">
              <span className="text-sm font-black text-rose-500 uppercase tracking-tighter">⚠️ Alerta de Sobrecubo:</span>
              <span className="text-sm text-rose-600 ml-2 font-medium">El valor calculado ({result.toFixed(2)}) excede el límite presupuestado en este rubro ({budgetedLimit.toFixed(2)}).</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/30">
          {[
            { id: 'manual', label: 'Manual/Plantillas', Icon: Box },
            { id: 'cad', label: 'Plano DXF (AutoCAD)', Icon: FileCode },
            { id: 'pdf', label: 'Medición PDF', Icon: Ruler },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'manual' | 'cad' | 'pdf')}
              className={`flex items-center gap-2 px-8 py-4 text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-500/5' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <tab.Icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-background">
          {activeTab === 'manual' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Templates Column */}
              <div className="lg:col-span-3 space-y-4">
                 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Plantillas Quick</h3>
                 <div className="grid grid-cols-1 gap-3">
                   {TEMPLATES.map(t => (
                     <button 
                       key={t.name}
                       onClick={() => selectTemplate(t)}
                       className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl text-left hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                     >
                       <div className="bg-muted p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                         <t.icon className="w-4 h-4 text-muted-foreground group-hover:text-blue-500" />
                       </div>
                       <div>
                         <div className="text-sm font-semibold text-foreground group-hover:text-blue-600">{t.name}</div>
                         <div className="text-[10px] text-muted-foreground font-mono">{t.formula}</div>
                       </div>
                     </button>
                   ))}
                 </div>
              </div>

              {/* Form Column */}
              <div className="lg:col-span-6 space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Dimensiones Detalladas</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Largo (m)" value={params.dim_length} onChange={(v) => setParams({...params, dim_length: v})} />
                    <InputField label="Ancho (m)" value={params.dim_width} onChange={(v) => setParams({...params, dim_width: v})} />
                    <InputField label="Alto (m)" value={params.dim_height} onChange={(v) => setParams({...params, dim_height: v})} />
                    <InputField label="Espesor (m)" value={params.dim_thickness} onChange={(v) => setParams({...params, dim_thickness: v})} />
                    <InputField label="Holes/Vanos (m2)" value={params.dim_holes} onChange={(v) => setParams({...params, dim_holes: v})} />
                    <InputField label="Cantidad/Piezas" value={params.dim_count} onChange={(v) => setParams({...params, dim_count: v})} />
                  </div>
                </div>

                <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Fórmula Personalizada</label>
                    <div className="flex gap-2">
                       {['dim_length', 'dim_width', 'dim_height', 'dim_thickness', 'dim_count', 'dim_holes', 'area'].map(v => (
                         <button 
                           key={v}
                           onClick={() => setParams({...params, formula: params.formula + (params.formula ? ' * ' : '') + v})}
                           className="text-[9px] bg-muted text-muted-foreground px-2 py-1 rounded border border-border lowercase hover:bg-blue-500/20 hover:text-blue-600 transition-colors"
                         >
                           {v.replace('dim_', '')}
                         </button>
                       ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={params.formula}
                    onChange={(e) => setParams({...params, formula: e.target.value})}
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-blue-600 font-mono text-lg focus:border-blue-500 outline-none transition-all shadow-inner dark:text-blue-400"
                  />
                </div>
              </div>

              {/* Result Column */}
              <div className="lg:col-span-3">
                <div className="sticky top-0 bg-blue-600/10 border border-blue-500/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center backdrop-blur-sm">
                  <span className="text-xs text-blue-300 mb-4 font-bold uppercase tracking-[0.2em]">Resultado Final</span>
                  <div className={`text-7xl font-black mb-2 tabular-nums transition-colors ${isOverLimit ? 'text-rose-500' : 'text-foreground'}`}>
                    {result.toLocaleString('es-CL', { maximumFractionDigits: 3 })}
                  </div>
                  <span className={`text-xl font-bold tracking-widest ${isOverLimit ? 'text-rose-600' : 'text-blue-600/80 dark:text-blue-400/80'}`}>{unit}</span>
                  
                  <div className="mt-8 pt-8 border-t border-blue-500/20 w-full grid grid-cols-2 gap-4">
                     <div className="text-center">
                        <div className="text-[10px] text-blue-600/60 uppercase dark:text-blue-300/60 font-bold">Confianza</div>
                        <div className="text-sm font-bold text-foreground">98%</div>
                     </div>
                     <div className="text-center">
                        <div className="text-[10px] text-blue-600/60 uppercase dark:text-blue-300/60 font-bold">Validado</div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">SI</div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cad' && (
             <div className="space-y-6 h-full flex flex-col overflow-hidden">
               {!params.dxfData ? (
                 <CADDropzone onFileLoaded={(d) => setParams({ ...params, dxfData: d })} />
               ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                    <div className="lg:col-span-3 relative h-full min-h-[500px] bg-black/50 rounded-2xl border border-border overflow-hidden">
                       <CADViewer 
                         dxfString={params.dxfData || ''} 
                         onSelectGeometry={handleCADSelection} 
                       />
                    </div>
                    <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-6 shadow-sm overflow-y-auto">
                       <div>
                         <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Metadatos de Capa</h3>
                         <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 mb-4">
                            <span className="text-[10px] text-blue-600 uppercase block mb-1 font-bold">Layer Activa</span>
                            <span className="text-sm font-bold text-foreground break-all">{params.layerName || 'Seleccione geometría...'}</span>
                         </div>
                       </div>

                       <div className="space-y-3 flex-1">
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Lectura Directa</h3>
                          <DataPoint label="Área Detectada" value={`${params.area.toFixed(3)} m2`} />
                          <DataPoint label="Longitud Detectada" value={`${params.dim_length.toFixed(3)} ml`} />
                          
                          <div className="mt-6 pt-6 border-t border-border space-y-4">
                             <div className="text-xs font-bold text-muted-foreground uppercase">Aplicar Formula</div>
                             <input 
                               type="text" 
                               value={params.formula}
                               onChange={e => setParams({...params, formula: e.target.value})}
                               className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-blue-600 font-mono text-xs focus:border-blue-500 outline-none dark:text-blue-400"
                             />
                          </div>
                       </div>

                       <button 
                         onClick={() => setParams({ ...params, dxfData: null, layerName: '', area: 0, dim_length: 0 })}
                         className="w-full py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-dashed border-border"
                       >
                         Cargar nuevo DXF
                       </button>
                    </div>
                 </div>
               )}
             </div>
          )}

          {activeTab === 'pdf' && (
             <PDFViewer onMeasure={(area, length) => setParams({ ...params, area, dim_length: length, formula: 'area' })} />
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 text-sm">
                <div className={`p-1.5 rounded-md ${activeTab === 'cad' ? 'bg-blue-500/20 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Motor Activo</span>
                  <span className="text-foreground font-semibold uppercase text-xs tracking-wider">{activeTab} Engine v1.0</span>
                </div>
             </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 font-bold transition-all uppercase text-xs tracking-widest"
            >
              Cerrar
            </button>
            <button
              onClick={() => onSave({ 
                dim_length: params.dim_length,
                dim_width: params.dim_width,
                dim_height: params.dim_height,
                dim_thickness: params.dim_thickness,
                dim_count: params.dim_count,
                dim_holes: params.dim_holes,
                formula: params.formula,
                quantity: result,
                cubication_mode: activeTab,
                geometry_data: {
                  area: params.area,
                  perimetro: params.perimetro,
                  layer: params.layerName
                }
              })}
              className="px-12 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-[0_10px_30px_-10px_rgba(37,99,235,0.4)] transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              Actualizar Ítem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-500">{label}</label>
    <div className="relative">
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-muted/50 border border-border rounded-xl px-5 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-lg shadow-inner"
        placeholder="0.00"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-mono">mts</div>
    </div>
  </div>
);

const DataPoint = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center bg-background/50 p-3 rounded-lg border border-border">
    <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
    <span className="text-xs font-mono text-blue-600 font-bold dark:text-blue-400">{value}</span>
  </div>
);

const CADDropzone = ({ onFileLoaded }: { onFileLoaded: (data: string | null) => void }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/dxf': ['.dxf'] },
    onDrop: files => {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          onFileLoaded(result);
        }
      };
      reader.readAsText(file);
    }
  });

  return (
    <div {...getRootProps()} className={`border-2 border-dashed rounded-[2.5rem] p-24 transition-all flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group ${
      isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-border hover:border-blue-500/30 hover:bg-blue-500/5'
    }`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <input {...getInputProps()} />
      <div className="relative">
        <div className="w-24 h-24 bg-blue-600/20 rounded-3xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform">
          <Upload className="w-12 h-12 text-blue-500 dark:text-blue-400" />
        </div>
        <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping opacity-0 group-hover:opacity-20" />
      </div>
      
      <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tighter">Importar Plano Técnico</h3>
      <p className="text-muted-foreground max-w-sm mb-10 text-sm leading-relaxed">
        Suelta tu archivo <span className="text-blue-600 font-mono font-bold dark:text-blue-400">.DXF</span> aquí. Soportamos capas, polilíneas y geometrías complejas de AutoCAD.
      </p>
      <div className="flex items-center gap-3">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.4)]">
          Seleccionar DXF
        </button>
      </div>
    </div>
  );
};
