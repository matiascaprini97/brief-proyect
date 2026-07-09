import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const rawToken = cookieStore.get("session_token")?.value

        // Si no hay sesión válida, devolvemos null sin romper nada
        if (!rawToken) {
            return NextResponse.json({ profilePicture: null }, { status: 401 })
        }

        const userId = rawToken.replace("%3A", ":").split(":")[0]

        // Buscamos solo la foto de perfil en la base de datos
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { profilePicture: true }
        })

        return NextResponse.json({ profilePicture: user?.profilePicture || null })

    } catch (error) {
        console.error("❌ Error en API profile:", error)
        return NextResponse.json({ profilePicture: null }, { status: 500 })
    }
}