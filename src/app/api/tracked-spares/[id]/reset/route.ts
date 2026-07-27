import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface Params {
    params: Promise<{ id: string }>
}

// ==========================================
// POST / PATCH: Resetear repuesto al 100% de vida útil
// ==========================================
export async function POST(req: Request, { params }: Params) {
    try {
        const { id } = await params

        // 1. Verificar existencia del repuesto en seguimiento
        const existingPart = await prisma.trackedSparePart.findUnique({
            where: { id },
        })

        if (!existingPart) {
            return NextResponse.json(
                { error: "El repuesto en seguimiento no fue encontrado." },
                { status: 404 }
            )
        }

        // 2. Resetear fecha de instalación al momento actual
        const updatedPart = await prisma.trackedSparePart.update({
            where: { id },
            data: {
                installedAt: new Date(),
            },
        })

        return NextResponse.json({
            message: "Repuesto repuesto/reseteado exitosamente al 100%.",
            trackedSparePart: updatedPart,
        })
    } catch (error: any) {
        console.error("Error al resetear repuesto:", error)
        return NextResponse.json(
            { error: "Ocurrió un error al intentar resetear el estado del repuesto." },
            { status: 500 }
        )
    }
}

// Permitir también el método PATCH por estándar REST
export async function PATCH(req: Request, context: Params) {
    return POST(req, context)
}