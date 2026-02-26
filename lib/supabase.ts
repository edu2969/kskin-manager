import { createSupabaseServerClient } from "./supabase/server-client";

// Función helper para obtener el cliente en rutas API
export async function getSupabaseServerClient() {
  return await createSupabaseServerClient();
}

// Export de compatibilidad para el legacy supabase import
export const supabase = {
  from: () => { throw new Error("Use getSupabaseServerClient() instead of direct supabase import"); },
  auth: { getUser: () => { throw new Error("Use getSupabaseServerClient() instead of direct supabase import"); } }
};

// Re-export para compatibilidad
export { createSupabaseServerClient };