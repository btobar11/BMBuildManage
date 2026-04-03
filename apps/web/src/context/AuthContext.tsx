import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check for dev token first
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

      // Get initial session
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
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // If we are in dev mode, don't let supabase override unless it's a real logout
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
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    localStorage.removeItem('DEV_TOKEN');
    localStorage.removeItem('sb-user-id');
    await supabase.auth.signOut();
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
    <AuthContext.Provider value={{ user, token, signOut, signInDemo, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
