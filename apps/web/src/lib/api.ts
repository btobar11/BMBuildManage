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
