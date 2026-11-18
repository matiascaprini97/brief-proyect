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

    // Estilos dinámicos (Admin: lime / Cliente: monocromo blanco-zinc)
    const hoverLogoBorder = isAdmin ? "group-hover:border-lime-400" : "group-hover:border-white"
    const hoverLogoText = isAdmin ? "group-hover:text-lime-400" : "group-hover:text-white"
    const hoverAvatarBorder = isAdmin ? "hover:border-lime-400/50" : "hover:border-white/60"
    const hoverItemText = isAdmin ? "hover:text-lime-400" : "hover:text-white"
    const badgeBg = isAdmin ? "bg-lime-400 text-black" : "bg-white text-black"

    // Helper para manejar redirecciones internas y externas
    const handleNavigate = (url: string) => {
        if (!url) return

        const cleanUrl = url.trim()

        if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
            window.open(cleanUrl, "_blank", "noopener,noreferrer")
            return
        }

        if (cleanUrl.includes(".") && !cleanUrl.startsWith("/")) {
            window.open(`https://${cleanUrl}`, "_blank", "noopener,noreferrer")
            return
        }

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
            <nav className="sticky top-0 z-50 w-full border-b border-white/15 bg-black/50 px-4 sm:px-6 py-2.5 backdrop-blur-2xl select-none text-white transition-all">
                {/* Cuadrícula balanceada de 3 columnas para centrado exacto */}
                <div className="mx-auto grid grid-cols-3 max-w-7xl items-center">

                    {/* Columna Izquierda (Espaciador balanceador) */}
                    <div className="flex items-center justify-start" />

                    {/* Columna Central: LOGO 100% CENTRADO */}
                    <div className="flex justify-center items-center">
                        <Link
                            href={isAdmin ? "/admin" : "/"}
                            className="group flex items-center gap-2.5 transition-transform duration-200 active:scale-[0.98]"
                        >
                            <img
                                src="/uploads/BLACK.jpeg"
                                alt="PHIIT Equipments Logo"
                                className={`h-9 w-9 rounded-xl object-cover border border-white/20 shadow-md transition-colors ${hoverLogoBorder}`}
                            />

                            {/* Bloque Tipográfico Apilado con Ancho Justificado */}
                            <div className="inline-flex flex-col justify-center leading-none w-max">
                                <span className="text-lg font-black uppercase tracking-wider text-white whitespace-nowrap">
                                    PHIIT
                                </span>
                                <span
                                    style={{ textAlignLast: "justify" }}
                                    className={`text-[7px] font-bold uppercase text-zinc-400 transition-colors w-full block ${hoverLogoText}`}
                                >
                                    EQUIPMENTS
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Columna Derecha: ACCIONES Y PERFIL */}
                    <div className="relative flex items-center justify-end gap-2.5 sm:gap-3">

                        {/* NOTIFICACIONES */}
                        <div className="relative">
                            {isAdmin ? (
                                <Link
                                    href="/admin/notifications"
                                    className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10 active:scale-95 shadow-sm ${hoverAvatarBorder}`}
                                    title="Gestión de Notificaciones"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.37 2.37 0 0 1-4.286 0M11.062 3.821A12.274 12.274 0 0 1 12 3.75c.316 0 .631.016.938.071a8.25 8.25 0 0 1 6.082 8.012v2.293c0 .351.139.687.387.935l1.326 1.326c.72.72.213 1.943-.804 1.943H4.07c-1.017 0-1.524-1.223-.804-1.943l1.326-1.326c.248-.248.387-.584.387-.935v-2.293a8.25 8.25 0 0 1 6.082-8.012Z" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-black shadow-md ${badgeBg}`}>
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
                                    className={`relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10 active:scale-95 shadow-sm ${hoverAvatarBorder}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a2.37 2.37 0 0 1-4.286 0M11.062 3.821A12.274 12.274 0 0 1 12 3.75c.316 0 .631.016.938.071a8.25 8.25 0 0 1 6.082 8.012v2.293c0 .351.139.687.387.935l1.326 1.326c.72.72.213 1.943-.804 1.943H4.07c-1.017 0-1.524-1.223-.804-1.943l1.326-1.326c.248-.248.387-.584.387-.935v-2.293a8.25 8.25 0 0 1 6.082-8.012Z" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className={`absolute -top-1 -right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[9px] sm:text-[10px] font-black shadow-md ${badgeBg}`}>
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {/* DESPLEGABLE NOTIFICACIONES CLIENTE */}
                            {!isAdmin && isNotifOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                                    <div className="absolute right-0 top-12 z-20 w-80 sm:w-96 rounded-2xl border border-white/20 bg-black/95 p-4 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                                        <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
                                            <h3 className="text-xs font-black uppercase tracking-widest text-white">Notificaciones</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
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
                                                            ? "bg-white/10 border-white/30 hover:bg-white/15"
                                                            : "bg-white/5 border-white/10 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-white">
                                                                {n.title}
                                                            </span>
                                                            {!n.isRead && <span className="h-2 w-2 rounded-full bg-white" />}
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

                        {/* MENÚ DE PERFIL Y DOCUMENTACIÓN */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsDropdownOpen(!isDropdownOpen)
                                    setIsNotifOpen(false)
                                }}
                                className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10 active:scale-95 overflow-hidden shadow-sm ${hoverAvatarBorder}`}
                            >
                                {profilePicture ? (
                                    <img src={profilePicture} alt="Foto de perfil" className="h-full w-full object-cover" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-300">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                )}
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 top-12 z-20 w-60 rounded-2xl border border-white/20 bg-black/90 p-2 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                                        <Link
                                            href="/perfil"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-200 transition-all hover:bg-white/10 ${hoverItemText}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                            Editar Perfil
                                        </Link>

                                        {/* DOCUMENTACIÓN PARA CLIENTES */}
                                        {!isAdmin && (
                                            <>
                                                <div className="my-1.5 border-t border-white/15" />

                                                <a
                                                    href="/uploads/PHIIT_Reformer_PH1001_Manual_v3.pdf"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-200 transition-all hover:bg-white/10 hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                                    </svg>
                                                    Manual de Uso
                                                </a>

                                                {/* Descomentar cuando cargues la Guía de Armado Rápido en /public/uploads/ */}
                                                {/* <a
                                                    href="/uploads/GUIA_ARMADO_RAPIDO.pdf"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => setIsDropdownOpen(false)}
                                                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-200 transition-all hover:bg-white/10 hover:text-white"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
                                                    </svg>
                                                    Guía de Armado
                                                </a> */}
                                            </>
                                        )}

                                        <div className="my-1.5 border-t border-white/15" />

                                        <button
                                            onClick={async () => {
                                                setIsDropdownOpen(false)
                                                await logoutAction()
                                            }}
                                            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
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

                        <button
                            onClick={() => setActiveModalNotif(null)}
                            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-4 pr-8">
                            <span className="inline-block rounded-md bg-white/10 border border-white/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-200 mb-2">
                                {activeModalNotif.type}
                            </span>
                            <h2 className="text-lg font-black uppercase tracking-wide text-white">
                                {activeModalNotif.title}
                            </h2>
                            <p className="text-[10px] text-zinc-500 mt-1">
                                {new Date(activeModalNotif.createdAt).toLocaleString("es-AR")}
                            </p>
                        </div>

                        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar border-t border-b border-white/10 py-4 my-4">
                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {activeModalNotif.message}
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                            {activeModalNotif.link && (
                                <button
                                    onClick={() => {
                                        const url = activeModalNotif.link!
                                        setActiveModalNotif(null)
                                        handleNavigate(url)
                                    }}
                                    className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-zinc-200 cursor-pointer shadow-lg"
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