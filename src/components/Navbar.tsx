"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/actions/auth"

interface Notification {
    id: string
    title: string
    message: string
    link?: string | null
    type: "INFO" | "SUCCESS" | "WARNING" | "SYSTEM"
    isRead: boolean
    createdAt: string
}

interface NavbarProps {
    profilePicture?: string | null
    isAdmin?: boolean
}

export default function Navbar({ profilePicture, isAdmin = false }: NavbarProps) {
    const router = useRouter()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isNotifOpen, setIsNotifOpen] = useState(false)

    // Notificación seleccionada para la ventana emergente (Modal)
    const [activeModalNotif, setActiveModalNotif] = useState<Notification | null>(null)

    // Estados de notificaciones
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState<number>(0)
    const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false)

    // Estilos dinámicos
    const hoverLogoBorder = isAdmin ? "group-hover:border-lime-400" : "group-hover:border-fuchsia-500"
    const hoverLogoText = isAdmin ? "group-hover:text-lime-400" : "group-hover:text-fuchsia-400"
    const hoverAvatarBorder = isAdmin ? "hover:border-lime-400/50" : "hover:border-fuchsia-500/50"
    const hoverItemText = isAdmin ? "hover:text-lime-400" : "hover:text-fuchsia-400"
    const badgeBg = isAdmin ? "bg-lime-400 text-black" : "bg-fuchsia-500 text-white"

    // Helper para manejar redirecciones internas y externas
    const handleNavigate = (url: string) => {
        if (!url) return

        const cleanUrl = url.trim()

        // Enlace externo completo (http:// o https://) -> Nueva pestaña
        if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
            window.open(cleanUrl, "_blank", "noopener,noreferrer")
            return
        }

        // Enlace externo sin protocolo (ej: "google.com" o "midominio.com/descuentos") -> Nueva pestaña
        if (cleanUrl.includes(".") && !cleanUrl.startsWith("/")) {
            window.open(`https://${cleanUrl}`, "_blank", "noopener,noreferrer")
            return
        }

        // Ruta interna de la app -> Misma pestaña con router.push
        const internalPath = cleanUrl.startsWith("/") ? cleanUrl : `/${cleanUrl}`
        router.push(internalPath)
    }

    const fetchNotifications = async () => {
        try {
            setLoadingNotifs(true)
            const res = await fetch("/api/notifications")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            }
        } catch (error) {
            console.error("Error al cargar notificaciones:", error)
        } finally {
            setLoadingNotifs(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    // Al hacer click en un ítem, lo marcamos leído y abrimos la ventana emergente
    const handleSelectNotification = async (notification: Notification) => {
        setIsNotifOpen(false)
        setActiveModalNotif(notification)

        if (!notification.isRead) {
            try {
                await fetch("/api/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notificationId: notification.id }),
                })

                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
                )
                setUnreadCount((prev) => Math.max(0, prev - 1))
            } catch (error) {
                console.error("Error al marcar como leída:", error)
            }
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllAsRead: true }),
            })

            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Error al marcar todas como leídas:", error)
        }
    }

    return (
        <>
            <nav className="sticky top-0 z-50 w-full border-b border-white/15 bg-black/50 px-6 py-3.5 backdrop-blur-2xl select-none text-white transition-all">
                <div className="mx-auto flex max-w-7xl items-center justify-between md:grid md:grid-cols-3">

                    <div className="hidden md:block" />

                    {/* Logo Central */}
                    <div className="flex justify-start md:justify-center">
                        <Link
                            href={isAdmin ? "/admin" : "/"}
                            className="group flex items-center gap-3 transition-transform duration-200 active:scale-[0.98]"
                        >
                            <img
                                src="/uploads/BLACK.jpeg"
                                alt="PHIIT Equipments Logo"
                                className={`h-9 w-9 rounded-xl object-cover border border-white/20 shadow-md transition-colors ${hoverLogoBorder}`}
                            />
                            <span className="text-base font-black uppercase tracking-widest text-white">
                                PHIIT <span className={`font-light text-zinc-400 transition-colors ${hoverLogoText}`}>EQUIPMENTS</span>
                            </span>
                        </Link>
                    </div>

                    {/* Acciones Derecha */}
                    <div className="relative flex items-center justify-end gap-3">

                        {/* SECCIÓN NOTIFICACIONES */}
                        <div className="relative">
                            {isAdmin ? (
                                <Link
                                    href="/admin/notifications"
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10 active:scale-95 shadow-sm ${hoverAvatarBorder}`}
                                    title="Gestión de Notificaciones"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5 text-zinc-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.37 2.37 0 0 1-4.286 0M11.062 3.821A12.274 12.274 0 0 1 12 3.75c.316 0 .631.016.938.071a8.25 8.25 0 0 1 6.082 8.012v2.293c0 .351.139.687.387.935l1.326 1.326c.72.72.213 1.943-.804 1.943H4.07c-1.017 0-1.524-1.223-.804-1.943l1.326-1.326c.248-.248.387-.584.387-.935v-2.293a8.25 8.25 0 0 1 6.082-8.012Z" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-md ${badgeBg}`}>
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </Link>
                            ) : (
                                <button
                                    onClick={() => {
                                        setIsNotifOpen(!isNotifOpen)
                                        setIsDropdownOpen(false)
                                    }}
                                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10 active:scale-95 shadow-sm ${hoverAvatarBorder}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5 text-zinc-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.37 2.37 0 0 1-4.286 0M11.062 3.821A12.274 12.274 0 0 1 12 3.75c.316 0 .631.016.938.071a8.25 8.25 0 0 1 6.082 8.012v2.293c0 .351.139.687.387.935l1.326 1.326c.72.72.213 1.943-.804 1.943H4.07c-1.017 0-1.524-1.223-.804-1.943l1.326-1.326c.248-.248.387-.584.387-.935v-2.293a8.25 8.25 0 0 1 6.082-8.012Z" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black shadow-md ${badgeBg}`}>
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* DESPLEGABLE CLIENTE */}
                            {!isAdmin && isNotifOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                                    <div className="absolute right-0 top-12 z-20 w-80 sm:w-96 rounded-2xl border border-white/20 bg-black/90 p-4 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-white">Notificaciones</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-400 hover:text-fuchsia-300 transition-colors cursor-pointer"
                                                >
                                                    Marcar leídas
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {loadingNotifs ? (
                                                <p className="text-center text-xs text-zinc-400 py-6">Cargando avisos...</p>
                                            ) : notifications.length === 0 ? (
                                                <p className="text-center text-xs text-zinc-400 py-6">No tienes notificaciones pendientes.</p>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => handleSelectNotification(n)}
                                                        className={`group relative flex flex-col gap-1 rounded-xl p-3 text-left transition-all cursor-pointer border ${!n.isRead
                                                            ? "bg-fuchsia-500/10 border-fuchsia-500/30 hover:bg-fuchsia-500/20"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                                                                {n.title}
                                                            </span>
                                                            {!n.isRead && <span className="h-2 w-2 rounded-full bg-fuchsia-500" />}
                                                        </div>
                                                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                                                            {n.message}
                                                        </p>
                                                        <span className="text-[9px] text-zinc-500 font-medium">
                                                            {new Date(n.createdAt).toLocaleDateString("es-AR", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                hour: "2-digit",
                                                                minute: "2-digit"
                                                            })}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* MENÚ DE PERFIL */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(!isDropdownOpen)
                                    setIsNotifOpen(false)
                                }}
                                className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10 active:scale-95 overflow-hidden shadow-sm ${hoverAvatarBorder}`}
                            >
                                {profilePicture ? (
                                    <img src={profilePicture} alt="Foto de perfil" className="h-full w-full object-cover" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5 text-zinc-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-white/20 bg-black/80 p-2 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                                        <Link
                                            href="/perfil"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-200 transition-all hover:bg-white/10 ${hoverItemText}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                            Editar Perfil
                                        </Link>

                                        <div className="my-1.5 border-t border-white/15" />

                                        <button
                                            onClick={async () => {
                                                setIsDropdownOpen(false)
                                                await logoutAction()
                                            }}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                            </svg>
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </nav>

            {/* VENTANA EMERGENTE (MODAL DETALLE DE NOTIFICACIÓN) */}
            {activeModalNotif && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-zinc-950 p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Botón de Cierre X */}
                        <button
                            onClick={() => setActiveModalNotif(null)}
                            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Encabezado */}
                        <div className="mb-4 pr-8">
                            <span className="inline-block rounded-md bg-fuchsia-500/10 border border-fuchsia-500/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-fuchsia-400 mb-2">
                                {activeModalNotif.type}
                            </span>
                            <h2 className="text-lg font-black uppercase tracking-wide text-white">
                                {activeModalNotif.title}
                            </h2>
                            <p className="text-[10px] text-zinc-500 mt-1">
                                {new Date(activeModalNotif.createdAt).toLocaleString("es-AR")}
                            </p>
                        </div>

                        {/* Mensaje Completo */}
                        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar border-t border-b border-white/10 py-4 my-4">
                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {activeModalNotif.message}
                            </p>
                        </div>

                        {/* Acciones del Modal */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            {activeModalNotif.link && (
                                <button
                                    onClick={() => {
                                        const url = activeModalNotif.link!
                                        setActiveModalNotif(null)
                                        handleNavigate(url)
                                    }}
                                    className="rounded-xl bg-fuchsia-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-fuchsia-400 cursor-pointer shadow-lg shadow-fuchsia-500/20"
                                >
                                    Ver Detalle
                                </button>
                            )}
                            <button
                                onClick={() => setActiveModalNotif(null)}
                                className="rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-300 transition-all hover:bg-white/10 cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}