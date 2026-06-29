"use server"

import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { cookies } from "next/headers"

export interface LoginResult {
    success: boolean
    error?: string
    role?: "ADMIN" | "CLIENT"
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    // 1. Validación básica de campos vacíos
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

        // ¡ÉXITO! Guardamos la sesión en una Cookie segura del navegador
        // Formato provisorio simple: "id_del_usuario:ROL"
        const cookieStore = await cookies()
        cookieStore.set("session_token", `${user.id}:${user.role}`, {
            httpOnly: true,         // Impide que scripts maliciosos de JS lean la cookie
            secure: process.env.NODE_ENV === "production", // Solo viaja por HTTPS en producción
            maxAge: 60 * 60 * 24 * 7, // La sesión dura 7 días guardada
            path: "/",              // Válida para toda la aplicación
        })
        return {
            success: true,
            role: user.role, // Esto va a ser 'ADMIN' o 'CLIENT'
        }

    } catch (error) {
        console.error("Error en el proceso de login:", error)
        return { success: false, error: "Hubo un problema en el servidor. Intentá de nuevo." }
    }
}