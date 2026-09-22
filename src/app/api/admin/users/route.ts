import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveUploadedFile } from "@/lib/upload"
import { sendWelcomeEmail } from "@/lib/mail"
import { Role } from "@prisma/client"

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

// POST: Crear un nuevo usuario desde el panel de administración
export async function POST(request: Request) {
    console.log("🚀 1. Petición POST recibida en /api/users")
    try {
        const formData = await request.formData()

        const username = formData.get("username") as string
        const password = formData.get("password") as string
        const email = formData.get("email") as string

        // Campos opcionales de perfil
        const firstName = (formData.get("firstName") as string) || null
        const lastName = (formData.get("lastName") as string) || null
        const phoneNumber = (formData.get("phoneNumber") as string) || null
        const role = (formData.get("role") as string) || "CLIENT"
        const profilePictureFile = formData.get("profilePicture") as File | null

        console.log("📋 2. Datos recibidos:", { username, email, role })

        if (!username || !email || !password) {
            console.log("⚠️ Faltan datos obligatorios")
            return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 })
        }

        const cleanEmail = email.toLowerCase().trim()
        const cleanUsername = username.toLowerCase().trim()

        // Verificar existencia previa por email o username
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: cleanEmail },
                    { username: cleanUsername }
                ]
            }
        })

        if (existingUser) {
            console.log("⚠️ 3. El usuario o email YA EXISTE en la base de datos.")
            return NextResponse.json(
                { error: "El nombre de usuario o el correo electrónico ya están en uso" },
                { status: 400 }
            )
        }

        // Procesar foto de perfil si se subió un archivo
        let profilePictureUrl: string | null = null
        if (profilePictureFile && profilePictureFile.size > 0) {
            profilePictureUrl = await saveUploadedFile(profilePictureFile, "profiles")
        }

        console.log("⏳ 4. Creando usuario en DB...")
        const newUser = await prisma.user.create({
            data: {
                username: cleanUsername,
                password: password,
                email: cleanEmail,
                role: (role as Role) || Role.CLIENT,
                firstName,
                lastName,
                phoneNumber,
                profilePicture: profilePictureUrl,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                profilePicture: true,
                createdAt: true
            }
        })

        // Enviar mail de bienvenida con las credenciales
        console.log("📧 5. Intentando enviar correo a:", newUser.email)
        if (newUser.email) {
            const mailResult = await sendWelcomeEmail(newUser.email, newUser.username, password)
            if (!mailResult.success) {
                console.error("❌ Error al enviar mail de bienvenida:", mailResult.error)
            } else {
                console.log("✅ Mail de bienvenida enviado exitosamente")
            }
        }

        return NextResponse.json(newUser, { status: 201 })
    } catch (error) {
        console.error("❌ Error interno:", error)
        return NextResponse.json({ error: "Error interno al crear usuario" }, { status: 500 })
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