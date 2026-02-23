import { supabase } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/supabase/supabase-auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { user } = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { data: examenes, error } = await supabase
            .from('examenes')
            .select('*')
            .order('codigo', { ascending: true });

        if (error) {
            console.log("ERROR fetching examenes:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(examenes);
    } catch (err) {
        console.error('Error fetching examenes:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}