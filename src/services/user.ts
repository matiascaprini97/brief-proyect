import { prisma } from '@/lib/prisma'

export const UserService = {
    /**
     * Crea un nuevo cliente en la base de datos.
     * Se usará cuando el administrador registre una nueva cama de Pilates.
     */
    async createClient(email: string, name: string) {
        try {
            // 1. Verificamos si el usuario ya existe para no duplicarlo
            const existingUser = await prisma.user.findUnique({
                where: { email }
            })

            if (existingUser) {
                return { success: false, error: 'El correo electrónico ya está registrado.' }
            }

            // 2. Si no existe, lo creamos con el rol por defecto (USER)
            const newUser = await prisma.user.create({
                data: {
                    email,
                    name,
                    role: 'USER', // Aseguramos que sea rol cliente
                }
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
            where: { role: 'USER' },
            orderBy: { createdAt: 'desc' }
        })
    }
}