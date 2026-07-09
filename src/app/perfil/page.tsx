import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import ProfileForm from "./ProfileForm"

export default async function PerfilPage() {
    const cookieStore = await cookies()
    const rawToken = cookieStore.get("session_token")?.value

    if (!rawToken) {
        redirect("/")
    }

    // Extraemos el ID del usuario de la sesión actual
    const userId = rawToken.replace("%3A", ":").split(":")[0]

    // Buscamos los datos actuales en Postgres (excluyendo el password por seguridad)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            username: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            profilePicture: true,
        }
    })

    // Si por algún motivo raro el token tiene un ID que ya no existe en la DB
    if (!user) {
        redirect("/")
    }

    return (
        <div className="min-h-screen bg-zinc-50 px-6 py-12">
            <ProfileForm initialData={user} />
        </div>
    )
}