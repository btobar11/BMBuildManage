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
    console.error('[API] Error:', error.config?.url, error.message);
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
    if (config.headers) {
      config.headers.Authorization = `Bearer ${devToken}`;
    }
    console.log('[API] Using dev token');
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
