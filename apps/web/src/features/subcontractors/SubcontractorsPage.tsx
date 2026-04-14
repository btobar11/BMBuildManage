import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  AlertCircle,
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Subcontractor {
  id: string;
  name: string;
  rut: string;
  specialty: string;
  contract_amount: number;
  status: string;
  created_at: string;
}

export function SubcontractorsPage() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubcontractors();
  }, []);

  const fetchSubcontractors = async () => {
    try {
      const response = await api.get('/subcontractors');
      // Asegurarse de que response.data es un array
      if (Array.isArray(response.data)) {
        setSubcontractors(response.data);
      } else {
        setSubcontractors([]);
      }
    } catch (error) {
      console.error('Error fetching subcontractors:', error);
      toast.error('Error al cargar subcontratistas');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubcontractors = subcontractors.filter(sub =>
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.rut?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex bg-background h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subcontratistas</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de estados de pago y cumplimiento legal F30-1
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast('Pronto: Añadir Subcontrato', { icon: '🏗️' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Registrar Subcontrato
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center gap-4 bg-muted/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre, RUT o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Especialidad</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Subcontratista</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Monto Contrato</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-center">Estado</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-center">Compliance</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubcontractors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <ShieldAlert size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                    No hay subcontratistas en la base de datos de este proyecto.
                  </td>
                </tr>
              ) : (
                filteredSubcontractors.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                        {sub.specialty || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">
                        {sub.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        RUT: {sub.rut}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-foreground">
                      ${Number(sub.contract_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        sub.status === 'active'
                          ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {sub.status === 'active' ? 'ACTIVO' : 'CERRADO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center gap-1 group/tooltip relative">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-400 border border-danger-200 dark:border-danger-800">
                          <XCircle size={14} /> Faltan Doc. Mensuales
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:block w-48 bg-card border border-border shadow-lg text-xs p-2 rounded-lg z-10 text-left">
                          <strong>Acción Bloqueada:</strong> No se pueden cursar estados de pago sin subir certificado F30-1 del mes.
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toast.error('No se puede generar Estado de Pago por falta documentaria (F30-1)')}
                          className="p-2 text-muted-foreground hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors border-2 border-transparent hover:border-danger-200"
                          title="Generar Estado de Pago"
                        >
                          <DollarSign size={18} />
                        </button>
                        <button
                          onClick={() => toast('Vista de Documentos')}
                          className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors border-2 border-primary-200 dark:border-primary-800"
                          title="Subir F30-1 / Documentos Legales"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
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
