/**
 * SUPABASE SERVER CLIENT
 * 
 * Cliente Supabase optimizado para uso en Server Components y API Routes
 * Utiliza cookies para sesión persistente del lado del servidor
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

interface ServerClientOptions {
  skipAuth?: boolean;
}

/**
 * Crea una instancia del cliente Supabase para uso en el servidor
 * @param options Opciones de configuración del cliente
 */
export async function createSupabaseServerClient(options: ServerClientOptions = {}): Promise<ReturnType<typeof createServerClient>> {
  try {
    // PROTECCIÓN: Durante build time, devolver cliente mock
    if (process.env.NODE_ENV === 'production' && typeof window === 'undefined' && process.env.CI) {
      return {
        from: () => ({ select: () => ({ data: null, error: null }) }),
        auth: { getUser: () => ({ data: { user: null }, error: null }) }
      } as any;
    }

    // Obtener configuración de manera segura
    const config = getSupabaseConfig('server');
    
    // Obtener cookies del servidor
    const cookieStore = await cookies();

    // Crear cliente con configuración de cookies
    const client = createServerClient(
      config.url,
      config.anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try {
                cookieStore.set(name, value, options);
              } catch (error) {
                // En algunos contextos, las cookies pueden ser read-only
                console.warn(`No se pudo establecer la cookie '${name}':`, error);
              }
            });
          }
        }
      }
    );

    return client;

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    throw new Error(`Error creando cliente Supabase servidor: ${message}`);
  }
}

/**
 * Crea cliente Supabase del servidor sin autenticación automática
 * Útil para operaciones públicas o cuando se maneja auth manualmente
 */
export async function createSupabaseServerClientPublic(): Promise<ReturnType<typeof createServerClient>> {
  return createSupabaseServerClient({ skipAuth: true });
}