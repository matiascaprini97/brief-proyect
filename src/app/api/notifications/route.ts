import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Helper interno para obtener el ID de usuario desde la cookie
async function getAuthenticatedUserId() {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("session_token")?.value;
    if (!rawToken) return null;

    const decodedToken = decodeURIComponent(rawToken);
    return decodedToken.split(":")[0] || null;
}

// GET: Obtener notificaciones del usuario logueado
export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 20, // Limitamos a las últimas 20 para el desplegable
        });

        const unreadCount = await prisma.notification.count({
            where: { userId, isRead: false },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("❌ [API Notifications GET]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// PATCH: Marcar como leída (una específica o todas)
export async function PATCH(req: Request) {
    try {
        const userId = await getAuthenticatedUserId();
        if (!userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { notificationId, markAllAsRead } = await req.json();

        if (markAllAsRead) {
            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true },
            });
            return NextResponse.json({ message: "Todas marcadas como leídas" });
        }

        if (notificationId) {
            await prisma.notification.update({
                where: { id: notificationId, userId },
                data: { isRead: true },
            });
            return NextResponse.json({ message: "Notificación marcada como leída" });
        }

        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    } catch (error) {
        console.error("❌ [API Notifications PATCH]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}