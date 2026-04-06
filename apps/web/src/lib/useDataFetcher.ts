import { useState, useEffect, useCallback } from 'react';

interface UseDataFetcherOptions<T> {
  queryFn: () => Promise<T>;
  enabled?: boolean;
}

interface UseDataFetcherResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useDataFetcher<T>({
  queryFn,
  enabled = true,
}: UseDataFetcherOptions<T>): UseDataFetcherResult<T> {
  const [data, setData] = useState<T | undefined>();
  const [isLoading, setIsLoading] = useState(!enabled);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const result = await queryFn();
        
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error('Error desconocido'));
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [queryFn, enabled, refreshKey]);

  return { data, isLoading, isError, error, refetch };
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
}

export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = { maxRetries: 3, retryDelay: 1000 }
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < config.maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Error desconocido');
      
      if (i < config.maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, config.retryDelay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}
