import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

/**
 * Get API base URL from environment.
 * CRITICAL: Must be configured in ALL environments (dev + prod).
 */
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (!envUrl || !envUrl.trim()) {
    throw new Error('[API] CRITICAL: VITE_API_URL not set. Configure it in .env file.');
  }
  
  // Always use environment URL - never fallback to localhost
  const baseUrl = envUrl.replace(/\/+$/, '');
  return `${baseUrl}/api/v1`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, 
});

api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
      console.error('[API] Got HTML instead of JSON from', response.config.url);
      return Promise.reject(new Error('No se puede conectar con el servidor API'));
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;

    // Handle 401/403 - just reject, don't redirect
    if (status === 401 || status === 403) {
      localStorage.removeItem('supabase.auth.token');
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Tiempo de espera agotado'));
    }
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return Promise.reject(new Error('Error de conexión con el servidor'));
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const devToken = localStorage.getItem('DEV_TOKEN');
  if (devToken) {
    // SECURITY WARNING: DEV_TOKEN causes multi-tenant issues
    console.warn('[API] ⚠️  DEV_TOKEN detected - remove in production');
    
    if (import.meta.env.PROD) {
      localStorage.removeItem('DEV_TOKEN');
    } else {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${devToken}`;
      }
    }
    return config;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
