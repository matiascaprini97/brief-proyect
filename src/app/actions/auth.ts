"use server"

import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import crypto from "crypto"
import { sendResetPasswordEmail } from "@/lib/mail"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export interface LoginResult {
    success: boolean
    error?: string
    role?: "ADMIN" | "CLIENT"
}

export interface ProfileResult {
    success: boolean
    error?: string
}

// === ACCIÓN: LOGIN ===
export async function loginAction(formData: FormData): Promise<LoginResult> {
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    if (!username || !password) {
        return { success: false, error: "Por favor, completá todos los campos." }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username: username.trim() },
        })

        if (!user || user.password !== password) {
            return { success: false, error: "Usuario o contraseña incorrectos." }
        }

        const cookieStore = await cookies()
        cookieStore.set("session_token", `${user.id}:${user.role}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        })
        return {
            success: true,
            role: user.role,
        }

    } catch (error) {
        console.error("Error en el proceso de login:", error)
        return { success: false, error: "Hubo un problema en el servidor. Intentá de nuevo." }
    }
}

// === ACCIÓN: CERRAR SESIÓN ===
export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete("session_token")
    redirect("/")
}

// === ACCIÓN: EDITAR PERFIL ===
export async function updateProfileAction(formData: FormData): Promise<ProfileResult> {
    const username = formData.get("username") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const email = formData.get("email") as string

    // Capturamos el archivo subido desde <input type="file" name="image" />
    const imageFile = formData.get("image") as File | null

    const currentPassword = formData.get("currentPassword") as string
    const newPassword = formData.get("newPassword") as string

    if (!username) {
        return { success: false, error: "El nombre de usuario no puede estar vacío." }
    }

    try {
        const cookieStore = await cookies()
        const rawToken = cookieStore.get("session_token")?.value

        if (!rawToken) {
            return { success: false, error: "No autorizado. Sesión inválida o expirada." }
        }

        const userId = rawToken.replace("%3A", ":").split(":")[0]

        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            return { success: false, error: "Usuario no encontrado." }
        }

        const existingUser = await prisma.user.findUnique({
            where: { username: username.trim() }
        })

        if (existingUser && existingUser.id !== userId) {
            return { success: false, error: "Este nombre de usuario ya está en uso." }
        }

        // 1. PROCESAMIENTO DE LA IMAGEN
        let uploadedImagePath: string | null = null

        if (imageFile && imageFile.size > 0) {
            // Límite de tamaño: 5 MB
            const MAX_FILE_SIZE = 5 * 1024 * 1024
            if (imageFile.size > MAX_FILE_SIZE) {
                return { success: false, error: "La imagen es demasiado grande. El límite permitido es de 5 MB." }
            }

            // Validar que sea un formato de imagen válido
            if (!imageFile.type.startsWith("image/")) {
                return { success: false, error: "El archivo seleccionado debe ser una imagen." }
            }

            const bytes = await imageFile.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Creamos la carpeta public/uploads si aún no existe
            const uploadDir = path.join(process.cwd(), "public", "uploads")
            await mkdir(uploadDir, { recursive: true })

            // Generamos un nombre único para evitar colisiones
            const fileExtension = imageFile.name.split(".").pop() || "png"
            const fileName = `avatar-${userId}-${Date.now()}.${fileExtension}`
            const filePath = path.join(uploadDir, fileName)

            // Guardamos el archivo en el sistema de archivos local
            await writeFile(filePath, buffer)

            // Ruta pública que guardaremos en la base de datos
            uploadedImagePath = `/uploads/${fileName}`
        }

        // 2. ARMADO DEL OBJETO DE ACTUALIZACIÓN
        const dataToUpdate: any = {
            username: username.trim(),
            firstName: firstName ? firstName.trim() : null,
            lastName: lastName ? lastName.trim() : null,
            phoneNumber: phoneNumber ? phoneNumber.trim() : null,
            email: email ? email.trim() : null,
        }

        // Solo actualizamos profilePicture si se subió un nuevo archivo válido
        if (uploadedImagePath) {
            dataToUpdate.profilePicture = uploadedImagePath
        }

        // 3. CAMBIO DE CONTRASEÑA (OPCIONAL)
        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword || currentPassword.trim() === "") {
                return { success: false, error: "Para cambiar la contraseña, debés ingresar tu contraseña actual." }
            }

            if (user.password !== currentPassword) {
                return { success: false, error: "La contraseña actual es incorrecta." }
            }

            dataToUpdate.password = newPassword.trim()
        }

        await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate
        })

        return { success: true }

    } catch (error) {
        console.error("❌ Error al actualizar el perfil:", error)
        return { success: false, error: "Error en el servidor al guardar los cambios." }
    }
}

export async function requestPasswordResetAction(email: string) {
    if (!email || !email.includes("@")) {
        return { success: false, error: "Ingresá un correo electrónico válido." }
    }

    try {
        const cleanEmail = email.toLowerCase().trim()
        const user = await prisma.user.findFirst({ where: { email: cleanEmail } })

        if (!user) {
            return { success: true, message: "Si el correo está registrado, recibirás un enlace de recuperación." }
        }

        const resetToken = crypto.randomBytes(32).toString("hex")
        const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60)

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry }
        })

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`

        await sendResetPasswordEmail(cleanEmail, resetLink)

        return { success: true, message: "Si el correo está registrado, recibirás un enlace de recuperación." }
    } catch (error) {
        console.error("Error en requestPasswordResetAction:", error)
        return { success: false, error: "Ocurrió un problema en el servidor. Intentá de nuevo." }
    }
}

export async function resetPasswordAction(token: string, newPassword: string) {
    if (!token || !newPassword || newPassword.trim().length < 6) {
        return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres." }
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gte: new Date() }
            }
        })

        if (!user) {
            return { success: false, error: "El enlace es inválido o ya expiró. Solicitá uno nuevo." }
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: newPassword.trim(),
                resetToken: null,
                resetTokenExpiry: null
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Error en resetPasswordAction:", error)
        return { success: false, error: "Ocurrió un error al restablecer la contraseña." }
    }
}