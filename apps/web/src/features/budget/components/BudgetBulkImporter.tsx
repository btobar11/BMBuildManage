'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, ArrowRight, Check, AlertTriangle, X, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface ColumnMapping {
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
  unitPrice: string;
}

interface ParsedRow {
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  unit_price: number;
}

interface BudgetBulkImporterProps {
  budgetId: string;
  stageId: string;
  onComplete: (importedCount: number) => void;
  onCancel: () => void;
}

const VALID_UNITS = ['m2', 'm3', 'ml', 'un', 'viaje', 'glb', 'gl', 'kg', 'hr', 'día', 'pt', 'lb', 'tn', 'global'];

export function BudgetBulkImporter({ budgetId, stageId, onComplete, onCancel }: BudgetBulkImporterProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'done'>('upload');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    description: '',
    quantity: '',
    unit: '',
    unitCost: '',
    unitPrice: '',
  });
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const f = acceptedFiles[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let rows: Record<string, string>[] = [];
        let headers: string[] = [];

        if (f.name.endsWith('.csv')) {
          const text = data as string;
          const lines = text.split('\n').filter(l => l.trim());
          headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          rows = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i] || '';
              return obj;
            }, {} as Record<string, string>);
          });
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          rows = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];
          headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        }

        setRawHeaders(headers);
        setRawData(rows);
        setStep('mapping');
      } catch (error) {
        toast.error('Error al leer archivo');
      }
    };
    reader.readAsBinaryString(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleMapping = () => {
    const parsed: ParsedRow[] = [];
    const newErrors: string[] = [];

    rawData.forEach((row, index) => {
      const description = row[mapping.description] || '';
      const quantityStr = row[mapping.quantity] || '0';
      const quantity = parseFloat(quantityStr.replace(/,/g, '')) || 0;
      const unit = (row[mapping.unit] || 'glb').toLowerCase().trim();
      const unitCostStr = row[mapping.unitCost] || '0';
      const unitCost = parseFloat(unitCostStr.replace(/[$,]/g, '')) || 0;
      const unitPriceStr = row[mapping.unitPrice] || '0';
      const unitPrice = parseFloat(unitPriceStr.replace(/[$,]/g, '')) || 0;

      if (!description) {
        newErrors.push(`Fila ${index + 2}: Descripción vacía`);
      }
      if (quantity < 0) {
        newErrors.push(`Fila ${index + 2}: Cantidad negativa (${quantity})`);
      }
      if (unitCost < 0) {
        newErrors.push(`Fila ${index + 2}: Costo negativo (${unitCost})`);
      }
      if (unitPrice < 0) {
        newErrors.push(`Fila ${index + 2}: Precio negativo (${unitPrice})`);
      }
      if (unit && !VALID_UNITS.includes(unit)) {
        newErrors.push(`Fila ${index + 2}: Unidad "${unit}" no válida. Use: ${VALID_UNITS.join(', ')}`);
      }

      if (description && quantity >= 0 && unitCost >= 0 && unitPrice >= 0 && (VALID_UNITS.includes(unit) || !mapping.unit)) {
        parsed.push({
          description,
          quantity,
          unit: unit || 'glb',
          unit_cost: unitCost,
          unit_price: unitPrice,
        });
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      if (parsed.length === 0) {
        return;
      }
    }

    setParsedData(parsed);
    setErrors([]);
    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    setProgress(0);

    try {
      const items = parsedData.map((item, index) => ({
        stage_id: stageId,
        name: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_cost: item.unit_cost,
        unit_price: item.unit_price,
        position: index,
      }));

      await api.post(`/budgets/${budgetId}/items/bulk`, { items });
      
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }

      toast.success(`${items.length} partidas importadas`);
      setStep('done');
      onComplete(items.length);
    } catch (error: any) {
      if (error.response?.data?.code === '23514') {
        toast.error('Error de validación: valores negativos detectados');
      } else {
        toast.error('Error al importar partidas');
      }
    } finally {
      setImporting(false);
    }
  };

  const availableFields = [
    { key: 'description', label: 'Descripción', required: true },
    { key: 'quantity', label: 'Cantidad', required: true },
    { key: 'unit', label: 'Unidad', required: false },
    { key: 'unitCost', label: 'Costo Unitario', required: false },
    { key: 'unitPrice', label: 'Precio Unitario', required: true },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Importar Partidas</h2>
            <p className="text-slate-400 text-sm">Sube tu presupuesto desde Excel o CSV</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div 
                  {...getRootProps()}
                  className={`
                    bento-grid aspect-video border-2 border-dashed rounded-2xl 
                    flex flex-col items-center justify-center cursor-pointer
                    transition-all duration-300
                    ${isDragActive 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <div className="p-6 rounded-full bg-slate-800 mb-4">
                    <Upload size={48} className="text-emerald-500" />
                  </div>
                  <p className="text-lg font-medium text-white mb-2">
                    {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel o CSV'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    O haz clic para seleccionar
                  </p>
                  <div className="flex gap-3 mt-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                      <FileSpreadsheet size={16} className="text-green-400" />
                      <span className="text-xs text-slate-300">.xlsx</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg">
                      <FileSpreadsheet size={16} className="text-blue-400" />
                      <span className="text-xs text-slate-300">.csv</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 'mapping' && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Columnas del archivo */}
                  <div className="bento-cell p-4">
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Columnas en tu archivo</h3>
                    <div className="flex flex-wrap gap-2">
                      {rawHeaders.map((header) => (
                        <span key={header} className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm text-slate-200">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Mapeo */}
                  <div className="bento-cell p-4">
                    <h3 className="text-sm font-medium text-slate-400 mb-3">Asocia las columnas</h3>
                    <div className="space-y-3">
                      {availableFields.map((field) => (
                        <div key={field.key} className="flex items-center gap-3">
                          <span className={`text-sm w-32 ${field.required ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {field.label}
                          </span>
                          <ArrowRight size={16} className="text-slate-500" />
                          <select
                            value={mapping[field.key as keyof ColumnMapping]}
                            onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
                          >
                            <option value="">-- Seleccionar --</option>
                            {rawHeaders.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          {field.required && mapping[field.key as keyof ColumnMapping] && (
                            <Check size={16} className="text-emerald-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setStep('upload')} className="px-4 py-2 text-slate-400 hover:text-white">
                    Volver
                  </button>
                  <button
                    onClick={handleMapping}
                    disabled={!mapping.description || !mapping.unitPrice}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    Continuar <ArrowRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {errors.length > 0 && (
                  <div className="bento-cell p-4 mb-4 border-amber-500/30 bg-amber-500/10">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <AlertTriangle size={20} />
                      <span className="font-medium">Se omitirán algunas filas</span>
                    </div>
                    <ul className="text-sm text-amber-300/70 space-y-1">
                      {errors.slice(0, 5).map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                      {errors.length > 5 && <li>...y {errors.length - 5} más</li>}
                    </ul>
                  </div>
                )}

                <div className="bento-cell p-4">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">
                    Vista previa ({parsedData.length} partidas)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400">Descripción</th>
                          <th className="text-right py-2 px-3 text-slate-400">Cant.</th>
                          <th className="text-center py-2 px-3 text-slate-400">Unidad</th>
                          <th className="text-right py-2 px-3 text-slate-400">Costo</th>
                          <th className="text-right py-2 px-3 text-slate-400">Precio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b border-slate-800">
                            <td className="py-2 px-3 text-white">{row.description}</td>
                            <td className="py-2 px-3 text-right text-slate-300">{row.quantity}</td>
                            <td className="py-2 px-3 text-center text-slate-300">{row.unit}</td>
                            <td className="py-2 px-3 text-right text-slate-300">${row.unit_cost.toLocaleString('es-CL')}</td>
                            <td className="py-2 px-3 text-right text-emerald-400">${row.unit_price.toLocaleString('es-CL')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {parsedData.length > 10 && (
                      <p className="text-center text-slate-500 text-sm py-2">
                        ...y {parsedData.length - 10} más
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setStep('mapping')} className="px-4 py-2 text-slate-400 hover:text-white">
                    Volver
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {importing ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    Importar {parsedData.length} partidas
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                    <circle 
                      cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="none" 
                      className="text-emerald-500 transition-all duration-300"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * progress) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{progress}%</span>
                  </div>
                </div>
                <p className="text-slate-400">Importando partidas...</p>
              </motion.div>
            )}

            {step === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Check size={40} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">¡Importación completa!</h3>
                <p className="text-slate-400 mb-6">{parsedData.length} partidas han sido agregadas al presupuesto</p>
                <button
                  onClick={onCancel}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default BudgetBulkImporter;
