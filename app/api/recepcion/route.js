import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";
import { USER_ROLE } from "@/app/utils/constants";

// Registrando arribo
export async function POST(req) {
    try {
        console.log("[POST] /api/recepcion - Iniciando petición");
        
        const supabase = await getSupabaseServerClient();
        const { user } = await getAuthenticatedUser();
        if (!user) {
            console.warn("[POST] /api/recepcion - No autorizado");
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: usuario, error: userError } = await supabase
            .from("usuarios")
            .select("id, rol")
            .eq("id", user.id)
            .single();

        if (userError || !usuario || (usuario.rol !== USER_ROLE.recepcionista && usuario.rol !== USER_ROLE.profesional)) {
            console.warn("[POST] /api/recepcion - Acceso denegado para el usuario:", user.id);
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const body = await req.json();
        console.log("[POST] /api/recepcion - body recibido:", body);

        let pacienteId = body.pacienteId;

        if (!pacienteId) {
            const pacienteData = body.paciente;
            if (!pacienteData) {
                console.error("[POST] /api/recepcion - Datos de paciente requeridos");
                return NextResponse.json({ error: "Datos de paciente requeridos" }, { status: 400 });
            }

            const nuevoPacienteData = {
                numero_identidad: pacienteData.numeroIdentidad,
                nombres: pacienteData.nombres || "",
                apellidos: pacienteData.apellidos || "",
                genero: pacienteData.genero                
            };
            if(pacienteData.tratoEspecial) {
                nuevoPacienteData['nombre_social'] = pacienteData.nombreSocial;
            }
            const { data: nuevoPaciente, error: pacienteCreateError } = await supabase
                .from("pacientes")
                .insert(nuevoPacienteData)
                .select("id")
                .single();

            if (pacienteCreateError || !nuevoPaciente) {
                console.error("[POST] /api/recepcion - Error creando paciente:", pacienteCreateError);
                return NextResponse.json({ error: pacienteCreateError?.message || "Error creando paciente" }, { status: 500 });
            }

            pacienteId = nuevoPaciente.id;
            console.log("[POST] /api/recepcion - Nuevo paciente creado con ID:", pacienteId);
        } else {
            const { data: pacienteExistente, error: pacienteError } = await supabase
                .from("pacientes")
                .select("id")
                .eq("id", pacienteId)
                .single();

            if (pacienteError || !pacienteExistente) {
                return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
            }
        }

        const { data: arriboExistente, error: arriboExistenteError } = await supabase
            .from("arribos")
            .select("id")
            .eq("paciente_id", pacienteId)
            .is("fecha_termino", null)
            .maybeSingle();

        if(arriboExistente) {
            console.warn("[POST] /api/recepcion - El paciente ya tiene un arribo activo:", pacienteId);
            return NextResponse.json({ error: "El paciente ya tiene un arribo activo" }, { status: 400 });
        }

        if(arriboExistenteError) {
            console.error("[POST] /api/recepcion - Error verificando arribo existente:", arriboExistenteError);
            return NextResponse.json({ error: arriboExistenteError?.message || "Error verificando arribo existente" }, { status: 500 });
        }

        const { data: nuevoArribo, error: arriboError } = await supabase
            .from("arribos")
            .insert({
                paciente_id: pacienteId                
            })
            .select("id, paciente_id")
            .single();

        if (arriboError || !nuevoArribo) {
            console.error("[POST] /api/recepcion - Error creando arribo:", arriboError);
            return NextResponse.json({ error: arriboError?.message || "Error creando arribo" }, { status: 500 });
        }        

        return NextResponse.json({
            arribo: {
                id: nuevoArribo.id,
                pacienteId: nuevoArribo.paciente_id                
            }
        });
    } catch (error) {
        console.error("[POST] /api/recepcion - Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}