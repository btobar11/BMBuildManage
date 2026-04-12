import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * User Roles - RBAC System
 * Used for route protection and UI conditional rendering
 */
export type UserRole = 'admin' | 'manager' | 'engineer' | 'accounting' | 'user';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthReady: boolean;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('[DEBUG AuthContext] Initializing, isSupabaseConfigured:', isSupabaseConfigured);
  
  const [user, setUser] = useState<User | null>(() => {
    if (!isSupabaseConfigured) {
      console.log('[DEBUG AuthContext] Demo mode - user initialized in state');
      return {
        id: 'dev-user-id',
        email: 'demo@bmbuild.com',
        name: 'Usuario Demo',
        role: 'admin',
        company_id: '77777777-7777-7777-7777-777777777777'
      };
    }
    const devToken = localStorage.getItem('DEV_TOKEN');
    if (devToken) {
      return {
        id: 'dev-user-id',
        email: 'demo@bmbuild.com',
        name: 'Usuario Demo',
        role: 'admin',
        company_id: '77777777-7777-7777-7777-777777777777'
      };
    }
    return null;
  });
  
  const [token, setToken] = useState<string | null>(() => {
    if (!isSupabaseConfigured) {
      return 'dev-token';
    }
    return localStorage.getItem('DEV_TOKEN') || null;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  console.log('[DEBUG AuthContext] State - user:', !!user, 'token:', !!token, 'isLoading:', isLoading);

  useEffect(() => {
    console.log('[DEBUG AuthContext] useEffect running, isSupabaseConfigured:', isSupabaseConfigured);
    
    if (!isSupabaseConfigured) {
      console.log('[DEBUG AuthContext] Demo mode - setting isLoading false immediately');
      setToken('dev-token');
      setUser({
        id: 'dev-user-id',
        email: 'demo@bmbuild.com',
        name: 'Usuario Demo',
        role: 'admin',
        company_id: '77777777-7777-7777-7777-777777777777'
      });
      setIsLoading(false);
      setIsAuthReady(true);
      return;
    }

    const checkAuth = async () => {
      console.log('[DEBUG AuthContext] checkAuth - fetching session');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[DEBUG AuthContext] Session:', session ? 'found' : 'none');
        if (session) {
          localStorage.removeItem('DEV_TOKEN');
          setToken(session.access_token);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuario',
            role: session.user.user_metadata.role || 'manager',
            company_id: session.user.user_metadata.company_id
          });
          setIsLoading(false);
          setIsAuthReady(true);
          return;
        }
      } catch (error) {
        console.error('Auth error:', error);
      }

      const devToken = localStorage.getItem('DEV_TOKEN');
      if (devToken) {
        setToken(devToken);
        setUser({
          id: 'dev-user-id',
          email: 'demo@bmbuild.com',
          name: 'Usuario Demo',
          role: 'admin',
          company_id: '77777777-7777-7777-7777-777777777777'
        });
      }
      console.log('[DEBUG AuthContext] Setting isLoading false at end');
      setIsLoading(false);
      setIsAuthReady(true);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (localStorage.getItem('DEV_TOKEN') && !session) {
        return;
      }

      if (session) {
        setToken(session.access_token);
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuario',
          role: session.user.user_metadata.role || 'manager',
          company_id: session.user.user_metadata.company_id
        });
      } else {
        setToken(null);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('DEV_TOKEN');
    localStorage.removeItem('sb-user-id');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setToken(null);
    setUser(null);
  };

  const signInDemo = () => {
    localStorage.setItem('DEV_TOKEN', 'dev-token');
    setToken('dev-token');
    setUser({
      id: 'dev-user-id',
      email: 'demo@bmbuild.com',
      name: 'Usuario Demo',
      role: 'admin',
      company_id: '77777777-7777-7777-7777-777777777777'
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, signOut, signInDemo, isLoading, isAuthReady, isConfigured: isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
