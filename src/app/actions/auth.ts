"use server"

import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export interface LoginResult {
    success: boolean
    error?: string
    role?: "ADMIN" | "CLIENT"
}

export interface ProfileResult {
    success: boolean
    error?: string
}

// === ACCIÓN: LOGIN (Tu código original intacto) ===
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

// === NUEVA ACCIÓN: CERRAR SESIÓN ===
export async function logoutAction() {
    const cookieStore = await cookies()
    // Borramos la cookie de la sesión por completo
    cookieStore.delete("session_token")
    // Redirigimos al usuario a la pantalla de login/home de forma segura en el servidor
    redirect("/")
}

// === NUEVA ACCIÓN: EDITAR PERFIL ===
export async function updateProfileAction(formData: FormData): Promise<ProfileResult> {
    const username = formData.get("username") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const phoneNumber = formData.get("phoneNumber") as string
    const email = formData.get("email") as string               // 👈 Agregado
    const profilePicture = formData.get("profilePicture") as string // 👈 Agregado

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

        // Armamos el objeto con los nombres exactos en inglés de tu BD
        const dataToUpdate: any = {
            username: username.trim(),
            firstName: firstName ? firstName.trim() : null,
            lastName: lastName ? lastName.trim() : null,
            phoneNumber: phoneNumber ? phoneNumber.trim() : null,
            email: email ? email.trim() : null,                   // 👈 Agregado
            profilePicture: profilePicture ? profilePicture.trim() : null, // 👈 Agregado
        }

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