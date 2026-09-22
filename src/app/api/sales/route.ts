import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { saveUploadedFile } from "@/lib/upload"
import { sendWelcomeEmail, sendPurchaseConfirmationEmail } from "@/lib/mail"

// GET: Obtener todas las ventas con sus relaciones
export async function GET() {
    try {
        const sales = await prisma.sale.findMany({
            include: {
                user: true,
                product: true,
                trackedSpareParts: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json(sales)
    } catch (error) {
        console.error("Error al obtener ventas:", error)
        return NextResponse.json(
            { error: "Error al obtener las ventas" },
            { status: 500 }
        )
    }
}

// POST: Registrar nueva(s) venta(s) con múltiples artículos y PDF de factura / garantía
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        const email = formData.get("email") as string
        const firstName = (formData.get("firstName") as string) || ""
        const lastName = (formData.get("lastName") as string) || ""
        const phoneNumber = (formData.get("phoneNumber") as string) || ""
        const itemsRaw = formData.get("items") as string

        // Archivos recibidos desde el formulario
        const invoiceFile = formData.get("invoice") as File | null
        const warrantyFile = formData.get("warranty") as File | null

        if (!email || !itemsRaw) {
            return NextResponse.json(
                { error: "El email del cliente y los artículos son requeridos" },
                { status: 400 }
            )
        }

        let items: { productId: string; quantity: number }[] = []
        try {
            items = JSON.parse(itemsRaw)
        } catch (e) {
            return NextResponse.json(
                { error: "El formato de los artículos no es válido" },
                { status: 400 }
            )
        }

        if (items.length === 0) {
            return NextResponse.json(
                { error: "Debes incluir al menos un artículo" },
                { status: 400 }
            )
        }

        // 1. Guardar la factura PDF si existe en Vercel Blob
        let invoiceUrl: string | null = null
        if (invoiceFile && invoiceFile.size > 0) {
            invoiceUrl = await saveUploadedFile(invoiceFile, "uploads/invoices")
        }

        // 2. Guardar el contrato de garantía PDF si existe en Vercel Blob
        let warrantyUrl: string | null = null
        if (warrantyFile && warrantyFile.size > 0) {
            warrantyUrl = await saveUploadedFile(warrantyFile, "uploads/warranties")
        }

        // 3. Buscar o crear usuario
        let user = await prisma.user.findUnique({ where: { email } })
        let generatedCredentials = null
        let isNewUser = false

        if (!user) {
            isNewUser = true
            const generatedPassword = Math.random().toString(36).slice(-8)
            const username = email.split("@")[0] + Math.floor(1000 + Math.random() * 9000)

            user = await prisma.user.create({
                data: {
                    email,
                    username,
                    password: generatedPassword,
                    firstName: firstName || null,
                    lastName: lastName || null,
                    phoneNumber: phoneNumber || null,
                    role: "CLIENT",
                },
            })

            generatedCredentials = {
                username: user.username,
                password: generatedPassword,
            }
        }

        // 4. Crear los registros de ventas
        const createdSales = []

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            })

            if (!product) continue

            let initialSpares: any[] = []
            if (product.spareParts) {
                try {
                    initialSpares = JSON.parse(product.spareParts)
                } catch (err) {
                    console.error("Error parseando repuestos:", err)
                }
            }

            const quantity = Math.max(1, item.quantity || 1)

            for (let i = 0; i < quantity; i++) {
                const sale = await prisma.sale.create({
                    data: {
                        userId: user.id,
                        productId: product.id,
                        invoiceUrl,
                        warrantyUrl,
                        trackedSpareParts: {
                            create: initialSpares.map((spare) => ({
                                name: spare.name,
                                lifespanDays: spare.lifespanDays || spare.defaultLifespanDays || 180,
                                spareProductId: spare.spareProductId || null,
                            })),
                        },
                    },
                    include: {
                        user: true,
                        product: true,
                        trackedSpareParts: true,
                    },
                })

                createdSales.push(sale)
            }
        }

        // 5. Mails
        if (user.email) {
            if (isNewUser && generatedCredentials) {
                await sendWelcomeEmail(user.email, generatedCredentials.username, generatedCredentials.password)
            }

            if (createdSales.length > 0) {
                const mainProduct = createdSales[0].product.name || "Equipo PHiiT"
                const productSummary = createdSales.length > 1
                    ? `${mainProduct} y otros ${createdSales.length - 1} artículo(s)`
                    : mainProduct

                await sendPurchaseConfirmationEmail(user.email, productSummary)
            }
        }

        return NextResponse.json(
            {
                message: "Venta(s) registrada(s) con éxito",
                sales: createdSales,
                isNewUser,
                generatedCredentials,
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error("Error al registrar la venta:", error)
        return NextResponse.json(
            { error: error.message || "Error interno al procesar la venta" },
            { status: 500 }
        )
    }
}