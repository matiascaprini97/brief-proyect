import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export interface CreateClientDTO {
    email: string
    firstName?: string
    lastName?: string
    username?: string
    password?: string
}

export const UserService = {
    /**
     * Crea un nuevo cliente en la base de datos.
     */
    async createClient(data: CreateClientDTO) {
        try {
            const usernameToUse = data.username || data.email

            // 1. Verificamos si el email o el username ya existen
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: data.email },
                        { username: usernameToUse }
                    ]
                }
            })

            if (existingUser) {
                return {
                    success: false,
                    error: 'El correo electrónico o nombre de usuario ya está registrado.'
                }
            }

            // 2. Creamos el usuario con Role.CLIENT y los campos requeridos
            const newUser = await prisma.user.create({
                data: {
                    email: data.email,
                    username: usernameToUse, // Obligatorio en el schema (@unique)
                    password: data.password || 'contraseñaTemporaria123', // Obligatorio en el schema
                    firstName: data.firstName ?? null,
                    lastName: data.lastName ?? null,
                    role: Role.CLIENT, // 🟢 Enum exacto de tu schema
                },
            })

            return { success: true, user: newUser }
        } catch (error) {
            console.error('Error en UserService.createClient:', error)
            return { success: false, error: 'Error interno al crear el usuario.' }
        }
    },

    /**
     * Obtiene todos los usuarios que son clientes
     */
    async getAllClients() {
        return await prisma.user.findMany({
            where: { role: Role.CLIENT }, // 🟢 Role.CLIENT en lugar de USER
            orderBy: { createdAt: 'desc' }
        })
    }
}