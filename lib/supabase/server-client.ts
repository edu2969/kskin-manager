import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

interface ServerClientOptions {
  skipAuth?: boolean;
}

export async function createSupabaseServerClient(options: ServerClientOptions = {}): Promise<ReturnType<typeof createServerClient>> {
  try {
    const config = getSupabaseConfig('server');
    const cookieStore = await cookies();
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
    console.error('Error creating Supabase server client:', error);
    throw error;
  }
}

/**
 * Crea cliente Supabase del servidor sin autenticación automática
 * Útil para operaciones públicas o cuando se maneja auth manualmente
 */
export async function createSupabaseServerClientPublic(): Promise<ReturnType<typeof createServerClient>> {
  return createSupabaseServerClient({ skipAuth: true });
}