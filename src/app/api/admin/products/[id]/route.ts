// src/app/api/admin/products/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveUploadedFile } from "@/lib/upload"

interface RouteParams {
    params: Promise<{ id: string }> | { id: string }
}

// PUT: Actualizar un producto o repuesto específico
export async function PUT(request: Request, context: RouteParams) {
    try {
        const params = await context.params
        const id = params.id

        const formData = await request.formData()
        const brand = formData.get("brand") as string
        const name = formData.get("name") as string
        const details = formData.get("details") as string
        const spareParts = formData.get("spareParts") as string | null
        const warrantyDaysStr = formData.get("warrantyDays") as string

        // Nuevos campos
        const isSpare = formData.get("isSpare") === "true"
        const defaultLifespanStr = formData.get("defaultLifespanDays") as string

        if (!name || !details) {
            return NextResponse.json({ error: "Nombre y detalles son requeridos" }, { status: 400 })
        }

        const warrantyDays = parseInt(warrantyDaysStr, 10)
        const defaultLifespanDays = parseInt(defaultLifespanStr, 10) || 180

        const imageFile = formData.get("image") as File | null
        let photosArray: string[] | undefined = undefined

        if (imageFile && imageFile.size > 0) {
            const productImageUrl = await saveUploadedFile(imageFile, "uploads/products")
            photosArray = [productImageUrl]
        }

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                brand: brand.trim(),
                name: name.trim(),
                details: details.trim(),
                spareParts: isSpare ? null : (spareParts ? spareParts.trim() : null),
                warrantyDays,
                isSpare,
                defaultLifespanDays,
                ...(photosArray && { photos: photosArray })
            }
        })

        return NextResponse.json(updatedProduct)
    } catch (error) {
        console.error("Error al editar producto:", error)
        return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 })
    }
}