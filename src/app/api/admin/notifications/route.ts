import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

// GET: Historial de notificaciones enviadas + listado de usuarios para selector
export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
        }

        const [notifications, users] = await Promise.all([
            prisma.notification.findMany({
                orderBy: { createdAt: "desc" },
                take: 50,
                include: {
                    user: {
                        select: { firstName: true, lastName: true, username: true, email: true }
                    }
                }
            }),
            prisma.user.findMany({
                orderBy: [{ firstName: "asc" }, { lastName: "asc" }, { username: "asc" }],
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    role: true,
                }
            })
        ]);

        return NextResponse.json({ notifications, users });
    } catch (error) {
        console.error("❌ [API Admin Notifications GET]:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

// POST: Crear y enviar notificaciones (con soporte opcional de envío por Email)
export async function POST(req: Request) {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
        }

        const body = await req.json();
        const { target, targetUserId, title, message, link, type, sendEmail } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Título y mensaje son obligatorios" }, { status: 400 });
        }

        let targetUsers: { id: string; email: string | null }[] = [];

        if (target === "USER") {
            if (!targetUserId) {
                return NextResponse.json({ error: "Debes seleccionar un usuario" }, { status: 400 });
            }
            const foundUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { id: true, email: true }
            });
            if (!foundUser) {
                return NextResponse.json({ error: "El usuario seleccionado no existe" }, { status: 404 });
            }
            targetUsers = [foundUser];
        } else if (target === "CLIENTS") {
            targetUsers = await prisma.user.findMany({ where: { role: "CLIENT" }, select: { id: true, email: true } });
        } else if (target === "ADMINS") {
            targetUsers = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
        } else if (target === "ALL") {
            targetUsers = await prisma.user.findMany({ select: { id: true, email: true } });
        } else {
            return NextResponse.json({ error: "Objetivo inválido" }, { status: 400 });
        }

        if (targetUsers.length === 0) {
            return NextResponse.json({ message: "No se encontraron destinatarios." });
        }

        // 1. Crear las notificaciones internas en base de datos
        const notificationsData = targetUsers.map((u) => ({
            userId: u.id,
            title,
            message,
            link: link || null,
            type: type || "INFO",
        }));

        const result = await prisma.notification.createMany({ data: notificationsData });

        // 2. Si el admin tildó la opción de enviar por email, disparamos Resend con diagnóstico
        if (sendEmail) {
            if (!process.env.RESEND_API_KEY) {
                console.warn("⚠️ [Resend]: Falta RESEND_API_KEY en las variables de entorno.");
            } else {
                const recipientsWithEmail = targetUsers.filter((u) => Boolean(u.email));
                console.log(`📧 [Resend]: Intentando enviar a ${recipientsWithEmail.length} destinatario(s)...`);

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://phiit-equipments.com";
                const fromAddress = process.env.RESEND_FROM_EMAIL || "PHIIT Equipments <onboarding@resend.dev>";

                const results = await Promise.allSettled(
                    recipientsWithEmail.map(async (u) => {
                        const fullLink = link
                            ? (link.startsWith("http") ? link : `${appUrl}${link.startsWith("/") ? link : `/${link}`}`)
                            : appUrl;

                        const { data, error } = await resend.emails.send({
                            from: fromAddress,
                            to: u.email!,
                            subject: `[PHIIT] ${title}`,
                            html: `
                                <div style="background-color: #09090b; color: #ffffff; padding: 30px; font-family: sans-serif; border-radius: 12px;">
                                    <h2 style="color: #a3e635; text-transform: uppercase; font-size: 18px; margin-bottom: 15px;">${title}</h2>
                                    <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                                    ${link ? `<div style="margin-top: 25px;"><a href="${fullLink}" style="background-color: #a3e635; color: #000000; padding: 10px 20px; font-weight: bold; text-decoration: none; border-radius: 8px; font-size: 12px; display: inline-block; text-transform: uppercase;">Ver Detalle en la App</a></div>` : ''}
                                    <hr style="border: none; border-top: 1px solid #27272a; margin: 30px 0;" />
                                    <p style="color: #71717a; font-size: 11px;">PHIIT Equipments - Plataforma de Gestión Técnica</p>
                                </div>
                            `,
                        });

                        if (error) {
                            console.error(`❌ [Resend] Error enviando a ${u.email}:`, error);
                            return { email: u.email, ok: false, error };
                        }

                        console.log(`✅ [Resend] Enviado a ${u.email} (id: ${data?.id})`);
                        return { email: u.email, ok: true, id: data?.id };
                    })
                );

                console.log("📊 [Resend] Resumen de envíos:", results);
            }
        }

        return NextResponse.json({
            message: `Notificación enviada a ${result.count} usuario(s)${sendEmail ? " y correos encolados" : ""}.`,
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