import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Link, X, Search, Check, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useLinkBimApuElement } from '../../hooks/useBimApuLink';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../utils/cn';

interface BudgetItem {
  id: string;
  name: string;
  unit?: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
  stage_name?: string;
}

interface LinkToBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ifcGlobalId: string;
  ifcType?: string;
  elementName?: string;
  bimQuantity?: {
    netVolume?: number;
    netArea?: number;
    length?: number;
  };
  projectId: string;
  onLinked?: () => void;
}

export function LinkToBudgetModal({
  isOpen,
  onClose,
  ifcGlobalId,
  ifcType,
  elementName,
  bimQuantity,
  projectId,
  onLinked,
}: LinkToBudgetModalProps) {
  const { user } = useAuth();
  const companyId = user?.company_id || '';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quantityType, setQuantityType] = useState<'volume' | 'area' | 'length' | 'count'>('volume');
  const [multiplier, setMultiplier] = useState(1);
  const [autoSync, setAutoSync] = useState(true);

  const linkMutation = useLinkBimApuElement();

  // Fetch budget items for project
  const { data: items, isLoading } = useQuery({
    queryKey: ['budget-items', projectId, searchQuery],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await api.get<BudgetItem[]>(`/items/budget/${projectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('DEV_TOKEN') || ''}` },
        params: { search: searchQuery },
      });
      return response.data || [];
    },
    enabled: isOpen && !!companyId && !!projectId,
  });

  // Determine quantity type based on BIM data
  useEffect(() => {
    if (bimQuantity?.netVolume) {
      setQuantityType('volume');
    } else if (bimQuantity?.netArea) {
      setQuantityType('area');
    } else if (bimQuantity?.length) {
      setQuantityType('length');
    }
  }, [bimQuantity]);

  // Get display quantity based on type
  const displayQuantity = bimQuantity?.netVolume ?? bimQuantity?.netArea ?? bimQuantity?.length ?? 0;
  const quantityLabel = {
    volume: `Volumen: ${displayQuantity.toFixed(4)} m³`,
    area: `Área: ${displayQuantity.toFixed(4)} m²`,
    length: `Largo: ${displayQuantity.toFixed(4)} ml`,
    count: 'Cantidad: 1',
  }[quantityType];

  // Handle link submission
  const handleLink = async () => {
    if (!selectedItemId) return;

    try {
      await linkMutation.mutateAsync({
        project_id: projectId,
        item_id: selectedItemId,
        ifc_global_id: ifcGlobalId,
        ifc_type: ifcType,
        element_name: elementName,
        quantity_type: quantityType,
        quantity_multiplier: multiplier,
        auto_sync_enabled: autoSync,
      });

      onLinked?.();
      onClose();
    } catch (error) {
      console.error('Failed to link element:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <Card className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Vincular a Partida</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {/* Element Info */}
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <Link size={16} className="text-primary-500" />
              <span className="font-medium">{elementName || ifcGlobalId}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="text-xs uppercase">{ifcType?.replace('Ifc', '')}</span>
              <span className="mx-2">•</span>
              <span>{quantityLabel}</span>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar partida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : items?.length === 0 ? (
              <div className="text-center p-4 text-muted-foreground text-sm">
                No se encontraron partidas
              </div>
            ) : (
              items?.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                    selectedItemId === item.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 border border-primary-500'
                      : 'hover:bg-muted/50 border border-transparent'
                  )}
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.stage_name} • {item.unit} • ${item.unit_price.toLocaleString('es-CL')}
                    </p>
                  </div>
                  {selectedItemId === item.id && (
                    <Check size={16} className="text-primary-600" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quantity Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Cantidad</label>
            <div className="flex gap-2">
              {(['volume', 'area', 'length', 'count'] as const).map((type) => (
                <Button
                  key={type}
                  variant={quantityType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuantityType(type)}
                  disabled={
                    (type === 'volume' && !bimQuantity?.netVolume) ||
                    (type === 'area' && !bimQuantity?.netArea) ||
                    (type === 'length' && !bimQuantity?.length)
                  }
                >
                  {type === 'volume' && 'm³'}
                  {type === 'area' && 'm²'}
                  {type === 'length' && 'ml'}
                  {type === 'count' && 'und'}
                </Button>
              ))}
            </div>
          </div>

          {/* Multiplier */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Multiplicador</label>
            <Input
              type="number"
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value) || 1)}
              className="w-24"
              min={0.001}
              step={0.001}
            />
            <span className="text-sm text-muted-foreground">
              = {(displayQuantity * multiplier).toFixed(4)} {quantityType === 'volume' ? 'm³' : quantityType === 'area' ? 'm²' : 'ml'}
            </span>
          </div>

          {/* Auto Sync Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoSync"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoSync" className="text-sm">
              Sincronización automática al cambiar modelo
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleLink}
              disabled={!selectedItemId || linkMutation.isPending}
            >
              {linkMutation.isPending ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Link size={16} className="mr-2" />
              )}
              Vincular
            </Button>
          </div>

          {/* Error Display */}
          {linkMutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-50 dark:bg-danger-950/20 text-danger-600 text-sm">
              <AlertCircle size={16} />
              Error al vincular. Intente de nuevo.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LinkToBudgetModal;