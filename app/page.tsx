import { redirect } from "next/navigation";
import { authOptions } from "@/app/utils/authOptions";
import LoginForm from "@/app/components/LoginForm";
import { getServerSession } from "next-auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // Si hay sesión, redirigir a /modulos
  if (session) {
    redirect('/modulos');
  }

  // Si no hay sesión, mostrar el formulario de login
  return (
    <LoginForm />
  );
}
