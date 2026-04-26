import { useQuery } from '@tanstack/react-query';

export function useUFValue() {
  return useQuery({
    queryKey: ['uf-value'],
    queryFn: async () => {
      try {
        const response = await fetch('https://mindicador.cl/api/uf');
        const data = await response.json();
        if (data && data.serie && data.serie.length > 0) {
          return data.serie[0].valor as number;
        }
        return 38000;
      } catch {
        return 38000;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60,
    retry: 1,
  });
}