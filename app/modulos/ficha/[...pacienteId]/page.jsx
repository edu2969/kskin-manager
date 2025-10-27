import Ficha from '@/app/components/Ficha';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";


export default async function FichaPage({ params }) {
    const session = await getServerSession(authOptions);
    const { pacienteId } = await params;

    if (!pacienteId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500">ID de paciente requerido</div>
            </div>
        );
    }
    
    return <Ficha session={session} pacienteId={pacienteId} />;
}