/**
 * BIOX - Supabase Client Configuration
 * Configuración centralizada del cliente de Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
}

// Cliente principal (client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    },
    global: {
        headers: {
            'x-client-info': 'kskin-manager'
        }
    },
    db: {
        schema: 'public'
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Cliente con service role para operaciones administrativas (solo server-side)
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on the server side');
  }
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// For backwards compatibility, but only initialize on server-side
export const supabaseAdmin = typeof window === 'undefined' ? getSupabaseAdmin() : (null as any);

// Tipos TypeScript para las tablas principales
export interface Usuario {
    id: string;
    email: string;
    nombre: string;
    rol: number;
    created_at: string;
    updated_at: string;
}

// Utilidades para queries comunes
export const supabaseQueries = {
    // Obtener usuario actual con sus cargos
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data: usuario, error } = await supabase
            .from('usuarios')
            .select(`*`)
            .eq('id', user.id)
            .single();

        return { user, usuario, error };
    },

    // Función para refresh de vistas materializadas
    async refreshMaterializedViews() {
        const { data, error } = await supabaseAdmin.rpc('refresh_materialized_views');
        return { data, error };
    },

    // Verificar estado de la conexión
    async checkConnection() {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id')
                .limit(1);
            return { connected: !error, error };
        } catch (error) {
            return { connected: false, error };
        }
    }
};

export default supabase;