/**
 * BIOX - Hook de Compatibilidad NextAuth → Supabase
 * Proporciona una interfaz compatible con NextAuth usando nuestro nuevo sistema
 */

'use client';

import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

// ===============================================
// TIPOS DE COMPATIBILIDAD
// ===============================================

interface LegacyUser {
  id: string;
  email: string;
  name: string;
  role: number; // Rol legacy numérico
}

interface LegacySession {
  user?: LegacyUser;
  expires?: string;
}

interface SessionReturn {
  data: LegacySession | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

// ===============================================
// HOOK DE COMPATIBILIDAD
// ===============================================

export function useSession(): SessionReturn {
  const { user, loading } = useAuth();
  
  const sessionData = useMemo(() => {
    if (!user || typeof user.rol !== 'number') {
      return null;
    }

    const legacyRole = user.rol || 128;

    const legacyUser: LegacyUser = {
      id: user.id,
      email: user.email,
      name: user.nombre || user.email,
      role: legacyRole
    };

    return {
      user: legacyUser,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
    };
  }, [user]);

  const status = loading 
    ? 'loading' 
    : sessionData 
      ? 'authenticated' 
      : 'unauthenticated';

  return {
    data: sessionData,
    status: status as 'loading' | 'authenticated' | 'unauthenticated'
  };
}

// ===============================================
// FUNCIONES DE SERVER-SIDE COMPATIBILITY
// ===============================================

export interface ServerSession {
  user: {
    id: string;
    email: string;
    role: number;
    name: string;
  };
}

/**
 * Reemplazo para getServerSession en APIs
 * Usar en rutas de API que anteriormente usaban NextAuth
 */
export async function getSupabaseServerSession(): Promise<ServerSession | null> {
  // Esta función debería ser llamada desde el middleware de autorización
  // Por ahora, devuelve null para indicar que la sesión debe manejarse diferente
  console.warn('getSupabaseServerSession: Use el nuevo middleware de autorización en su lugar');
  return null;
}

// ===============================================
// HELPER PARA VERIFICAR SESIONES EN APIs
// ===============================================

/**
 * Verificar si una request tiene una sesión válida
 * Versión simplificada para migración gradual
 */
export function hasValidSession(session: ServerSession | null): boolean {
  return Boolean(session?.user?.id);
}

// ===============================================
// HOOKS DE SIGN IN/OUT DE COMPATIBILIDAD
// ===============================================

export function useSignIn() {
  const { signIn } = useAuth();
  
  return {
    signIn: async (provider?: string, options?: { email?: string; password?: string; callbackUrl?: string }) => {
      if (provider === 'credentials' && options?.email && options?.password) {
        return await signIn(options.email, options.password);
      }
      throw new Error('Only credentials provider is supported in migration');
    }
  };
}

export function useSignOut() {
  const { signOut } = useAuth();
  
  return {
    signOut: async (options?: { redirect?: boolean; callbackUrl?: string }) => {
      await signOut();
      if (options?.redirect !== false && typeof window !== 'undefined') {
        window.location.href = options?.callbackUrl || '/';
      }
    }
  };
}