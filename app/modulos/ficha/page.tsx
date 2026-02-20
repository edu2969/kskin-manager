import Ficha from "@/components/ficha/Ficha";

export default async function FichaPage({ 
    searchParams 
}: { 
    searchParams: { pacienteId?: string; fichaId?: string } 
}) {
    const { pacienteId, fichaId } = await searchParams;
    
    if (!pacienteId && !fichaId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500">ID de paciente / ID de ficha - requerido</div>
            </div>
        );
    }    
    
    return <Ficha pacienteId={pacienteId || null} fichaId={fichaId || null} />;
}