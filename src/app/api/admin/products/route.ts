import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Ajusta la ruta a tu cliente de Prisma
import { saveUploadedFile } from "@/lib/upload"

// 1. GET: Obtener todos los productos del catálogo
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(products)
    } catch (error) {
        console.error("Error al obtener productos:", error)
        return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 })
    }
}

// 2. POST: Crear un nuevo producto o repuesto
export async function POST(request: Request) {
    try {
        const formData = await request.formData()

        const brand = (formData.get("brand") as string) || "Brief"
        const name = formData.get("name") as string
        const details = (formData.get("details") as string) || ""
        const spareParts = formData.get("spareParts") as string | null

        const warrantyDaysInput = formData.get("warrantyDays") as string
        const warrantyDays = warrantyDaysInput ? parseInt(warrantyDaysInput, 10) : 365

        // Parseo de los nuevos campos de clasificación
        const isSpare = formData.get("isSpare") === "true"
        const defaultLifespanInput = formData.get("defaultLifespanDays") as string
        const defaultLifespanDays = defaultLifespanInput ? parseInt(defaultLifespanInput, 10) : 180

        if (!name || !details) {
            return NextResponse.json(
                { error: "El nombre y los detalles descriptivos son requeridos" },
                { status: 400 }
            )
        }

        const imageFile = formData.get("image") as File | null
        let imageUrl: string | null = null

        if (imageFile && imageFile.size > 0) {
            imageUrl = await saveUploadedFile(imageFile, "uploads/products")
        }

        const photosArray = imageUrl ? [imageUrl] : ["/uploads/products/placeholder.png"]

        const newProduct = await prisma.product.create({
            data: {
                brand,
                name,
                details,
                photos: photosArray,
                // Si es un repuesto, no debería tener repuestos asociados (guardamos null)
                spareParts: isSpare ? null : (spareParts || null),
                warrantyDays,
                isSpare,
                defaultLifespanDays,
            },
        })

        return NextResponse.json(newProduct, { status: 201 })
    } catch (error) {
        console.error("Error al crear producto:", error)
        return NextResponse.json({ error: "Error interno al crear producto" }, { status: 500 })
    }
}

// 3. DELETE: Borrado masivo de productos (Bulk Delete)
export async function DELETE(request: Request) {
    try {
        const { ids } = await request.json() // Espera un body { ids: ["id1", "id2", ...] }

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "Se requiere un array de IDs" }, { status: 400 })
        }

        const deleted = await prisma.product.deleteMany({
            where: {
                id: {
                    in: ids,
                },
            },
        })

        return NextResponse.json({
            message: `${deleted.count} productos eliminados correctamente`,
            count: deleted.count,
        })
    } catch (error) {
        console.error("Error al eliminar productos:", error)
        return NextResponse.json({ error: "Error al realizar borrado masivo" }, { status: 500 })
    }
}