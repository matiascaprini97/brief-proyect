import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveUploadedFile } from "@/lib/upload"
import { sendWelcomeEmail } from "@/lib/mail"

// GET: Obtener todos los usuarios reales de la DB
export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                profilePicture: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(users)
    } catch (error) {
        console.error("Error al obtener usuarios:", error)
        return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
    }
}

// POST: Crear un nuevo usuario (Soporta FormData con imagen de perfil opcional)
export async function POST(request: Request) {
    try {
        const formData = await request.formData()

        const username = formData.get("username") as string
        const password = formData.get("password") as string
        const email = formData.get("email") as string
        const firstName = formData.get("firstName") as string | null
        const lastName = formData.get("lastName") as string | null
        const phoneNumber = formData.get("phoneNumber") as string | null
        const role = formData.get("role") as "CLIENT" | "ADMIN" | null
        const imageFile = formData.get("image") as File | null

        // Validaciones del servidor
        if (!username || !email || !password) {
            return NextResponse.json(
                { error: "Faltan datos obligatorios (Usuario, Email y Contraseña)" },
                { status: 400 }
            )
        }

        // Evitar registros duplicados
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email.toLowerCase().trim() },
                    { username: username.toLowerCase().trim() }
                ]
            }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "El nombre de usuario o el correo electrónico ya están en uso" },
                { status: 400 }
            )
        }

        // Guardar avatar si fue seleccionado
        let profilePictureUrl: string | null = null
        if (imageFile && imageFile.size > 0) {
            profilePictureUrl = await saveUploadedFile(imageFile, "uploads/profiles")
        }

        const newUser = await prisma.user.create({
            data: {
                username: username.toLowerCase().trim(),
                password: password, // Si usás encriptación, hasheala acá
                email: email.toLowerCase().trim(),
                firstName: firstName || null,
                lastName: lastName || null,
                phoneNumber: phoneNumber || null,
                role: role || "CLIENT",
                profilePicture: profilePictureUrl,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            }
        })
        if (newUser.email) {
            sendWelcomeEmail(newUser.email, newUser.username, password).catch(err =>
                console.error("Error al enviar email de bienvenida asíncrono:", err)
            )
        }

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        console.error("Error al crear usuario en DB:", error)
        return NextResponse.json({ error: "Error interno al registrar el usuario" }, { status: 500 })
    }
}

// DELETE: Borrado masivo de usuarios
export async function DELETE(request: Request) {
    try {
        const { ids } = await request.json()

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Se requiere un array de IDs" }, { status: 400 })
        }

        const deleted = await prisma.user.deleteMany({
            where: {
                id: { in: ids },
            },
        })

        return NextResponse.json({
            message: `${deleted.count} usuarios eliminados correctamente`,
            count: deleted.count,
        })
    } catch (error) {
        console.error("Error al eliminar usuarios:", error)
        return NextResponse.json({ error: "Error al realizar borrado masivo" }, { status: 500 })
    }
}