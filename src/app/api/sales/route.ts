import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/mail"

// ==========================================
// GET: Listar todas las ventas con sus relaciones
// ==========================================
export async function GET() {
    try {
        const sales = await prisma.sale.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
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
            { error: "Ocurrió un error al consultar las ventas" },
            { status: 500 }
        )
    }
}

// ==========================================
// POST: Venta Inteligente (Auto-creación de cliente + Venta + Repuestos)
// ==========================================
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, productId, firstName, lastName, phoneNumber, createdAt } = body

        // Validaciones básicas
        if (!email || !productId) {
            return NextResponse.json(
                { error: "El email del cliente y el ID del producto son obligatorios." },
                { status: 400 }
            )
        }

        // Ejecutamos todo dentro de una transacción atómica de Prisma
        const result = await prisma.$transaction(async (tx) => {
            const cleanEmail = email.trim().toLowerCase()

            // 1. Buscar si el cliente ya existe por Email
            let user = await tx.user.findUnique({
                where: { email: cleanEmail },
            })

            let generatedCredentials = null
            let isNewUser = false

            // 2. Si NO existe el usuario, lo autogeneramos
            if (!user) {
                isNewUser = true

                // Generar username y password expresamente para la cuenta rápida
                const emailPrefix = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")
                const randomSuffix = Math.floor(1000 + Math.random() * 9000)
                const generatedUsername = `${emailPrefix}_${randomSuffix}`
                const generatedPassword = `brief${Math.floor(100000 + Math.random() * 900000)}`

                user = await tx.user.create({
                    data: {
                        email: cleanEmail,
                        username: generatedUsername,
                        password: generatedPassword, // En producción se recomienda hashear
                        role: "CLIENT",
                        firstName: firstName?.trim() || emailPrefix,
                        lastName: lastName?.trim() || "Cliente",
                        phoneNumber: phoneNumber?.trim() || null,
                    },
                })

                generatedCredentials = {
                    username: generatedUsername,
                    password: generatedPassword,
                }
            }

            // 3. Verificar que el producto exista
            const product = await tx.product.findUnique({
                where: { id: productId },
            })

            if (!product) {
                throw new Error("El producto seleccionado no existe en el catálogo.")
            }

            // 4. Crear el registro de la Venta (Sale)
            const sale = await tx.sale.create({
                data: {
                    userId: user.id,
                    productId: product.id,
                    createdAt: createdAt ? new Date(createdAt) : new Date(),
                },
            })

            // 5. Instanciar automáticamente los repuestos en seguimiento si el producto los tiene
            let createdSpares = []
            if (product.spareParts) {
                try {
                    const sparesConfig = typeof product.spareParts === "string"
                        ? JSON.parse(product.spareParts)
                        : product.spareParts

                    if (Array.isArray(sparesConfig) && sparesConfig.length > 0) {
                        const sparesToCreate = sparesConfig.map((sp: { productId?: string; name?: string; lifespanDays?: number }) => ({
                            saleId: sale.id,
                            name: sp.name || "Repuesto Integrado",
                            spareProductId: sp.productId || null,
                            lifespanDays: Number(sp.lifespanDays) || 180,
                            installedAt: new Date(), // Comienza hoy al 100%
                        }))

                        await tx.trackedSparePart.createMany({
                            data: sparesToCreate,
                        })
                    }
                } catch (jsonErr) {
                    console.error("Error al parsear spareParts JSON:", jsonErr)
                }
            }

            // 6. Obtener la venta completa recién creada para la respuesta
            const fullSale = await tx.sale.findUnique({
                where: { id: sale.id },
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

            return {
                sale: fullSale,
                isNewUser,
                generatedCredentials,
                // Agregamos el email original al resultado para usarlo fuera de la transacción
                email: cleanEmail
            }
        })
        // 👈 NUEVO: Una vez que la transacción terminó bien, si era usuario nuevo, mandamos el mail
        if (result.isNewUser && result.generatedCredentials) {
            sendWelcomeEmail(
                result.email,
                result.generatedCredentials.username,
                result.generatedCredentials.password
            ).catch(err =>
                console.error("Error asíncrono mandando mail de auto-creación:", err)
            )
        }

        return NextResponse.json(
            {
                message: result.isNewUser
                    ? "Venta registrada y nuevo cliente creado con éxito."
                    : "Venta registrada para el cliente existente.",
                ...result,
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error("Error en POST /api/sales:", error)
        return NextResponse.json(
            { error: error.message || "Error al procesar la venta inteligente" },
            { status: 500 }
        )
    }
}