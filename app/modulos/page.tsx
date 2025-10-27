import Panoramica from '@/app/components/sucursal/Panoramica';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";


export default async function Page() {
    const session = await getServerSession(authOptions);
    return <Panoramica session={session} />;
}