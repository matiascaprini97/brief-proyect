"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AdminNotification {
    id: string
    title: string
    message: string
    type: string
    createdAt: string
    user: {
        username: string
        email: string
    }
}

export default function AdminNotificationsPage() {
    const router = useRouter()
    const [target, setTarget] = useState<"CLIENTS" | "ADMINS" | "ALL" | "USER">("CLIENTS")
    const [targetUserId, setTargetUserId] = useState("")
    const [title, setTitle] = useState("")
    const [message, setMessage] = useState("")
    const [link, setLink] = useState("")
    const [type, setType] = useState<"INFO" | "SUCCESS" | "WARNING" | "SYSTEM">("INFO")

    const [loading, setLoading] = useState(false)
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [sentNotifications, setSentNotifications] = useState<AdminNotification[]>([])
    const [loadingHistory, setLoadingHistory] = useState(true)

    const fetchHistory = async () => {
        try {
            const res = await fetch("/api/admin/notifications")
            if (res.ok) {
                const data = await res.json()
                setSentNotifications(data.notifications || [])
            }
        } catch (error) {
            console.error("Error al cargar historial:", error)
        } finally {
            setLoadingHistory(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setFeedback(null)

        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    target,
                    targetUserId: target === "USER" ? targetUserId : undefined,
                    title,
                    message,
                    link: link || undefined,
                    type,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al enviar")

            setFeedback({ type: "success", text: `${data.message} Redirigiendo al inicio...` })

            // Redirigir al inicio de admin tras crear la notificación
            setTimeout(() => {
                router.push("/admin")
            }, 1200)

        } catch (err: any) {
            setFeedback({ type: "error", text: err.message || "Error al enviar la notificación" })
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que deseas eliminar esta notificación?")) return
        try {
            const res = await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" })
            if (res.ok) {
                setSentNotifications((prev) => prev.filter((n) => n.id !== id))
            }
        } catch (error) {
            console.error("Error al eliminar:", error)
        }
    }

    return (
        <div className="mx-auto max-w-5xl px-6 py-10 text-white space-y-12">

            {/* FORMULARIO DE ENVÍO */}
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 border-b border-white/10 pb-4">
                    <h1 className="text-2xl font-black uppercase tracking-wider text-white">
                        Crear <span className="text-lime-400">Notificación</span>
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                        Envía un nuevo aviso. Serás redirigido al panel principal al finalizar.
                    </p>
                </div>

                {feedback && (
                    <div className={`mb-6 rounded-xl border p-4 text-xs font-bold ${feedback.type === "success"
                            ? "border-lime-500/30 bg-lime-500/10 text-lime-400"
                            : "border-red-500/30 bg-red-500/10 text-red-400"
                        }`}>
                        {feedback.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-white/15 bg-black/60 p-6 backdrop-blur-xl shadow-2xl">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">Destinatarios</label>
                        <select
                            value={target}
                            onChange={(e: any) => setTarget(e.target.value)}
                            className="w-full rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3 text-sm text-white focus:border-lime-400 focus:outline-none"
                        >
                            <option value="CLIENTS">Todos los Clientes</option>
                            <option value="ADMINS">Todos los Administradores</option>
                            <option value="ALL">Todos los Usuarios (Global)</option>
                            <option value="USER">Usuario Específico (por ID)</option>
                        </select>
                    </div>

                    {target === "USER" && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">ID del Usuario</label>
                            <input
                                type="text"
                                required
                                placeholder="Ej: uuid-del-usuario"
                                value={targetUserId}
                                onChange={(e) => setTargetUserId(e.target.value)}
                                className="w-full rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3 text-sm text-white focus:border-lime-400 focus:outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">Tipo de Alerta</label>
                        <select
                            value={type}
                            onChange={(e: any) => setType(e.target.value)}
                            className="w-full rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3 text-sm text-white focus:border-lime-400 focus:outline-none"
                        >
                            <option value="INFO">Información</option>
                            <option value="SUCCESS">Éxito / Promoción</option>
                            <option value="WARNING">Advertencia / Mantenimiento</option>
                            <option value="SYSTEM">Sistema</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">Título</label>
                        <input
                            type="text"
                            required
                            placeholder="Ej: Mantenimiento Preventivo"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3 text-sm text-white focus:border-lime-400 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">Mensaje</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Escribe la notificación completa..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3 text-sm text-white focus:border-lime-400 focus:outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">Enlace de Redirección <span className="text-zinc-500">(Opcional)</span></label>
                        <input
                            type="text"
                            placeholder="Ej: /perfil"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full rounded-xl border border-white/20 bg-zinc-900/80 px-4 py-3 text-sm text-white focus:border-lime-400 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-lime-400 py-3.5 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-lime-300 active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-lg shadow-lime-400/10"
                    >
                        {loading ? "Enviando..." : "Enviar Notificación y Volver"}
                    </button>
                </form>
            </div>

            {/* HISTORIAL DE NOTIFICACIONES ENVIADAS */}
            <div className="border-t border-white/10 pt-8">
                <h2 className="text-lg font-black uppercase tracking-wider text-white mb-4">Historial de Notificaciones Emitidas</h2>

                {loadingHistory ? (
                    <p className="text-xs text-zinc-400">Cargando historial...</p>
                ) : sentNotifications.length === 0 ? (
                    <p className="text-xs text-zinc-400">No hay notificaciones emitidas recientemente.</p>
                ) : (
                    <div className="grid gap-3">
                        {sentNotifications.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                                <div className="space-y-1 pr-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{item.title}</span>
                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-lime-400/10 text-lime-400 border border-lime-400/20">
                                            {item.type}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 line-clamp-1">{item.message}</p>
                                    <p className="text-[10px] text-zinc-500">
                                        Para: <span className="text-zinc-300 font-medium">{item.user?.username || "Usuario"}</span> ({new Date(item.createdAt).toLocaleString("es-AR")})
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    )
}