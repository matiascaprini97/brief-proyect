import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
    params: Promise<{ id: string }>
}

// ==========================================
// PUT: Actualizar una venta existente
// ==========================================
export async function PUT(req: Request, { params }: Params) {
    try {
        const { id } = await params
        const body = await req.json()
        const { createdAt, productId, userId } = body

        // Verificar existencia
        const existingSale = await prisma.sale.findUnique({
            where: { id },
        })

        if (!existingSale) {
            return NextResponse.json(
                { error: "La venta solicitada no existe." },
                { status: 404 }
            )
        }

        // Actualizar los datos de la venta
        const updatedSale = await prisma.sale.update({
            where: { id },
            data: {
                ...(createdAt && { createdAt: new Date(createdAt) }),
                ...(productId && { productId }),
                ...(userId && { userId }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                product: true,
                trackedSpareParts: true,
            },
        })

        return NextResponse.json(updatedSale)
    } catch (error: any) {
        console.error("Error al actualizar la venta:", error)
        return NextResponse.json(
            { error: "Ocurrió un error al intentar actualizar la venta." },
            { status: 500 }
        )
    }
}

// ==========================================
// DELETE: Eliminar una venta y sus repuestos
// ==========================================
export async function DELETE(req: Request, { params }: Params) {
    try {
        const { id } = await params

        const existingSale = await prisma.sale.findUnique({
            where: { id },
        })

        if (!existingSale) {
            return NextResponse.json(
                { error: "La venta no fue encontrada." },
                { status: 404 }
            )
        }

        // Eliminación limpia usando transacción
        await prisma.$transaction([
            // 1. Borramos las barras de seguimiento asociadas a esta venta
            prisma.trackedSparePart.deleteMany({
                where: { saleId: id },
            }),
            // 2. Borramos la venta
            prisma.sale.delete({
                where: { id },
            }),
        ])

        return NextResponse.json({
            message: "Venta y sus componentes en seguimiento eliminados correctamente.",
        })
    } catch (error: any) {
        console.error("Error al eliminar la venta:", error)
        return NextResponse.json(
            { error: "Error al eliminar la transacción." },
            { status: 500 }
        )
    }
}