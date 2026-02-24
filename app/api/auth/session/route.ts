// Configuración del runtime para Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { supabase } from "@/lib/supabase";
import { APIResponse } from "@/lib/supabase-helpers";

interface SessionResponse {
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: number;
  } | null; 
  authenticated: boolean;
}

async function getSupabaseSession(): Promise<SessionResponse> {
  console.log("Obteniendo sesión de Supabase...");
  // 1. Obtener usuario actual de Supabase Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      user: null,
      authenticated: false
    };
  }

  // 2. Obtener información adicional del usuario y sus cargos
  const { data: usuario, error: userError } = await supabase
    .from('usuarios')
    .select(`*`)
    .eq('id', user.id)
    .is('cargos.hasta', null) // Solo cargos activos
    .single();

  if (userError || !usuario) {
    console.log("Error obteniendo usuario adicional:", userError);
    // Retornar datos básicos del auth
    return {
      user: {
        id: user.id,
        email: user.email!,
        nombre: user.email!.split('@')[0],
        rol: Number(user.role)
      },
      authenticated: true
    };
  }

  return {
    user: {
      id: user.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: Number(usuario.rol)
    },
    authenticated: true
  };
}

// ===============================================
// HANDLER PRINCIPAL
// ===============================================

export async function GET() {
  try {
    // Obtener sesión directamente de Supabase
    const sessionData = await getSupabaseSession();

    if (!sessionData.authenticated) {
      return APIResponse.success({
        user: null,
        authenticated: false,
        message: 'No active session'
      });
    }

    return APIResponse.success({
      user: sessionData.user,
      rol: sessionData.user?.rol,
      authenticated: true,
      message: 'Session active'
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error obteniendo sesión"; 
    return APIResponse.error(
      "Error obteniendo sesión",
      500,
      process.env.NODE_ENV === 'development' ? message : undefined
    );
  }
}

// ===============================================
// ENDPOINT PARA REFRESH DE SESIÓN
// ===============================================

export async function POST() {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return APIResponse.error("Error refrescando sesión", 401);
    }

    if (!data.session || !data.user) {
      return APIResponse.error("No hay sesión para refrescar", 401);
    }

    return APIResponse.success({
      user: {
        id: data.user.id,
        email: data.user.email!,
        nombre: data.user.email!.split('@')[0]
      },
      session: data.session,
      message: 'Sesión refrescada exitosamente'
    });

  } catch {
    return APIResponse.error("Error interno en refresh", 500);
  }
}