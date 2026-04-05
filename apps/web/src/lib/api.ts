import axios, { type InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api/v1`;
  }
  if (import.meta.env.PROD) {
    return '/api/v1';
  }
  return 'http://localhost:3001/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000, 
});

api.interceptors.response.use(
  (response) => {
    // Si la respuesta es de tipo string e incluye HTML, significa que el rewrite de Vercel devolvió index.html
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
      console.error('ALERTA VERCEL: La petición a la API devolvió el archivo index.html. Esto significa que la ruta de la API no existe en este dominio. Debes configurar VITE_API_URL apuntando a tu backend desplegado.');
      return Promise.reject(new Error('Error de conexión con la API backend. Verifica VITE_API_URL en Vercel.'));
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Check for specialized dev token first for easy testing
  const devToken = localStorage.getItem('DEV_TOKEN');
  if (devToken) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${devToken}`;
    }
    return config;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  
  if (token) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
