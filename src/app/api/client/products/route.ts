import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const cookieStore = await cookies();
        // 1. Buscamos la cookie real que encontraste: session_token
        const rawToken = cookieStore.get("session_token")?.value;

        if (!rawToken) {
            console.log("⚠️ [API] No se encontró la cookie session_token");
            return NextResponse.json({ error: "No autorizado. No hay token." }, { status: 401 });
        }

        // 2. Decodificamos el %3A para transformarlo en un ":" limpio
        // Esto convierte "4f2799b6...%3ACLIENT" en "4f2799b6...:CLIENT"
        const decodedToken = decodeURIComponent(rawToken);

        // 3. Cortamos el texto en los dos puntos y nos quedamos con el primer elemento (el ID puro)
        const currentUserId = decodedToken.split(":")[0];

        if (!currentUserId) {
            console.log("⚠️ [API] Estructura de token inválida");
            return NextResponse.json({ error: "Token inválido" }, { status: 400 });
        }

        console.log(`📡 [API] Buscando productos dinámicamente para el userId: ${currentUserId}`);

        // 4. Vamos a la tabla Sale filtrando por el ID real del usuario logueado
        const userSales = await prisma.sale.findMany({
            where: {
                userId: currentUserId
            },
            include: {
                product: true,
            },
        });

        console.log(`📊 [API] Productos encontrados para este usuario: ${userSales.length}`);

        // Si no tiene compras, devolvemos un array vacío [] con estado 200 para que el front no rompa
        if (!userSales || userSales.length === 0) {
            return NextResponse.json([]);
        }

        // Mapeamos para mandar solo los productos limpios al cliente
        const realProducts = userSales.map((sale) => sale.product);

        return NextResponse.json(realProducts);

    } catch (error) {
        console.error("❌ [API] Error crítico en el backend:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}