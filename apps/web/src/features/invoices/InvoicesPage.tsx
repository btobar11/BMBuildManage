import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Search, 
  Upload, 
  Calendar, 
  ExternalLink,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus
} from 'lucide-react';
import api from '../../lib/api';
import { UploadInvoiceModal } from './components/UploadInvoiceModal';

interface Invoice {
  id: string;
  project_id: string;
  project?: {
    name: string;
  };
  supplier: string;
  invoice_number: string;
  amount: number;
  date: string;
  payment_status: string;
  purchase_order_id: string | null;
  file_url: string;
  created_at: string;
}

export function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: invoices = [], isLoading: loading, refetch } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((res) => res.data),
  });

  const filteredInvoices = invoices.filter(inv => 
    inv.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.project?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpent = invoices.reduce((acc, inv) => acc + Number(inv.amount), 0);
  const supplierCount = new Set(invoices.map(inv => inv.supplier)).size;

  return (
    <div className="p-8 space-y-8">
      <UploadInvoiceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => refetch()} 
      />
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <FileText className="text-emerald-500" size={28} />
            </div>
            Gestión de Facturas y Gastos
          </h1>
          <p className="text-muted-foreground mt-2">Control centralizado de compras, proveedores y respaldos digitales.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          <Upload size={20} />
          Subir Factura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">Gasto Total Acumulado</p>
          <p className="text-2xl font-black text-foreground">${totalSpent.toLocaleString()}</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
            <CheckCircle2 size={14} />
            <span>Actualizado</span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border">
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">Total Facturas</p>
          <p className="text-2xl font-black text-foreground">{invoices.length}</p>
          <div className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold">
            <Clock size={14} />
            <span>Digitalizadas</span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border">
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">Proveedores</p>
          <p className="text-2xl font-black text-foreground">{supplierCount}</p>
          <div className="mt-4 flex items-center gap-2 text-indigo-400 text-xs font-bold">
            <Plus size={14} />
            <span>Registrados</span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border">
          <p className="text-muted-foreground text-xs font-black uppercase tracking-widest mb-1">Proyectos con Gastos</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-black text-foreground">{new Set(invoices.map(i => i.project_id)).size}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por proveedor, N° de factura o proyecto..." 
            className="w-full bg-card border border-border rounded-2xl py-4 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-muted-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-card border border-border text-muted-foreground px-5 rounded-2xl hover:text-foreground hover:bg-muted transition-all outline-none">
          <Filter size={20} />
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Factura / Proveedor</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proyecto</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Monto</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Match 3 Vías</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">Archivo</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                      <span className="text-muted-foreground text-sm font-medium">Buscando documentos...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-muted-foreground">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-foreground font-bold text-lg">Sin facturas registradas</h3>
                      <p className="text-muted-foreground text-sm">Empieza a digitalizar tus respaldos de obra hoy mismo.</p>
                      <button className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors flex items-center gap-2 mt-2">
                        <Plus size={18} />
                        Registrar primera factura
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-foreground font-bold text-sm tracking-tight">{invoice.invoice_number}</p>
                          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wide">{invoice.supplier}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-semibold px-2 py-1 bg-white/5 text-muted-foreground rounded-lg border border-border">
                        {invoice.project?.name || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar size={14} className="text-muted-foreground" />
                        {new Date(invoice.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-foreground font-black tabular-nums">
                        ${Number(invoice.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        {invoice.payment_status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-success-50 text-success-700 border border-success-200" title="Match exitoso con Guía de Despacho y OC">
                            <CheckCircle2 size={12} /> OK
                          </span>
                        ) : invoice.payment_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-danger-50 text-danger-700 border border-danger-200" title="Factura rechazada (Sin recepción o excedida)">
                            <AlertCircle size={12} /> RECHAZO
                          </span>
                        ) : invoice.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            PAGADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-warning-50 text-warning-700 border border-warning-200" title="Pendiente de Match Logístico">
                            <Clock size={12} /> PENDIENTE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <button className="p-2 bg-white/5 rounded-lg text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all border border-transparent hover:border-indigo-500/20">
                          <ExternalLink size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
