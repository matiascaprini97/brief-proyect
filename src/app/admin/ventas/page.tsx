"use client"

import { useState, useEffect, useMemo } from "react"
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

interface SelectedItem {
    productId: string
    quantity: number
    searchQuery?: string // Añadido para el filtro individual por fila
}

// Estructura agrupada para renderizar 1 tarjeta por transacción
interface GroupedSale {
    groupId: string
    createdAt: string
    user: User
    invoiceUrl?: string
    sales: Sale[]
    totalItems: number
    productSummary: { name: string; count: number }[]
}

export default function AdminVentasPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [sales, setSales] = useState<Sale[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // Estados de Filtro y Ordenamiento
    const [searchTerm, setSearchTerm] = useState("")
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "client">("newest")
    const [dateRange, setDateRange] = useState<"all" | "today" | "7days" | "30days">("all")

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")

    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([
        { productId: "", quantity: 1, searchQuery: "" }
    ])

    const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
    const [createdCredentials, setCreatedCredentials] = useState<{
        username: string
        password: string
    } | null>(null)

    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)

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

    const handleAddItem = () => {
        setSelectedItems([...selectedItems, { productId: "", quantity: 1, searchQuery: "" }])
    }

    const handleRemoveItem = (index: number) => {
        if (selectedItems.length === 1) return
        setSelectedItems(selectedItems.filter((_, i) => i !== index))
    }

    const handleItemChange = (index: number, field: keyof SelectedItem, value: any) => {
        const updated = [...selectedItems]
        updated[index] = { ...updated[index], [field]: value }
        setSelectedItems(updated)
    }

    const handleCreateSale = async (e: React.FormEvent) => {
        e.preventDefault()

        const hasValidProducts = selectedItems.every(item => item.productId !== "")
        if (!email || !hasValidProducts) {
            alert("Por favor completa el email y selecciona un producto para cada línea.")
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

            // Mapeamos para solo enviar productId y quantity a la API
            const itemsToSubmit = selectedItems.map(({ productId, quantity }) => ({ productId, quantity }))
            formData.append("items", JSON.stringify(itemsToSubmit))

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
                alert(data.message || "Venta(s) registrada(s) con éxito")
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
        setSelectedItems([{ productId: "", quantity: 1, searchQuery: "" }])
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

    // 1. AGRUPACIÓN DINÁMICA POR TRANSACCIÓN DE COMPRA
    const groupedSales = useMemo(() => {
        const groupsMap = new Map<string, GroupedSale>()

        sales.forEach((sale) => {
            // Clave única basada en Usuario + Factura o Timestamp aproximado (mismo minuto)
            const dateMinutes = new Date(sale.createdAt).toISOString().slice(0, 16)
            const key = sale.invoiceUrl
                ? `${sale.user?.id}-${sale.invoiceUrl}`
                : `${sale.user?.id}-${dateMinutes}`

            if (!groupsMap.has(key)) {
                groupsMap.set(key, {
                    groupId: key,
                    createdAt: sale.createdAt,
                    user: sale.user,
                    invoiceUrl: sale.invoiceUrl,
                    sales: [],
                    totalItems: 0,
                    productSummary: [],
                })
            }

            const group = groupsMap.get(key)!
            group.sales.push(sale)
            group.totalItems += 1

            // Conteo resumido de tipos de equipos en la compra
            const prodName = sale.product?.name || "Equipo"
            const existingSummary = group.productSummary.find((p) => p.name === prodName)
            if (existingSummary) {
                existingSummary.count += 1
            } else {
                group.productSummary.push({ name: prodName, count: 1 })
            }
        })

        return Array.from(groupsMap.values())
    }, [sales])

    // 2. FILTRADO Y ORDENAMIENTO
    const filteredAndSortedGroups = useMemo(() => {
        return groupedSales
            .filter((group) => {
                // Filtro por búsqueda de texto
                const query = searchTerm.toLowerCase()
                const clientName = `${group.user?.firstName || ""} ${group.user?.lastName || ""}`.toLowerCase()
                const clientEmail = (group.user?.email || "").toLowerCase()
                const productsText = group.productSummary.map((p) => p.name).join(" ").toLowerCase()
                const matchesSearch = clientName.includes(query) || clientEmail.includes(query) || productsText.includes(query)

                // Filtro por Fecha
                const saleDate = new Date(group.createdAt).getTime()
                const now = Date.now()
                const daysDiff = (now - saleDate) / (1000 * 60 * 60 * 24)

                let matchesDate = true
                if (dateRange === "today") matchesDate = daysDiff <= 1
                else if (dateRange === "7days") matchesDate = daysDiff <= 7
                else if (dateRange === "30days") matchesDate = daysDiff <= 30

                return matchesSearch && matchesDate
            })
            .sort((a, b) => {
                // Ordenamiento
                if (sortBy === "newest") {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                }
                if (sortBy === "oldest") {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                }
                if (sortBy === "client") {
                    const nameA = `${a.user?.firstName || ""} ${a.user?.lastName || ""}`.toLowerCase()
                    const nameB = `${b.user?.firstName || ""} ${b.user?.lastName || ""}`.toLowerCase()
                    return nameA.localeCompare(nameB)
                }
                return 0
            })
    }, [groupedSales, searchTerm, sortBy, dateRange])

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

                {/* BARRA DE BÚSQUEDA Y FILTROS */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
                    {/* Búsqueda */}
                    <div className="sm:col-span-6 relative">
                        <input
                            type="text"
                            placeholder="Buscar cliente, email o producto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm border border-white/10 bg-white/5 text-white px-5 py-3 rounded-2xl focus:outline-none focus:border-lime-400 font-medium transition-all placeholder:text-zinc-500"
                        />
                    </div>

                    {/* Filtro por Rango de Fecha */}
                    <div className="sm:col-span-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            className="w-full text-sm border border-white/10 bg-zinc-900 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-lime-400 font-medium"
                        >
                            <option value="all">Todas las fechas</option>
                            <option value="today">Últimas 24 horas</option>
                            <option value="7days">Últimos 7 días</option>
                            <option value="30days">Últimos 30 días</option>
                        </select>
                    </div>

                    {/* Ordenamiento */}
                    <div className="sm:col-span-3">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full text-sm border border-white/10 bg-zinc-900 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-lime-400 font-medium"
                        >
                            <option value="newest">Más recientes primero</option>
                            <option value="oldest">Más antiguas primero</option>
                            <option value="client">Cliente (A - Z)</option>
                        </select>
                    </div>
                </div>

                {/* Tabla de Ventas Agrupadas */}
                <div className="border border-white/10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-16 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest animate-pulse">
                            Cargando consola de ventas...
                        </div>
                    ) : filteredAndSortedGroups.length === 0 ? (
                        <div className="p-16 text-center text-xs text-zinc-500 font-medium">
                            No se encontraron ventas asociadas a los filtros seleccionados.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredAndSortedGroups.map((group, groupIdx) => {
                                const isExpanded = expandedGroupId === group.groupId

                                return (
                                    <div key={`group-${group.groupId}-${groupIdx}`} className="transition-all hover:bg-white/[0.02]">
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:items-center">

                                            {/* Cliente */}
                                            <div className="md:col-span-3 space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                                                    Cliente
                                                </span>
                                                <div className="text-sm font-bold text-white truncate">
                                                    {group.user?.firstName || "Cliente"} {group.user?.lastName || ""}
                                                </div>
                                                <div className="text-xs text-zinc-400 font-mono truncate">
                                                    {group.user?.email}
                                                </div>
                                            </div>

                                            {/* Resumen de Compra (Productos y Cantidad) */}
                                            <div className="md:col-span-4 space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block">
                                                    Resumen de Orden ({group.totalItems} {group.totalItems === 1 ? "unidad" : "unidades"})
                                                </span>
                                                <div className="text-sm font-bold text-lime-400 truncate flex flex-wrap gap-1.5">
                                                    {group.productSummary.map((item, pIdx) => (
                                                        <span key={`summary-${pIdx}`} className="bg-lime-400/10 text-lime-400 border border-lime-400/20 px-2 py-0.5 rounded-lg text-xs">
                                                            {item.count}x {item.name}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="text-[11px] text-zinc-400">
                                                    Fecha: {new Date(group.createdAt).toLocaleString()}
                                                </div>
                                            </div>

                                            {/* Botones de Acción */}
                                            <div className="md:col-span-5 flex items-center md:justify-end gap-2 pt-2 md:pt-0 flex-wrap shrink-0">
                                                {group.invoiceUrl && (
                                                    <a
                                                        href={group.invoiceUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="h-9 px-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-white/5 border border-white/10 hover:border-lime-400/50 hover:text-lime-400 text-zinc-200 transition-all inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                                                        title="Ver / Descargar Factura PDF"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V7.5L14.5 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
                                                        </svg>
                                                        <span>Factura PDF</span>
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => setExpandedGroupId(isExpanded ? null : group.groupId)}
                                                    className={`h-9 px-3.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all border inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap ${isExpanded
                                                        ? "bg-lime-400 text-black border-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                                                        : "bg-white/5 border-white/10 hover:border-lime-400/50 hover:text-lime-400 text-zinc-200"
                                                        }`}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                                    </svg>
                                                    <span>{isExpanded ? "Ocultar Detalle" : `Ver Detalle (${group.totalItems})`}</span>
                                                </button>
                                            </div>

                                        </div>

                                        {/* DESGLOSE INDIVIDUAL DE UNIDADES Y SUS REPUESTOS */}
                                        {isExpanded && (
                                            <div className="bg-black/80 border-t border-white/10 p-6 md:p-8 backdrop-blur-2xl space-y-6 animate-in fade-in duration-200">
                                                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-lime-400 flex items-center gap-2">
                                                        <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                                                        Desglose de la Orden ({group.totalItems} Equipos monitoreados)
                                                    </h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {group.sales.map((saleItem, sIdx) => (
                                                        <div key={`sale-unit-${saleItem.id}-${sIdx}`} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                                                            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                                                <div>
                                                                    <span className="text-[10px] font-bold uppercase text-zinc-500">Unidad #{sIdx + 1}</span>
                                                                    <h4 className="text-sm font-bold text-white">{saleItem.product?.name}</h4>
                                                                    <span className="text-[10px] text-zinc-500 font-mono">ID Venta: {saleItem.id}</span>
                                                                </div>

                                                                <button
                                                                    onClick={() => handleDeleteSale(saleItem.id)}
                                                                    className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                                                                >
                                                                    Eliminar Unidad
                                                                </button>
                                                            </div>

                                                            {/* Repuestos de la unidad */}
                                                            {saleItem.trackedSpareParts?.length === 0 ? (
                                                                <p className="text-xs text-zinc-500 italic">Sin repuestos en seguimiento.</p>
                                                            ) : (
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                    {saleItem.trackedSpareParts?.map((part, pIdx) => {
                                                                        const { daysElapsed, percentRemaining, color } = calculateLifespan(
                                                                            part.installedAt,
                                                                            part.lifespanDays
                                                                        )

                                                                        return (
                                                                            <div key={`part-unit-${part.id}-${pIdx}`} className="bg-black/50 border border-white/10 rounded-xl p-3 space-y-2">
                                                                                <div className="flex justify-between text-xs">
                                                                                    <span className="font-bold text-zinc-200">{part.name}</span>
                                                                                    <span className="font-mono text-lime-400 font-bold">{percentRemaining}%</span>
                                                                                </div>
                                                                                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                                                                    <div className={`h-full ${color}`} style={{ width: `${percentRemaining}%` }} />
                                                                                </div>
                                                                                <div className="flex justify-between items-center pt-1">
                                                                                    <span className="text-[10px] text-zinc-500 font-mono">{daysElapsed}/{part.lifespanDays} d</span>
                                                                                    <button
                                                                                        onClick={() => handleResetPart(part.id)}
                                                                                        className="text-[10px] font-black uppercase text-lime-400 hover:underline"
                                                                                    >
                                                                                        ⚡ Reset
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL MANTENIDO INTACTO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-950/90 border border-white/15 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-[0_0_60px_rgba(163,230,53,0.12)] backdrop-blur-2xl space-y-6 max-h-[90vh] overflow-y-auto">

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

                                {/* SECCIÓN DE PRODUCTOS DINÁMICOS CON BÚSQUEDA INTEGRADAS */}
                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
                                            Artículos Adquiridos *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleAddItem}
                                            className="text-[11px] font-bold text-lime-400 hover:text-lime-300 transition-colors"
                                        >
                                            + Agregar otro artículo
                                        </button>
                                    </div>

                                    {selectedItems.map((item, index) => {
                                        const query = (item.searchQuery || "").toLowerCase()
                                        const filteredProducts = products.filter(
                                            (p) => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query)
                                        )

                                        return (
                                            <div key={`selected-item-row-${index}`} className="p-3 border border-white/10 bg-white/5 rounded-2xl space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="🔍 Buscar artículo por nombre o marca..."
                                                    value={item.searchQuery || ""}
                                                    onChange={(e) => handleItemChange(index, "searchQuery", e.target.value)}
                                                    className="w-full text-xs border border-white/10 bg-black/40 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-lime-400 font-medium placeholder:text-zinc-500 transition-all"
                                                />

                                                <div className="flex items-center gap-2 w-full">
                                                    <select
                                                        required
                                                        value={item.productId}
                                                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                                                        className="flex-1 min-w-0 text-sm border border-white/10 bg-zinc-900 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-lime-400 font-medium truncate"
                                                    >
                                                        <option value="" className="bg-zinc-950 text-zinc-400">
                                                            {filteredProducts.length === 0
                                                                ? "Sin resultados..."
                                                                : "Seleccionar equipo..."}
                                                        </option>
                                                        {filteredProducts.map((p, pIdx) => (
                                                            <option key={`product-opt-${p.id}-${pIdx}`} value={p.id} className="bg-zinc-900 text-white">
                                                                {p.brand} — {p.name}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value) || 1)}
                                                        className="w-14 shrink-0 text-sm border border-white/10 bg-white/5 text-white px-2 py-2 rounded-xl text-center focus:outline-none focus:border-lime-400 font-bold"
                                                    />

                                                    {selectedItems.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="shrink-0 p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-xs"
                                                            title="Eliminar ítem"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
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