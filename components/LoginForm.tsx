"use client";
import { useRouter } from "next/navigation";
import { useForm, FieldErrors } from "react-hook-form";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import Image from "next/image";
import Loader from "./Loader";

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const router = useRouter();
  const onError = (errors: FieldErrors<LoginFormData>, e?: React.BaseSyntheticEvent) => console.log(errors, e);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [redirecting, setRedirecting] = useState(false);  
  
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const updateResolution = () => {
      setResolution({ width: window.innerWidth, height: window.innerHeight });
    };
    updateResolution();
    window.addEventListener("resize", updateResolution);
    return () => window.removeEventListener("resize", updateResolution);
  }, []);

  const {
    register,
    formState: {
      errors
    },
    handleSubmit,
  } = useForm<LoginFormData>();  

  const onSubmit = async (data: LoginFormData) => {
    setIsLoggingIn(true);
    
    try {
      console.log('Intentando login con:', data.email);
      const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if(!error) {
        console.log('Login exitoso, redirigiendo...');
        setRedirecting(true);
        router.replace("/pages");
      }
    } catch (error) {
      console.error('Error en onSubmit:', error);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B9B7A] via-[#9CAE8A] to-[#8B9B7A] relative overflow-hidden">
      {/* Formas decorativas orgánicas */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
        <div className="w-full h-full bg-gradient-to-bl from-[#D4AF8C] to-transparent rounded-full transform translate-x-32 -translate-y-32"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-48 h-48 opacity-15">
        <div className="w-full h-full bg-gradient-to-tr from-[#D4AF8C] to-transparent rounded-full transform -translate-x-24 translate-y-24"></div>
      </div>
      <div className="absolute bottom-20 right-10 w-32 h-32 opacity-10">
        <div className="w-full h-full bg-gradient-to-tl from-[#D4AF8C] to-transparent rounded-full"></div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-6">
        {/* Logo superior */}
        <div className="mb-8">          
            <Image width={240} height={120} src="/brand-green-kskin.png" alt="KSKIN-Brand" className="h-32 w-auto filter brightness-0 invert" priority={true} />          
        </div>
        
        {/* Tarjeta de login */}
        <div className="w-full max-w-md">
          <div className="bg-[#EFEBDD] rounded-3xl shadow-2xl p-8 relative">
            {/* Detalle decorativo */}
            <div className="absolute top-4 right-4 w-8 h-8 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-[#D4AF8C] to-transparent rounded-full"></div>
            </div>

            <h3 className="text-2xl font-bold text-[#4A4A4A] text-center mb-8">
              Inicio de Sesión
            </h3>

            <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
              {/* Input Usuario */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B9B7A]">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  {...register("email", { required: true })}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Usuario"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#DCD0BE] rounded-full text-[#4A4A4A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B9B7A] focus:border-transparent transition-all"
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1 ml-4">E-mail requerido</p>}
              </div>

              {/* Input Contraseña */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8B9B7A]">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  {...register("password", { required: true })}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#DCD0BE] rounded-full text-[#4A4A4A] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#8B9B7A] focus:border-transparent transition-all"
                  required
                />
                {errors.password && <p className="text-red-500 text-sm mt-1 ml-4">Contraseña requerida</p>}
              </div>

              {/* Botón de entrada */}
              <button
                type="submit"
                disabled={isLoggingIn || redirecting}
                className="h-16 w-full bg-[#8B9B7A] text-white font-bold py-4 rounded-full hover:bg-[#7A8A69] active:bg-[#6A7A59] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoggingIn ? (
                  <Loader texto="Validando" />
                ) : redirecting ? (
                  <Loader texto="Redirigiendo..." />
                ) : (
                  "Entrar"
                )}
              </button>

              {/* Enlaces inferiores */}
              <div className="flex justify-between items-center pt-4 text-sm">
                <button
                  type="button"
                  className="text-[#8B9B7A] hover:text-[#7A8A69] transition-colors"
                >
                  Olvidé mi contraseña
                </button>
                <button
                  type="button"
                  className="text-[#8B9B7A] hover:text-[#7A8A69] transition-colors"
                >
                  ¿Necesitas ayuda?
                </button>
              </div>              
            </form>
          </div>
        </div>

        {/* Footer con logos */}
        <div className="mt-12 flex flex-col items-center gap-6">          
          <div className="flex items-center gap-3 opacity-60">
            <Image width={24} height={24} src="/brand-green-kskin.png" alt="KSKIN" className="w-16 filter brightness-0 invert" />
            <div className="text-white text-xs opacity-60">
              Salud y Estética Integral
            </div>
          </div>          
          <div className="text-white text-xs opacity-40 mt-0">
            Derechos Reservados © 2024 Kskin
          </div>
        </div>
      </div>

      {/* Debug info */}
      <div style={{
        position: "absolute",
        top: 72,
        right: 16,
        background: "rgba(0,0,0,0.5)",
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        zIndex: 50
      }}>
        {resolution.width} x {resolution.height}
      </div>
    </div>
  );
}