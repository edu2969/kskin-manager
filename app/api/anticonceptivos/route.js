import { getSupabaseServerClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        console.log("[GET] /api/anticonceptivos - Iniciando petición");

        const { data: user } = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const supabase = await getSupabaseServerClient();
        const { data: anticonceptivos, error } = await supabase
            .from('metodos_anticonceptivos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.log("ERROR fetching anticonceptivos:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log("Anticonceptivos encontrados:", anticonceptivos?.length || 0);

        return NextResponse.json(anticonceptivos);
    } catch (err) {
        console.error('Error fetching anticonceptivos:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}