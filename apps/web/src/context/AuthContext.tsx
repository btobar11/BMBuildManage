import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  company_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  signInDemo: () => void;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (!isSupabaseConfigured) {
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

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured - running in demo mode');
      setToken('dev-token');
      setUser({
        id: 'dev-user-id',
        email: 'demo@bmbuild.com',
        name: 'Usuario Demo',
        role: 'admin',
        company_id: '77777777-7777-7777-7777-777777777777'
      });
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
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
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setToken(session.access_token);
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || 'Usuario',
            role: session.user.user_metadata.role || 'manager',
            company_id: session.user.user_metadata.company_id
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
      setIsLoading(false);
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
    <AuthContext.Provider value={{ user, token, signOut, signInDemo, isLoading, isConfigured: isSupabaseConfigured }}>
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
