/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Upload, 
  Calendar, 
  Building2, 
  DollarSign, 
  FileText,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import api from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface UploadInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadInvoiceModal({ isOpen, onClose, onSuccess }: UploadInvoiceModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    project_id: '',
    supplier: '',
    invoice_number: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(res => res.data)
  });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Por favor selecciona un archivo (foto o PDF) de la factura');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `invoices/${user?.company_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 2. Create invoice record in API
      await api.post('/invoices', {
        ...formData,
        amount: parseFloat(formData.amount),
        file_url: publicUrl,
        company_id: user?.company_id
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      alert('Error al subir la factura. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-card border border-border/50 w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        {/* Left: Upload Area */}
        <div className="flex-1 bg-black/50 p-8 border-r border-border flex flex-col items-center justify-center">
          <div 
            className={`w-full h-full min-h-[300px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${
              file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border/50 hover:border-indigo-500/50 hover:bg-indigo-500/5'
            }`}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-contain p-4 rounded-3xl" />
            ) : file ? (
              <div className="text-center p-6">
                <FileText size={64} className="text-indigo-400 mx-auto mb-4" />
                <p className="text-foreground font-bold">{file.name}</p>
                <p className="text-muted-foreground text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto mb-6">
                  <Upload size={40} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Sube tu factura</h3>
                <p className="text-muted-foreground text-sm max-w-[200px] mx-auto mb-6">Arrastra una imagen o PDF del documento aquí.</p>
                <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer transition-all active:scale-95">
                  Seleccionar Archivo
                  <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                </label>
              </div>
            )}
          </div>
          {file && (
            <button 
              onClick={() => { setFile(null); setPreview(null); }}
              className="mt-4 text-muted-foreground hover:text-foreground text-sm font-bold flex items-center gap-2"
            >
              <X size={16} /> Cambiar archivo
            </button>
          )}
        </div>

        {/* Right: Form */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black text-foreground leading-none">Registrar Gasto</h2>
              <p className="text-muted-foreground mt-2 font-medium">Ingresa los detalles del documento.</p>
            </div>
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Proyecto Vinculado</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" size={20} />
                <select
                  required
                  className="w-full bg-white/5 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                >
                  <option value="" disabled className="bg-card">Selecciona un proyecto...</option>
                  {projects.map((p: any) => (
                    <option key={p.id} value={p.id} className="bg-card">{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">N° de Factura</label>
                <div className="relative group">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    required
                    type="text"
                    placeholder="FE-4502"
                    className="w-full bg-white/5 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted-foreground"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fecha Emisión</label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    required
                    type="date"
                    className="w-full bg-white/5 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all [color-scheme:dark]"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Proveedor / Razón Social</label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  required
                  type="text"
                  placeholder="Materiales de Construcción S.A."
                  className="w-full bg-white/5 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted-foreground"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monto Bruto ($)</label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" size={20} />
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground font-bold text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted-foreground"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-5 rounded-[22px] font-black text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-95 mt-4"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <CheckCircle2 size={24} />
              )}
              {loading ? 'Subiendo...' : 'Guardar Factura'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
