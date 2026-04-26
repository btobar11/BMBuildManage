import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { queryClient } from '../main';
import api from '../lib/api';

/**
 * User Roles - RBAC System
 * Used for route protection and UI conditional rendering
 */
const USER_ROLES = [
  'admin',
  'engineer',
  'architect',
  'site_supervisor',
  'foreman',
  'accounting',
  'viewer',
  'worker',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

function normalizeRole(raw: unknown): UserRole {
  return USER_ROLES.includes(raw as UserRole)
    ? (raw as UserRole)
    : 'engineer';
}

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
  const [isAuthReady, setIsAuthReady] = useState(false);

  const fetchMe = async (): Promise<Pick<User, 'role' | 'company_id' | 'name'> | null> => {
    try {
      const res = await api.get('/users/me');
      return {
        role: normalizeRole(res.data?.role),
        company_id: res.data?.company_id || undefined,
        name: res.data?.name || 'Usuario',
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.removeItem('DEV_TOKEN');
          setToken(session.access_token);
          
          // Get display name: prefer first_name + last_name, then full_name, then email prefix
          const firstName = session.user.user_metadata?.first_name;
          const lastName = session.user.user_metadata?.last_name;
          const fullName = session.user.user_metadata?.full_name;
          const emailPrefix = session.user.email?.split('@')[0];
          
          let displayName = emailPrefix || 'Usuario';
          if (firstName && lastName) {
            displayName = `${firstName} ${lastName}`;
          } else if (fullName) {
            displayName = fullName;
          } else if (firstName) {
            displayName = firstName;
          }
          
          const me = await fetchMe();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: me?.name || displayName,
            role: me?.role || normalizeRole(session.user.user_metadata.role),
            company_id: me?.company_id || session.user.user_metadata.company_id
          });
          setIsLoading(false);
          setIsAuthReady(true);
          return;
        }
      } catch {
        // Silent fail
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
        
        // Get display name: prefer first_name + last_name, then full_name, then email prefix
        const firstName = session.user.user_metadata?.first_name;
        const lastName = session.user.user_metadata?.last_name;
        const fullName = session.user.user_metadata?.full_name;
        const emailPrefix = session.user.email?.split('@')[0];
        
        let displayName = emailPrefix || 'Usuario';
        if (firstName && lastName) {
          displayName = `${firstName} ${lastName}`;
        } else if (fullName) {
          displayName = fullName;
        } else if (firstName) {
          displayName = firstName;
        }
        
        void (async () => {
          const me = await fetchMe();
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: me?.name || displayName,
            role: me?.role || normalizeRole(session.user.user_metadata.role),
            company_id: me?.company_id || session.user.user_metadata.company_id,
          });
        })();
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
    localStorage.removeItem('BM_QUERY_CACHE');
    
    // Clear in-memory query cache to prevent cross-account data leaks
    queryClient.clear();
    
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setToken(null);
    setUser(null);
  };

  const signInDemo = () => {
    // Clear previous session data before entering demo mode
    queryClient.clear();
    localStorage.removeItem('BM_QUERY_CACHE');
    
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
    <AuthContext.Provider value={{ user, token, signOut, signInDemo, isLoading, iAuthReady, isConfigured: isSupabaseConfigured }}>
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
