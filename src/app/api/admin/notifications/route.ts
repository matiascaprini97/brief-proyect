import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function verifyAdmin() {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("session_token")?.value;
    if (!rawToken) return null;

    const decodedToken = decodeURIComponent(rawToken);
    const userId = decodedToken.split(":")[0];
    if (!userId) return null;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") return null;
    return user;
}

// GET: Historial de notificaciones enviadas para la vista Admin
export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
        }

        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: "desc" },
            take: 50,
            include: {
                user: {
                    select: { username: true, email: true }
                }
            }
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error("❌ [API Admin Notifications GET]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// POST: Crear y enviar notificaciones
export async function POST(req: Request) {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
        }

        const body = await req.json();
        const { target, targetUserId, title, message, link, type } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Título y mensaje son obligatorios" }, { status: 400 });
        }

        if (target === "USER" && targetUserId) {
            const notification = await prisma.notification.create({
                data: {
                    userId: targetUserId,
                    title,
                    message,
                    link: link || null,
                    type: type || "INFO",
                },
            });
            return NextResponse.json({ message: "Notificación enviada con éxito", count: 1, notification });
        }

        let targetUserIds: { id: string }[] = [];

        if (target === "CLIENTS") {
            targetUserIds = await prisma.user.findMany({ where: { role: "CLIENT" }, select: { id: true } });
        } else if (target === "ADMINS") {
            targetUserIds = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
        } else if (target === "ALL") {
            targetUserIds = await prisma.user.findMany({ select: { id: true } });
        } else {
            return NextResponse.json({ error: "Objetivo inválido" }, { status: 400 });
        }

        if (targetUserIds.length === 0) {
            return NextResponse.json({ message: "No se encontraron destinatarios." });
        }

        const notificationsData = targetUserIds.map((u) => ({
            userId: u.id,
            title,
            message,
            link: link || null,
            type: type || "INFO",
        }));

        const result = await prisma.notification.createMany({ data: notificationsData });

        return NextResponse.json({
            message: `Notificación enviada a ${result.count} usuario(s).`,
            count: result.count,
        });
    } catch (error) {
        console.error("❌ [API Admin Notifications POST]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// DELETE: Eliminar notificación enviada
export async function DELETE(req: Request) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const notificationId = searchParams.get("id");

        if (!notificationId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

        await prisma.notification.delete({ where: { id: notificationId } });

        return NextResponse.json({ message: "Notificación eliminada" });
    } catch (error) {
        console.error("❌ [API Admin Notifications DELETE]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}