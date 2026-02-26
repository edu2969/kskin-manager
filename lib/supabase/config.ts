/**
 * CONFIGURACIÓN SUPABASE
 * Manejo seguro de variables de entorno para diferentes contextos
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

let configCache: SupabaseConfig | null = null;

export function clearConfigCache() {
  configCache = null;
}

export function getSupabaseConfig(context: 'server' | 'client' | 'middleware' = 'client'): SupabaseConfig {
  // Si ya tenemos la config en cache, devolverla
  if (configCache) {
    return configCache;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Si no hay variables de entorno, usar configuración mock
  if (!url || !anonKey) {
    console.warn('Variables de Supabase no encontradas, usando configuración mock');
    configCache = {
      url: 'https://mock.supabase.co',
      anonKey: 'mock-anon-key'
    };
    return configCache;
  }

  // Validar formato de URL
  try {
    new URL(url);
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL no es una URL válida: ${url}`);
  }

  // Cache y retornar configuración válida
  configCache = { url, anonKey };
  return configCache;
}

export function hasSupabaseConfig(): boolean {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
}

export function getSupabaseConfigSafe(context: 'server' | 'client' | 'middleware' = 'client'): SupabaseConfig | null {
  try {
    return getSupabaseConfig(context);
  } catch {
    return null;
  }
}

export function validateSupabaseConfig() {
  try {
    const config = getSupabaseConfig();
    return {
      isValid: true,
      config,
      errors: []
    };
  } catch (error) {
    return {
      isValid: false,
      config: null,
      errors: [error instanceof Error ? error.message : 'Error desconocido']
    };
  }
}