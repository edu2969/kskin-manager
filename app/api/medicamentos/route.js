import { getSupabaseServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await getSupabaseServerClient();
    const { data: medicamentos, error } = await supabase
        .from('medicamentos')
        .select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ medicamentos });
}