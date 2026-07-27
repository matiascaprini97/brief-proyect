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
}

export default function AdminVentasPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [sales, setSales] = useState<Sale[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // Estado del Modal de Nueva Venta Inteligente
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [productId, setProductId] = useState("")

    // Estado para mostrar credenciales generadas de nuevo cliente
    const [createdCredentials, setCreatedCredentials] = useState<{
        username: string
        password: string
    } | null>(null)

    // Estado para controlar qué venta tiene abierto el panel de repuestos
    const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null)

    // Cargar perfil, ventas y productos al montar
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
                // Opcional: mostrar únicamente equipos (isSpare: false)
                setProducts(data.filter((p: Product) => !p.isSpare))
            }
        } catch (error) {
            console.error("Error al obtener productos:", error)
        }
    }

    // Registrar Venta Inteligente
    const handleCreateSale = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !productId) {
            alert("Por favor completa el email y selecciona un producto.")
            return
        }

        setSubmitting(true)
        setCreatedCredentials(null)

        try {
            const res = await fetch("/api/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    firstName,
                    lastName,
                    phoneNumber,
                    productId,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Ocurrió un error al procesar la venta")
            }

            // Si el backend autogeneró un cliente, guardamos sus credenciales para mostrarlas
            if (data.isNewUser && data.generatedCredentials) {
                setCreatedCredentials(data.generatedCredentials)
            } else {
                alert(data.message || "Venta registrada con éxito")
                setIsModalOpen(false)
                resetForm()
            }

            fetchSales() // Refrescar la tabla
        } catch (error: any) {
            alert(`Error: ${error.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    // Resetear/Reponer un repuesto al 100%
    const handleResetPart = async (partId: string) => {
        try {
            const res = await fetch(`/api/tracked-spares/${partId}/reset`, {
                method: "POST",
            })

            if (res.ok) {
                // Actualización optimista o re-fetch
                fetchSales()
            } else {
                alert("Error al resetear el repuesto.")
            }
        } catch (error) {
            console.error("Error al resetear pieza:", error)
        }
    }

    // Eliminar Venta
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
        setCreatedCredentials(null)
    }

    // Calcular estado y porcentaje de vida útil
    const calculateLifespan = (installedAt: string, lifespanDays: number) => {
        const installDate = new Date(installedAt).getTime()
        const now = new Date().getTime()
        const daysElapsed = Math.floor((now - installDate) / (1000 * 60 * 60 * 24))
        const percentRemaining = Math.max(0, Math.round(100 - (daysElapsed / lifespanDays) * 100))

        let color = "bg-emerald-500"
        if (percentRemaining < 20) color = "bg-rose-500"
        else if (percentRemaining < 50) color = "bg-amber-500"

        return { daysElapsed, percentRemaining, color }
    }

    // Filtrar ventas por buscador
    const filteredSales = sales.filter((sale) => {
        const query = searchTerm.toLowerCase()
        const clientName = `${sale.user?.firstName || ""} ${sale.user?.lastName || ""}`.toLowerCase()
        const clientEmail = (sale.user?.email || "").toLowerCase()
        const productName = (sale.product?.name || "").toLowerCase()
        return clientName.includes(query) || clientEmail.includes(query) || productName.includes(query)
    })

    return (
        <div className="flex min-h-screen flex-col bg-zinc-50 text-black antialiased font-sans">
            <Navbar profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-6xl px-6 py-10">
                {/* Header & Volver */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <Link
                            href="/admin"
                            className="text-xs font-semibold text-zinc-400 hover:text-black flex items-center gap-1 mb-2 transition-colors w-fit"
                        >
                            ← Volver al Panel
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight uppercase">Consola de Gestión de Ventas</h1>
                        <p className="text-xs text-zinc-500">
                            Administrá las transacciones registradas, asociá clientes y monitoreá el ciclo de vida de los repuestos.
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            resetForm()
                            setIsModalOpen(true)
                        }}
                        className="bg-black text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-lg hover:bg-zinc-800 transition-all shadow-sm self-start md:self-auto"
                    >
                        + Nueva Venta Inteligente
                    </button>
                </div>

                {/* Buscador */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Buscar por cliente, email o producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-sm border border-zinc-200 bg-white px-4 py-3 rounded-xl focus:outline-none focus:border-black shadow-sm font-medium transition-colors"
                    />
                </div>

                {/* Tabla de Ventas */}
                <div className="border border-zinc-200 bg-white rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-xs text-zinc-400 font-medium">Cargando consola de ventas...</div>
                    ) : filteredSales.length === 0 ? (
                        <div className="p-12 text-center text-xs text-zinc-400 font-medium">
                            No se encontraron ventas registradas.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {filteredSales.map((sale) => {
                                const isExpanded = expandedSaleId === sale.id
                                const partsCount = sale.trackedSpareParts?.length || 0

                                return (
                                    <div key={sale.id} className="transition-colors hover:bg-zinc-50/50">
                                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Info Cliente */}
                                            <div className="space-y-1 min-w-[200px]">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cliente</span>
                                                <div className="text-sm font-bold text-zinc-900">
                                                    {sale.user?.firstName} {sale.user?.lastName}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono">{sale.user?.email}</div>
                                            </div>

                                            {/* Info Equipo */}
                                            <div className="space-y-1 min-w-[200px]">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Equipo Adquirido</span>
                                                <div className="text-sm font-semibold text-zinc-800">{sale.product?.name}</div>
                                                <div className="text-[11px] text-zinc-400">
                                                    Fecha: {new Date(sale.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>

                                            {/* Info Repuestos Registrados */}
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Componentes</span>
                                                <div>
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                                                        ⚙️ {partsCount} {partsCount === 1 ? "Pieza" : "Piezas"} bajo seguimiento
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex items-center gap-2 pt-2 md:pt-0">
                                                <button
                                                    onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                                                    className="text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    {isExpanded ? "Ocultar Repuestos" : "Gestionar Repuestos"}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSale(sale.id)}
                                                    className="text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-lg transition-colors"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>

                                        {/* Panel Desplegable de Repuestos */}
                                        {isExpanded && (
                                            <div className="bg-zinc-900 text-white p-6 border-t border-zinc-800 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                                        🚨 Monitoreo y Reposición de Piezas — {sale.product?.name}
                                                    </h3>
                                                    <span className="text-[10px] text-zinc-500 font-mono">
                                                        ID VENTA: {sale.id.slice(0, 8)}...
                                                    </span>
                                                </div>

                                                {partsCount === 0 ? (
                                                    <p className="text-xs text-zinc-500 italic py-2">
                                                        Este equipo no tiene repuestos en seguimiento configurados.
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
                                                                    className="bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-4 space-y-3"
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div>
                                                                            <h4 className="text-xs font-bold text-white">{part.name}</h4>
                                                                            <p className="text-[11px] text-zinc-400">
                                                                                Uso: <span className="text-zinc-200 font-mono">{daysElapsed} días</span> / Máx {part.lifespanDays} días
                                                                            </p>
                                                                        </div>
                                                                        <span className="text-xs font-bold font-mono text-zinc-300">
                                                                            {percentRemaining}%
                                                                        </span>
                                                                    </div>

                                                                    {/* Barra de Progreso */}
                                                                    <div className="w-full bg-zinc-700 h-2 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full ${color} transition-all duration-500`}
                                                                            style={{ width: `${percentRemaining}%` }}
                                                                        />
                                                                    </div>

                                                                    {/* Botón Reset */}
                                                                    <button
                                                                        onClick={() => handleResetPart(part.id)}
                                                                        className="w-full text-center bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-semibold tracking-wider uppercase py-2 rounded-lg transition-colors border border-zinc-600/50"
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

            {/* MODAL: Nueva Venta Inteligente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <div>
                                <h2 className="text-base font-bold uppercase tracking-tight text-zinc-900">
                                    Registrar Venta Inteligente
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Si el email no existe, crearemos el usuario automáticamente.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-zinc-400 hover:text-black font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Cartel de Credenciales Autogeneradas */}
                        {createdCredentials ? (
                            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                                    <span>🎉</span> ¡Cliente creado automáticamente!
                                </div>
                                <p className="text-xs text-emerald-700">
                                    Compartile estas credenciales al usuario para que ingrese a su panel:
                                </p>
                                <div className="bg-white p-3 rounded-lg border border-emerald-200 font-mono text-xs space-y-1">
                                    <div>
                                        <span className="text-zinc-400">Usuario:</span>{" "}
                                        <span className="font-bold text-black">{createdCredentials.username}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-400">Contraseña:</span>{" "}
                                        <span className="font-bold text-black">{createdCredentials.password}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false)
                                        resetForm()
                                    }}
                                    className="w-full bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-emerald-800 transition-colors"
                                >
                                    Entendido y Cerrar
                                </button>
                            </div>
                        ) : (
                            /* Formulario */
                            <form onSubmit={handleCreateSale} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Email del Cliente *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="ejemplo@cliente.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full text-sm border border-zinc-200 bg-zinc-50 p-2.5 rounded-lg focus:outline-none focus:border-black font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                            Nombre y Apellido
                                        </label>
                                        <span className="text-[10px] text-zinc-400 font-medium">
                                            (Opción nuevo cliente)
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-zinc-400 uppercase">Nombre</label>
                                            <input
                                                type="text"
                                                placeholder="Marisa"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="w-full text-sm border border-zinc-200 bg-zinc-50 p-2.5 rounded-lg focus:outline-none focus:border-black font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-semibold text-zinc-400 uppercase">Apellido</label>
                                            <input
                                                type="text"
                                                placeholder="Gómez"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="w-full text-sm border border-zinc-200 bg-zinc-50 p-2.5 rounded-lg focus:outline-none focus:border-black font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Teléfono (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="+54 11 ..."
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="w-full text-sm border border-zinc-200 bg-zinc-50 p-2.5 rounded-lg focus:outline-none focus:border-black font-medium"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Equipo Adquirido *
                                    </label>
                                    <select
                                        required
                                        value={productId}
                                        onChange={(e) => setProductId(e.target.value)}
                                        className="w-full text-sm border border-zinc-200 bg-zinc-50 p-2.5 rounded-lg focus:outline-none focus:border-black font-medium"
                                    >
                                        <option value="">Seleccionar equipo del catálogo...</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.brand} — {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-1/3 bg-zinc-100 text-zinc-700 text-xs font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-zinc-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-2/3 bg-black text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
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