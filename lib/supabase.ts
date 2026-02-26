// Archivo temporal de compatibilidad para imports de @/lib/supabase
// Evita errores de build mientras se migran las rutas de API

export { createSupabaseServerClient as getSupabaseServerClient } from './supabase/server-client';