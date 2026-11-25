import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Profile, UserSystemRole } from '@/types/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isSuperadmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Perfil padrão demonstrativo para desenvolvimento local caso o Supabase não esteja conectado
const DEV_DEFAULT_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Administrador Master',
  email: 'admin@lynustech.com.br',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  phone: '(11) 98765-4321',
  is_superadmin: true,
  created_at: new Date().toISOString(),
};

/**
 * Usuário de teste local (não passa pelo Supabase).
 * Ativo em desenvolvimento ou quando VITE_ENABLE_TEST_USER=true.
 */
export const TEST_USER = { login: 'admin', password: '123' } as const;
export const TEST_USER_ID = '00000000-0000-0000-0000-0000000000aa';
export const isTestUserEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_USER === 'true';
const TEST_AUTH_KEY = 'lynus_test_auth';

const TEST_PROFILE: Profile = {
  ...DEV_DEFAULT_PROFILE,
  id: TEST_USER_ID,
  full_name: 'Administrador (Teste)',
  email: 'admin',
  avatar_url: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sessão do usuário de teste local tem prioridade
    if (isTestUserEnabled && localStorage.getItem(TEST_AUTH_KEY)) {
      setUser({ id: TEST_USER_ID, email: TEST_PROFILE.email } as User);
      setProfile(TEST_PROFILE);
      setIsLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Modo Desenvolvimento com dados locais
      const storedAuth = localStorage.getItem('lynus_dev_auth');
      if (storedAuth) {
        setUser({ id: DEV_DEFAULT_PROFILE.id, email: DEV_DEFAULT_PROFILE.email } as User);
        setProfile(DEV_DEFAULT_PROFILE);
      }
      setIsLoading(false);
      return;
    }

    // Carrega sessão ativa do Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      } else {
        // Fallback básico
        setProfile(DEV_DEFAULT_PROFILE);
      }
    } catch {
      setProfile(DEV_DEFAULT_PROFILE);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (isTestUserEnabled && email.trim().toLowerCase() === TEST_USER.login && password === TEST_USER.password) {
      localStorage.setItem(TEST_AUTH_KEY, 'true');
      setUser({ id: TEST_USER_ID, email: TEST_PROFILE.email } as User);
      setProfile(TEST_PROFILE);
      return { error: null };
    }

    if (!isSupabaseConfigured) {
      // Login em modo local / demonstração
      localStorage.setItem('lynus_dev_auth', 'true');
      setUser({ id: DEV_DEFAULT_PROFILE.id, email } as User);
      setProfile({ ...DEV_DEFAULT_PROFILE, email });
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    localStorage.removeItem('lynus_dev_auth');
    localStorage.removeItem(TEST_AUTH_KEY);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signIn,
        signOut,
        isSuperadmin: profile?.is_superadmin ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

