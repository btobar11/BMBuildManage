import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FileText,
  Truck,
  CheckCircle2,
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface PurchaseOrder {
  id: string;
  order_number: string;
  project_id: string;
  budget_id: string;
  supplier_name: string;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
  total_amount: number;
  expected_delivery_date: string;
  created_at: string;
}

export function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/purchase-orders');
      if (Array.isArray(response.data)) {
        setOrders(response.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Error al cargar órdenes de compra');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex bg-background h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400">
            <CheckCircle2 size={14} /> RECIBIDA
          </span>
        );
      case 'partially_received':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400">
            <PackageCheck size={14} /> RECEPCIÓN PARCIAL
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-400">
            <Truck size={14} /> EN REPARTO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">
            BORRADOR
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Logística y Compras</h1>
          <p className="text-muted-foreground mt-1">
            Gestión de Órdenes de Compra y seguimiento de recepciones de terreno. Asegura el <strong>Match de 3 Vías</strong> antes del pago de facturas.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => toast('Pronto: Emitir Nueva OC', { icon: '📝' })}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Crear Orden de Compra
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center gap-4 bg-muted/30">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              type="text"
              placeholder="Buscar por OC o Proveedor..."
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
                <th className="px-6 py-3 font-semibold text-muted-foreground">Nº Orden</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Proveedor</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Monto</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-center">Estado Logístico</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground text-center">Acciones Terreno</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    <Truck size={48} className="mx-auto text-muted-foreground/50 mb-3" />
                    No hay Órdenes de Compra registradas.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-primary-600 dark:text-primary-400">
                      #{order.order_number}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {order.supplier_name}
                    </td>
                    <td className="px-6 py-4 text-foreground font-medium">
                      ${Number(order.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toast('Vista Terreno: Pantalla de Recepción para validar artículos recibidos y subir foto de Guía de Despacho (3-Way Match).')}
                          disabled={order.status === 'received'}
                          className={`p-2 rounded-lg transition-colors border-2 ${
                            order.status === 'received' 
                            ? 'text-muted-foreground/50 border-transparent cursor-not-allowed'
                            : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 border-success-200 dark:border-success-800'
                          }`}
                          title="Recibir en Terreno"
                        >
                          <PackageCheck size={18} />
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
