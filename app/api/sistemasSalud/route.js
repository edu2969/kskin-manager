import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        console.log("[GET] /api/sistemasSalud - Iniciando petición");

        const { user } = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: sistemasSalud, error } = await supabase
            .from('sistemas_salud')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.log("ERROR fetching sistemas_salud:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("Sistemas de salud encontrados:", sistemasSalud?.length || 0);

        return NextResponse.json(sistemasSalud);
    } catch (err) {
        console.error('Error fetching sistemas_salud:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}