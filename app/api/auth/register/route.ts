/**
 * BIOX - API de Registro con Supabase Auth
 * Reemplaza el registro tradicional con MongoDB
 */

// Configuración del runtime para Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { ResponseHelper } from "@/lib/supabase-helpers";

// ===============================================
// TIPOS DE DATOS
// ===============================================

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  telefono?: string;
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    nombre: string;
  };
  message: string;
}

// ===============================================
// OPERACIÓN CON SUPABASE (NUEVO SISTEMA)
// ===============================================

async function registerWithSupabase(userData: RegisterRequest): Promise<RegisterResponse> {
  const { name, email, password, telefono } = userData;
  const supabase = await getSupabaseServerClient();
  
  // 1. Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
        telefono: telefono || null
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new Error('El email ya está registrado');
    }
    
    throw new Error(error.message || 'Error en el registro');
  }

  if (!data.user) {
    throw new Error('Error creando usuario');
  }
  
  return {
    user: {
      id: data.user.id,
      email: email,
      nombre: name
    },
    message: 'Usuario registrado exitosamente'
  };
}

// ===============================================
// ===============================================
// HANDLER PRINCIPAL
// ===============================================

export async function POST(req: NextRequest) {
  try {
    const body: RegisterRequest = await req.json();
    const { name, email, password, telefono } = body;

    // Validación de entrada
    if (!name || !email || !password) {
      return ResponseHelper.error("Nombre, email y contraseña son requeridos");
    }

    if (password.length < 6) {
      return ResponseHelper.error("La contraseña debe tener al menos 6 caracteres");
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return ResponseHelper.error("Formato de email inválido");
    }

    // Ejecutar registro directamente con Supabase
    const result = await registerWithSupabase({ name, email, password, telefono });

    return ResponseHelper.success({
      user: result.user,
      message: result.message
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error en el registro";
    return ResponseHelper.error(
      message,
      400
    );
  }
}

// ===============================================
// ===============================================
// ENDPOINT PARA VERIFICAR SI USUARIO EXISTE
// ===============================================

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return ResponseHelper.error("Email es requerido");
    }

    // Verificar directamente en Supabase
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();
    
    const exists = !error && data;

    return ResponseHelper.success({
      exists: !!exists,
      email
    });

  } catch {
    return ResponseHelper.error("Error verificando usuario", 500);
  }
}