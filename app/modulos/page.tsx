import Panoramica from '@/app/components/sucursal/Panoramica';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";


export default async function Page() {
    const session = await getServerSession(authOptions);
    return session ? <Panoramica session={session} /> : <div className="p-4">No estás autenticado. Por favor, inicia sesión para ver la panorámica.</div>;
}