import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Helper para parsear de forma segura el JSON de repuestos
function parseSpareParts(sparePartsRaw: unknown) {
    if (!sparePartsRaw) return [];
    if (typeof sparePartsRaw === "string") {
        try {
            return JSON.parse(sparePartsRaw);
        } catch {
            // Si por alguna razón era un texto plano normal, lo devolvemos como string
            return sparePartsRaw;
        }
    }
    return sparePartsRaw;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const rawToken = cookieStore.get("session_token")?.value;

        if (!rawToken) {
            return NextResponse.json({ error: "No autorizado. No hay token." }, { status: 401 });
        }

        const decodedToken = decodeURIComponent(rawToken);
        const currentUserId = decodedToken.split(":")[0];

        if (!currentUserId) {
            return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        const userSales = await prisma.sale.findMany({
            where: {
                userId: currentUserId
            },
            include: {
                product: true,
                trackedSpareParts: true,
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        if (!userSales || userSales.length === 0) {
            return NextResponse.json([]);
        }

        const formattedProducts = userSales.map((sale) => ({
            id: sale.product.id,
            saleId: sale.id,
            saleCreatedAt: sale.createdAt,
            brand: sale.product.brand,
            name: sale.product.name,
            details: sale.product.details,
            spareParts: parseSpareParts(sale.product.spareParts),
            warrantyDays: sale.product.warrantyDays,
            photos: sale.product.photos,
            trackedSpareParts: sale.trackedSpareParts,
            invoiceUrl: sale.invoiceUrl ?? null, // 🟢 MAPEADO DE LA FACTURA DESDE SALE
        }));

        return NextResponse.json(formattedProducts);

    } catch (error) {
        console.error("❌ [API] Error crítico en el backend:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}