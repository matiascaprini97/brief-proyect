import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveUploadedFile } from "@/lib/upload"

// GET: Obtener un único usuario por ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const user = await prisma.user.findUnique({
            where: { id },
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
        })

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Error al obtener usuario único:", error)
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    }
}

// PUT: Editar usuario (Soporta FormData)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const formData = await request.formData()

        const username = formData.get("username") as string | null
        const firstName = formData.get("firstName") as string | null
        const lastName = formData.get("lastName") as string | null
        const email = formData.get("email") as string | null
        const phoneNumber = formData.get("phoneNumber") as string | null
        const role = formData.get("role") as "CLIENT" | "ADMIN" | null
        const imageFile = formData.get("image") as File | null

        const userExists = await prisma.user.findUnique({ where: { id } })
        if (!userExists) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        let profilePictureUrl: string | null = null
        if (imageFile && imageFile.size > 0) {
            profilePictureUrl = await saveUploadedFile(imageFile, "uploads/profiles")
        }

        const updateData: any = {}
        if (username) updateData.username = username
        if (firstName !== null) updateData.firstName = firstName
        if (lastName !== null) updateData.lastName = lastName
        if (email) updateData.email = email
        if (phoneNumber !== null) updateData.phoneNumber = phoneNumber
        if (role) updateData.role = role
        if (profilePictureUrl) updateData.profilePicture = profilePictureUrl

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                profilePicture: true,
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error("Error al editar usuario único:", error)
        return NextResponse.json({ error: "Error al actualizar el usuario" }, { status: 500 })
    }
}

// DELETE: Eliminar un único usuario
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const userExists = await prisma.user.findUnique({ where: { id } })
        if (!userExists) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
        }

        await prisma.user.delete({
            where: { id },
        })

        return NextResponse.json({ message: "Usuario eliminado correctamente" })
    } catch (error) {
        console.error("Error al eliminar usuario único:", error)
        return NextResponse.json({ error: "Error interno al eliminar usuario" }, { status: 500 })
    }
}