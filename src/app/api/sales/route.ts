import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

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

// POST: Registrar nueva(s) venta(s) con múltiples artículos y PDF de factura opcional
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()

        const email = formData.get("email") as string
        const firstName = (formData.get("firstName") as string) || ""
        const lastName = (formData.get("lastName") as string) || ""
        const phoneNumber = (formData.get("phoneNumber") as string) || ""
        const itemsRaw = formData.get("items") as string // Recibe JSON de productos: [{ productId, quantity }]
        const invoiceFile = formData.get("invoice") as File | null

        // Validación básica
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

        // 1. Guardar la factura PDF en el sistema de archivos si se proporcionó
        let invoiceUrl: string | null = null

        if (invoiceFile && invoiceFile.size > 0) {
            const bytes = await invoiceFile.arrayBuffer()
            const buffer = Buffer.from(bytes)

            // Generar nombre de archivo único
            const timestamp = Date.now()
            const cleanFileName = invoiceFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")
            const fileName = `${timestamp}-${cleanFileName}`

            // Definir directorio de subida en /public
            const uploadDir = path.join(process.cwd(), "public", "uploads", "invoices")

            // Crear carpeta si no existe y escribir archivo
            await mkdir(uploadDir, { recursive: true })
            await writeFile(path.join(uploadDir, fileName), buffer)

            // Ruta pública accesible vía web
            invoiceUrl = `/uploads/invoices/${fileName}`
        }

        // 2. Buscar si el usuario ya existe o crearlo si es nuevo
        let user = await prisma.user.findUnique({
            where: { email },
        })

        let generatedCredentials = null
        let isNewUser = false

        if (!user) {
            isNewUser = true
            // Generar contraseña temporal de 8 caracteres
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

        // 3. Recorrer los artículos y crear las ventas con sus respectivos repuestos
        const createdSales = []

        for (const item of items) {
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            })

            if (!product) continue

            // Parsear repuestos asociados si los tiene guardados en JSON
            let initialSpares: { name: string; defaultLifespanDays?: number; lifespanDays?: number; spareProductId?: string }[] = []
            if (product.spareParts) {
                try {
                    initialSpares = JSON.parse(product.spareParts)
                } catch (err) {
                    console.error("Error parseando repuestos del producto:", err)
                }
            }

            const quantity = Math.max(1, item.quantity || 1)

            // Crear un registro Sale por cada unidad seleccionada
            for (let i = 0; i < quantity; i++) {
                const sale = await prisma.sale.create({
                    data: {
                        userId: user.id,
                        productId: product.id,
                        invoiceUrl,
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
            { error: error.message || "Ocurrió un error interno al procesar la venta" },
            { status: 500 }
        )
    }
}