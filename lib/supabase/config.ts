/**
 * SUPABASE CONFIGURATION MANAGER
 * 
 * Sistema profesional de gestión de configuración para Supabase
 * Maneja de manera elegante la disponibilidad de variables de entorno en diferentes contextos
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface ConfigValidation {
  isValid: boolean;
  config: SupabaseConfig | null;
  errors: string[];
}

class SupabaseConfigManager {
  private static instance: SupabaseConfigManager;
  private cachedConfig: SupabaseConfig | null = null;
  private configLoaded = false;

  private constructor() {}

  static getInstance(): SupabaseConfigManager {
    if (!SupabaseConfigManager.instance) {
      SupabaseConfigManager.instance = new SupabaseConfigManager();
    }
    return SupabaseConfigManager.instance;
  }

  /**
   * Valida y obtiene la configuración de Supabase
   */
  validateConfig(): ConfigValidation {
    const errors: string[] = [];
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL no está definida');
    }

    if (!anonKey) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida');
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        config: null,
        errors
      };
    }

    const config: SupabaseConfig = { url: url!, anonKey: anonKey! };
    return {
      isValid: true,
      config,
      errors: []
    };
  }

  /**
   * Obtiene la configuración de manera segura
   * @param options Opciones de configuración
   */
  getConfig(options: { 
    throwOnError?: boolean; 
    context?: 'server' | 'client' | 'middleware' 
  } = {}): SupabaseConfig | null {
    const { throwOnError = true, context = 'unknown' } = options;

    // Retornar cache si está disponible
    if (this.configLoaded && this.cachedConfig) {
      return this.cachedConfig;
    }

    // Validar configuración
    const validation = this.validateConfig();

    if (!validation.isValid) {
      const errorMessage = `❌ Configuración de Supabase inválida en contexto '${context}': ${validation.errors.join(', ')}`;
      
      if (throwOnError) {
        throw new Error(errorMessage);
      }

      // En contexto de build, logueamos pero no fallamos
      if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ Supabase config not available during build (${context}):`, validation.errors);
      }
      
      return null;
    }

    // Cachear configuración válida
    this.cachedConfig = validation.config;
    this.configLoaded = true;

    return this.cachedConfig;
  }

  /**
   * Verifica si la configuración está disponible sin lanzar errores
   */
  isConfigAvailable(): boolean {
    return this.getConfig({ throwOnError: false }) !== null;
  }

  /**
   * Resetea el cache (útil para testing)
   */
  resetCache(): void {
    this.cachedConfig = null;
    this.configLoaded = false;
  }
}

// ===============================================
// INTERFACE PÚBLICA
// ===============================================

const configManager = SupabaseConfigManager.getInstance();

/**
 * Obtiene la configuración de Supabase de manera segura
 */
export function getSupabaseConfig(context: 'server' | 'client' | 'middleware' = 'server'): SupabaseConfig {
  const config = configManager.getConfig({ 
    throwOnError: true, 
    context 
  });
  
  if (!config) {
    throw new Error(`No se pudo obtener la configuración de Supabase en contexto '${context}'`);
  }
  
  return config;
}

/**
 * Verifica si la configuración de Supabase está disponible
 */
export function hasSupabaseConfig(): boolean {
  return configManager.isConfigAvailable();
}

/**
 * Obtiene configuración de manera segura sin lanzar errores
 */
export function getSupabaseConfigSafe(context: 'server' | 'client' | 'middleware' = 'server'): SupabaseConfig | null {
  return configManager.getConfig({ 
    throwOnError: false, 
    context 
  });
}

/**
 * Valida la configuración y retorna detalles del estado
 */
export function validateSupabaseConfig() {
  return configManager.validateConfig();
}

// Para testing y desarrollo
export { SupabaseConfigManager };