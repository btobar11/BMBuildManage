import { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Loader2, X } from 'lucide-react';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface ClientAutocompleteProps {
  value: string;
  onChange: (clientId: string | null, clientName: string) => void;
  error?: string;
  touched?: boolean;
}

export const ClientAutocomplete = ({ value, onChange, error, touched }: ClientAutocompleteProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCreateOption, setShowCreateOption] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const companyId = user?.company_id;

  // Fetch clients based on search term
  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ['clients', 'search', searchTerm, companyId],
    queryFn: async () => {
      if (!companyId || searchTerm.length < 2) return [];
      const response = await api.get('/clients/search', {
        params: { 
          company_id: companyId,
          search: searchTerm 
        }
      });
      return response.data;
    },
    enabled: !!companyId && searchTerm.length >= 2,
  });

  // Create new client mutation
  const createClientMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post('/clients', {
        name,
        company_id: companyId,
      });
      return response.data;
    },
    onSuccess: (newClient) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClient(newClient);
      onChange(newClient.id, newClient.name);
      setSearchTerm(newClient.name);
      setIsOpen(false);
    },
  });

  // Determine if we should show create option
  const filteredClients = useMemo(() => {
    if (!searchTerm) return [];
    const exactMatch = clients.some(
      c => c.name.toLowerCase() === searchTerm.toLowerCase()
    );
    return clients;
  }, [clients, searchTerm]);

  useEffect(() => {
    if (searchTerm.length >= 2 && filteredClients.length > 0) {
      const exactMatch = filteredClients.some(
        c => c.name.toLowerCase() === searchTerm.toLowerCase()
      );
      setShowCreateOption(!exactMatch);
    } else if (searchTerm.length >= 2) {
      setShowCreateOption(true);
    } else {
      setShowCreateOption(false);
    }
  }, [searchTerm, filteredClients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    onChange(client.id, client.name);
    setSearchTerm(client.name);
    setIsOpen(false);
  };

  const handleCreateClient = () => {
    if (searchTerm.trim()) {
      createClientMutation.mutate(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSelectedClient(null);
    setSearchTerm('');
    onChange(null, '');
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-sm font-medium text-muted-foreground block mb-1.5">
        Cliente
      </label>
      
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoadingClients ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedClient(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar cliente o crear nuevo..."
          className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoComplete="off"
        />
        
        {(searchTerm || selectedClient) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && searchTerm.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {isLoadingClients ? (
            <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              Buscando...
            </div>
          ) : filteredClients.length > 0 ? (
            <>
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => handleSelectClient(client)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                >
                  <div className="font-medium text-foreground">{client.name}</div>
                  {client.email && (
                    <div className="text-sm text-muted-foreground">{client.email}</div>
                  )}
                </button>
              ))}
              {showCreateOption && (
                <button
                  type="button"
                  onClick={handleCreateClient}
                  disabled={createClientMutation.isPending}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-t border-border text-indigo-600 flex items-center gap-2"
                >
                  {createClientMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Crear "{searchTerm}"
                    </>
                  )}
                </button>
              )}
            </>
          ) : showCreateOption ? (
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={createClientMutation.isPending}
              className="w-full text-left px-4 py-3 hover:bg-accent transition-colors text-indigo-600 flex items-center gap-2"
            >
              {createClientMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Crear "{searchTerm}"
                </>
              )}
            </button>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No se encontraron clientes
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {touched && error && (
        <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};