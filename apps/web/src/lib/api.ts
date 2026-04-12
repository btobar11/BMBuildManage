import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    const baseUrl = import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    return `${baseUrl}/api/v1`;
  }
  
  if (import.meta.env.VITE_VERCEL_URL) {
    return `https://${import.meta.env.VITE_VERCEL_URL}/api/v1`;
  }

  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return `/api/v1`;
  }
  
  if (import.meta.env.PROD) {
    return `/api/v1`;
  }
  
  return 'http://localhost:3001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[API] Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, 
});

api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.config.url, response.status);
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
      console.error('[API] Error: Got HTML instead of JSON from', response.config.url);
      return Promise.reject(new Error('No se puede conectar con el servidor API'));
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error('[API] Error:', url, error.message, 'Status:', status);

    // Handle 401/403 - just reject, don't redirect
    // Let the components handle auth errors gracefully
    if (status === 401 || status === 403) {
      console.warn('[API] Auth error detected (401/403)');
      // Clear auth tokens - but don't redirect - let React handle it
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
    console.warn('[API] ⚠️  DEV_TOKEN detected! This causes multi-tenant security issues.');
    console.warn('[API] All users will see the same data. Remove DEV_TOKEN to fix this.');
    
    // Only allow dev token in development environment
    if (import.meta.env.PROD) {
      // In production, just don't use the dev token - don't reload
      console.warn('[API] 🚨 DEV_TOKEN ignored in production');
      // Remove it to prevent future issues
      localStorage.removeItem('DEV_TOKEN');
    } else {
      if (config.headers) {
        config.headers.Authorization = `Bearer ${devToken}`;
      }
      console.log('[API] Using dev token (development only)');
    }
    return config;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (token) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[API] Using Supabase token');
  }
  return config;
});

export default api;
