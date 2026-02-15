/**
 * BIOX - Contexto de Autenticación con Supabase
 * Sistema de autenticación completamente migrado a Supabase
 */

'use client';

import { useState, useEffect, useContext, createContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOnVisibilityChange } from '../uix/useOnVisibilityChange';

// ===============================================
// TIPOS DE DATOS
// ===============================================

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ===============================================
// PROVIDER PRINCIPAL
// ===============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // ===============================================
  // FUNCIONES DE SUPABASE
  // ===============================================

  const supabaseSignIn = async (email: string, password: string) => {
    try {
      // Primero intentar con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        
        const result = await response.json();
        
        if (!result.ok) {
          return { success: false, error: result.error || 'Credenciales inválidas' };
        }
        
        // Intentar obtener sesión de Supabase nuevamente (el usuario pudo haber sido migrado)
        const { data: newSession } = await supabase.auth.getSession();
        if (newSession?.session?.user) {
          await loadUserData(newSession.session.user.id);
        } else {
          // Si no hay sesión en Supabase, usar datos básicos
          throw new Error('Usuario autenticado pero no se pudo obtener sesión de Supabase');
        }
        
        return { success: true };
      }

      if (data.user) {
        // Login exitoso directo con Supabase
        await loadUserData(data.user.id);
        return { success: true };
      }

      return { success: false, error: 'No user data returned' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const supabaseSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
    }
  };

  const supabaseSignUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useOnVisibilityChange(async () => {
    console.log("REFRESCANDO SESIÓN POR VISIBILITY CHANGE %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
    await refreshSession();
  });

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('Refrescando sesión para el usuario:', session.user.id);
        await loadUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error al refrescar la sesión:', error);
    }
  };

  const loadUserData = async (userId: string) => {
    try {
      console.log('Iniciando loadUserData para el usuario:', userId);      
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select(`
          id,
          email,
          nombre,
          rol
        `)
        .eq('id', userId)
        .single();
      
      if (userError || !userData) {
        console.error('Error al cargar datos del usuario:', userError);
        throw userError;
      }

      setUser({
        id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        rol: userData.rol
      })
    } catch (error) {
      console.error('Error en loadUserData:', error);
      throw error;
    }
  }
            

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Intentando recuperar la sesión de Supabase...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error al recuperar la sesión:', error);
          return;
        }

        if (session?.user) {
          console.log('Sesión encontrada:', session);
          await loadUserData(session.user.id);
        } else {
          console.log('No se encontró una sesión activa.');
          setUser(null);
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'Auth session missing') {
          console.warn('No hay sesión activa para refrescar.');
        } else {
          console.error('Error al inicializar la autenticación:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Escuchar cambios de autenticación
    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Cambio en el estado de autenticación:', event);
      if (session?.user) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription?.subscription.unsubscribe();
  }, []);

  const authenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated,
        signIn: supabaseSignIn,
        signOut: supabaseSignOut,
        signUp: supabaseSignUp,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ===============================================
// HOOKS DE USO
// ===============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  return { user, loading };
}