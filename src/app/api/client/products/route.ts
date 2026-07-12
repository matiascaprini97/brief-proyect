import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const cookieStore = await cookies();
        // 1. Buscamos la cookie real session_token
        const rawToken = cookieStore.get("session_token")?.value;

        if (!rawToken) {
            console.log("⚠️ [API] No se encontró la cookie session_token");
            return NextResponse.json({ error: "No autorizado. No hay token." }, { status: 401 });
        }

        // 2. Decodificamos el %3A para transformarlo en un ":" limpio
        const decodedToken = decodeURIComponent(rawToken);

        // 3. Cortamos el texto en los dos puntos y nos quedamos con el ID puro
        const currentUserId = decodedToken.split(":")[0];

        if (!currentUserId) {
            console.log("⚠️ [API] Estructura de token inválida");
            return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        console.log(`📡 [API] Buscando productos dinámicamente para el userId: ${currentUserId}`);

        // 4. Vamos a la tabla Sale e incluimos tanto el producto base como sus repuestos específicos
        const userSales = await prisma.sale.findMany({
            where: {
                userId: currentUserId
            },
            include: {
                product: true,
                trackedSpareParts: true, // 👈 NUEVO: Traemos los repuestos bajo monitoreo de esta venta
            },
            orderBy: {
                createdAt: "desc" // Opcional: Prioriza mostrar primero las compras más recientes
            }
        });

        console.log(`📊 [API] Compras encontradas para este usuario: ${userSales.length}`);

        // Si no tiene compras, devolvemos un array vacío [] para que el front maneje el estado vacío
        if (!userSales || userSales.length === 0) {
            return NextResponse.json([]);
        }

        // 5. NUEVO MAPEO: Construimos un objeto híbrido chato (Producto + Metadata de Venta + Repuestos)
        const formattedProducts = userSales.map((sale) => ({
            id: sale.product.id,
            saleId: sale.id,
            saleCreatedAt: sale.createdAt, // 👈 Clave para calcular dinámicamente los días de garantía restantes
            brand: sale.product.brand,
            name: sale.product.name,
            details: sale.product.details,
            spareParts: sale.product.spareParts,
            warrantyDays: sale.product.warrantyDays, // 👈 Tu nueva columna de garantía
            photos: sale.product.photos,
            trackedSpareParts: sale.trackedSpareParts, // 👈 Array con las fechas de instalación de cada resorte/parte
        }));

        return NextResponse.json(formattedProducts);

    } catch (error) {
        console.error("❌ [API] Error crítico en el backend:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}