/**
 * Utility functions for cleaning up authentication issues
 */
import { captureException } from '../lib/telemetry';

/**
 * Removes the DEV_TOKEN from localStorage to force real authentication
 * This solves the multi-tenant issue where all accounts see the same data
 */
export function clearDevToken(): void {
  const devToken = localStorage.getItem('DEV_TOKEN');
  if (devToken) {
    localStorage.removeItem('DEV_TOKEN');

    // Force a page reload to clear any cached authentication
    window.location.reload();
  }
}

/**
 * Check if the app is currently using a dev token
 */
export function isUsingDevToken(): boolean {
  return !!localStorage.getItem('DEV_TOKEN');
}

/**
 * Get current authentication status information
 */
export function getAuthDebugInfo(): {
  hasDevToken: boolean;
  devTokenValue: string | null;
  hasSupabaseSession: boolean;
} {
  const devToken = localStorage.getItem('DEV_TOKEN');
  
  return {
    hasDevToken: !!devToken,
    devTokenValue: devToken,
    hasSupabaseSession: false, // This would need to be checked asynchronously
  };
}

/**
 * Force clear all authentication tokens and reload the app
 */
export async function forceAuthReset(): Promise<void> {
  // Remove DEV_TOKEN
  localStorage.removeItem('DEV_TOKEN');
  
  // Clear Supabase session (import supabase client here if needed)
  try {
    const { supabase } = await import('../lib/supabase');
    await supabase.auth.signOut();
  } catch (error) {
    captureException(error);
  }
  
  // Clear other auth-related localStorage items
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('auth') || key.includes('token')
  );
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Reload the page
  window.location.href = '/login';
}
