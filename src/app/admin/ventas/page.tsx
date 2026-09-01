"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

interface TrackedSparePart {
    id: string
    name: string
    lifespanDays: number
    installedAt: string
}

interface Product {
    id: string
    name: string
    brand: string
    isSpare: boolean
}

interface User {
    id: string
    username: string
    email: string
    firstName?: string
    lastName?: string
    phoneNumber?: string
}

interface Sale {
    id: string
    createdAt: string
    user: User
    product: Product
    trackedSpareParts: TrackedSparePart[]
    invoiceUrl?: string
}

export default function AdminVentasPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [sales, setSales] = useState<Sale[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [productId, setProductId] = useState("")
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null)

    const [createdCredentials, setCreatedCredentials] = useState<{
        username: string
        password: string
    } | null>(null)

    const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)

    useEffect(() => {
        fetchProfile()
        fetchSales()
        fetchProducts()
    }, [])

    async function fetchProfile() {
        try {
            const res = await fetch("/api/client/profile")
            if (res.ok) {
                const data = await res.json()
                setProfilePicture(data.profilePicture)
            }
        } catch (error) {
            console.error("Error al cargar perfil:", error)
        }
    }

    async function fetchSales() {
        setLoading(true)
        try {
            const res = await fetch("/api/sales")
            if (res.ok) {
                const data = await res.json()
                setSales(data)
            }
        } catch (error) {
            console.error("Error al obtener ventas:", error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchProducts() {
        try {
            const res = await fetch("/api/admin/products")
            if (res.ok) {
                const data = await res.json()
                setProducts(data.filter((p: Product) => !p.isSpare))
            }
        } catch (error) {
            console.error("Error al obtener productos:", error)
        }
    }

    const handleCreateSale = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !productId) {
            alert("Por favor completa el email y selecciona un producto.")
            return
        }

        setSubmitting(true)
        setCreatedCredentials(null)

        try {
            const formData = new FormData()
            formData.append("email", email)
            formData.append("firstName", firstName)
            formData.append("lastName", lastName)
            formData.append("phoneNumber", phoneNumber)
            formData.append("productId", productId)
            if (invoiceFile) {
                formData.append("invoice", invoiceFile)
            }

            const res = await fetch("/api/sales", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Ocurrió un error al procesar la venta")
            }

            if (data.isNewUser && data.generatedCredentials) {
                setCreatedCredentials(data.generatedCredentials)
            } else {
                alert(data.message || "Venta registrada con éxito")
                setIsModalOpen(false)
                resetForm()
            }

            fetchSales()
        } catch (error: any) {
            alert(`Error: ${error.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    const handleResetPart = async (partId: string) => {
        try {
            const res = await fetch(`/api/tracked-spares/${partId}/reset`, {
                method: "POST",
            })

            if (res.ok) {
                fetchSales()
            } else {
                alert("Error al resetear el repuesto.")
            }
        } catch (error) {
            console.error("Error al resetear pieza:", error)
        }
    }

    const handleDeleteSale = async (saleId: string) => {
        if (!confirm("¿Estás seguro de eliminar esta venta y su monitoreo asociado?")) return

        try {
            const res = await fetch(`/api/sales/${saleId}`, {
                method: "DELETE",
            })

            if (res.ok) {
                fetchSales()
            } else {
                alert("Error al eliminar la venta.")
            }
        } catch (error) {
            console.error("Error al borrar venta:", error)
        }
    }

    const resetForm = () => {
        setEmail("")
        setFirstName("")
        setLastName("")
        setPhoneNumber("")
        setProductId("")
        setInvoiceFile(null)
        setCreatedCredentials(null)
    }

    const calculateLifespan = (installedAt: string, lifespanDays: number) => {
        const installDate = new Date(installedAt).getTime()
        const now = new Date().getTime()
        const daysElapsed = Math.floor((now - installDate) / (1000 * 60 * 60 * 24))
        const percentRemaining = Math.max(0, Math.round(100 - (daysElapsed / lifespanDays) * 100))

        let color = "bg-lime-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]"
        if (percentRemaining < 20) color = "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
        else if (percentRemaining < 50) color = "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"

        return { daysElapsed, percentRemaining, color }
    }

    const filteredSales = sales.filter((sale) => {
        const query = searchTerm.toLowerCase()
        const clientName = `${sale.user?.firstName || ""} ${sale.user?.lastName || ""}`.toLowerCase()
        const clientEmail = (sale.user?.email || "").toLowerCase()
        const productName = (sale.product?.name || "").toLowerCase()
        return clientName.includes(query) || clientEmail.includes(query) || productName.includes(query)
    })

    return (
        <div className="flex min-h-screen flex-col bg-black text-white antialiased font-sans selection:bg-lime-400 selection:text-black">
            <Navbar isAdmin={true} profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10">
                {/* Header & Volver */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <Link
                            href="/admin"
                            className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-lime-400 flex items-center gap-1.5 mb-3 transition-colors w-fit group"
                        >
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al Panel
                        </Link>
                        <h1 className="text-3xl font-black tracking-tight uppercase text-white flex items-center gap-3">
                            Consola de Gestión de Ventas
                        </h1>
                        <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                            Administrá transacciones registradas, asigná clientes, adjuntá facturas y monitoreá en tiempo real el ciclo de vida de los componentes.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            resetForm()
                            setIsModalOpen(true)
                        }}
                        className="bg-lime-400 text-black hover:bg-lime-300 text-xs font-black uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all shadow-[0_0_25px_rgba(163,230,53,0.25)] hover:shadow-[0_0_35px_rgba(163,230,53,0.4)] active:scale-95 self-start md:self-auto border border-lime-300/50 flex items-center gap-2 whitespace-nowrap"
                    >
                        <span>+</span> Nueva Venta Inteligente
                    </button>
                </div>

                {/* Buscador Glassmorphic */}
                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Buscar por cliente, email o equipo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-sm border border-white/10 bg-white/5 text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 shadow-2xl backdrop-blur-xl font-medium transition-all placeholder:text-zinc-500"
                    />
                </div>

                {/* Tabla / Lista de Ventas Glassmorphic */}
                <div className="border border-white/10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest animate-pulse">
                            Cargando consola de ventas...
                        </div>
                    ) : filteredSales.length === 0 ? (
                        <div className="p-16 text-center text-xs text-zinc-500 font-medium">
                            No se encontraron ventas registradas.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredSales.map((sale) => {
                                const isExpanded = expandedSaleId === sale.id
                                const partsCount = sale.trackedSpareParts?.length || 0

                                return (
                                    <div key={sale.id} className="transition-all hover:bg-white/[0.02]">
                                        {/* Grid Unificado de Columnas para alineación perfecta */}
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center">

                                            {/* Columna 1: Info Cliente (3 Cols) */}
                                            <div className="md:col-span-3 space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                                                    Cliente
                                                </span>
                                                <div className="text-sm font-bold text-white truncate">
                                                    {sale.user?.firstName || "Cliente"} {sale.user?.lastName || ""}
                                                </div>
                                                <div className="text-xs text-zinc-400 font-mono truncate">
                                                    {sale.user?.email}
                                                </div>
                                            </div>

                                            {/* Columna 2: Info Equipo (3 Cols) */}
                                            <div className="md:col-span-3 space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                                                    Equipo Adquirido
                                                </span>
                                                <div className="text-sm font-bold text-lime-400 truncate">
                                                    {sale.product?.name}
                                                </div>
                                                <div className="text-[11px] text-zinc-400">
                                                    {new Date(sale.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {/* Columna 3: Badge Componentes (2 Cols) */}
                                            <div className="md:col-span-2 space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                                                    Componentes
                                                </span>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/5 border border-white/10 text-zinc-200 backdrop-blur-md whitespace-nowrap">
                                                    <svg className="w-3.5 h-3.5 text-lime-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span>{partsCount} {partsCount === 1 ? "Pieza" : "Piezas"}</span>
                                                </div>
                                            </div>

                                            {/* Columna 4: Botones de Acción Normalizados (4 Cols) */}
                                            <div className="md:col-span-4 flex items-center md:justify-end gap-2 pt-2 md:pt-0 flex-wrap shrink-0">
                                                {sale.invoiceUrl && (
                                                    <a
                                                        href={sale.invoiceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="h-9 px-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-white/5 border border-white/10 hover:border-lime-400/50 hover:text-lime-400 text-zinc-200 transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                                        title="Ver / Descargar Factura PDF"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V7.5L14.5 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
                                                        </svg>
                                                        <span>Factura</span>
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                                                    className={`h-9 px-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${isExpanded
                                                        ? "bg-lime-400 text-black border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                                                        : "bg-white/5 border-white/10 hover:border-lime-400/50 hover:text-lime-400 text-zinc-200"
                                                        }`}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                    </svg>
                                                    <span>{isExpanded ? "Ocultar Repuestos" : "Gestionar Repuestos"}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteSale(sale.id)}
                                                    className="h-9 px-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 transition-all inline-flex items-center shrink-0 whitespace-nowrap"
                                                    title="Eliminar venta"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>

                                        </div>

                                        {/* PANEL DESPLEGABLE DE REPUESTOS */}
                                        {isExpanded && (
                                            <div className="bg-black/80 border-t border-white/10 p-6 md:p-8 backdrop-blur-2xl space-y-5 animate-in fade-in duration-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-lime-400">
                                                            Monitoreo y Reposición — {sale.product?.name}
                                                        </h3>
                                                    </div>
                                                    <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                                                        ID VENTA: {sale.id.slice(0, 8)}...
                                                    </span>
                                                </div>

                                                {partsCount === 0 ? (
                                                    <p className="text-xs text-zinc-500 italic py-4 text-center">
                                                        Este equipo no tiene repuestos configurados para monitoreo activo.
                                                    </p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {sale.trackedSpareParts.map((part) => {
                                                            const { daysElapsed, percentRemaining, color } = calculateLifespan(
                                                                part.installedAt,
                                                                part.lifespanDays
                                                            )

                                                            return (
                                                                <div
                                                                    key={part.id}
                                                                    className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5 space-y-4 hover:border-lime-400/30 transition-all group"
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div>
                                                                            <h4 className="text-xs font-extrabold uppercase tracking-wide text-white group-hover:text-lime-300 transition-colors">
                                                                                {part.name}
                                                                            </h4>
                                                                            <p className="text-[11px] text-zinc-400 mt-1">
                                                                                Uso: <span className="text-white font-mono font-bold">{daysElapsed} días</span> / Máx {part.lifespanDays} días
                                                                            </p>
                                                                        </div>
                                                                        <span className="text-sm font-black font-mono text-lime-400">
                                                                            {percentRemaining}%
                                                                        </span>
                                                                    </div>

                                                                    <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                                        <div
                                                                            className={`h-full rounded-full ${color} transition-all duration-500`}
                                                                            style={{ width: `${percentRemaining}%` }}
                                                                        />
                                                                    </div>

                                                                    <button
                                                                        onClick={() => handleResetPart(part.id)}
                                                                        className="w-full text-center bg-lime-400/10 border border-lime-400/30 hover:bg-lime-400 hover:text-black text-lime-400 text-[11px] font-black tracking-widest uppercase py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(163,230,53,0.1)] hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] active:scale-95"
                                                                    >
                                                                        ⚡ Reponer / Resetear al 100%
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL: Venta Inteligente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-950/90 border border-white/15 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-[0_0_60px_rgba(163,230,53,0.12)] backdrop-blur-2xl space-y-6 max-h-[90vh] overflow-y-auto">

                        {/* Header Modal */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                                    <span className="text-lime-400">✦</span> Registrar Venta Inteligente
                                </h2>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    Si el email no existe, crearemos el cliente de forma automática.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cartel de Credenciales Autogeneradas */}
                        {createdCredentials ? (
                            <div className="bg-lime-950/40 border border-lime-500/50 p-6 rounded-2xl space-y-4 shadow-[0_0_25px_rgba(163,230,53,0.15)]">
                                <div className="flex items-center gap-2 text-lime-400 font-extrabold text-xs uppercase tracking-wider">
                                    <span>🎉</span> ¡Cliente Creado Exitosamente!
                                </div>
                                <p className="text-xs text-zinc-300">
                                    Compartile estas credenciales al usuario para que ingrese a su panel:
                                </p>
                                <div className="bg-black/60 p-4 rounded-xl border border-white/10 font-mono text-xs space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Usuario:</span>{" "}
                                        <span className="font-bold text-white">{createdCredentials.username}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500">Contraseña:</span>{" "}
                                        <span className="font-bold text-lime-400">{createdCredentials.password}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        resetForm()
                                    }}
                                    className="w-full bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)] active:scale-95"
                                >
                                    Entendido y Cerrar
                                </button>
                            </div>
                        ) : (
                            /* Formulario Modal */
                            <form onSubmit={handleCreateSale} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                                        Email del Cliente *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="ejemplo@cliente.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full text-sm border border-white/10 bg-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 font-medium placeholder:text-zinc-600 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                                            Nombre y Apellido
                                        </label>
                                        <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                                            (Opcional para cliente nuevo)
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Nombre"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full text-sm border border-white/10 bg-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 font-medium placeholder:text-zinc-600 transition-all"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Apellido"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            className="w-full text-sm border border-white/10 bg-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 font-medium placeholder:text-zinc-600 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                                        Teléfono (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="+54 11 ..."
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full text-sm border border-white/10 bg-white/5 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 font-medium placeholder:text-zinc-600 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                                        Equipo Adquirido *
                                    </label>
                                    <select
                                        required
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        className="w-full text-sm border border-white/10 bg-zinc-900 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 font-medium transition-all"
                                    >
                                        <option value="" className="bg-zinc-950 text-zinc-400">
                                            Seleccionar equipo del catálogo...
                                        </option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id} className="bg-zinc-900 text-white">
                                                {p.brand} — {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                                        Factura PDF (Opcional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-zinc-400 border border-white/10 bg-white/5 rounded-xl p-3 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-lime-400 file:text-black hover:file:bg-lime-300 cursor-pointer font-medium transition-all"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-1/3 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider py-3.5 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-2/3 bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)] disabled:opacity-50 active:scale-95"
                                    >
                                        {submitting ? "Procesando..." : "Confirmar Venta"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}