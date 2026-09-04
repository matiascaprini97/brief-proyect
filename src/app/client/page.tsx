"use client"

import { useState, useEffect, useMemo } from "react"
import Navbar from "@/components/Navbar"

interface GenericSparePart {
    productId?: string
    name: string
    lifespanDays?: number
}

interface TrackedSparePart {
    id: string
    name: string
    installedAt: string
    lifespanDays: number
    spareProductId: string | null
}

interface ProductBought {
    id: string
    saleId: string
    saleCreatedAt: string
    brand: string
    name: string
    details: string
    spareParts: GenericSparePart[] | string | null
    warrantyDays: number
    photos: string[]
    trackedSpareParts: TrackedSparePart[]
    invoiceUrl?: string | null
}

interface GroupedPurchase {
    groupId: string
    saleCreatedAt: string
    invoiceUrl?: string | null
    items: ProductBought[]
    summary: { brand: string; name: string; count: number }[]
}

export default function ClientPage() {
    const [products, setProducts] = useState<ProductBought[]>([])
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    // Estados para Filtros y Búsqueda
    const [searchTerm, setSearchTerm] = useState("")
    const [dateRange, setDateRange] = useState<"all" | "30days" | "90days" | "year">("all")
    const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest")

    // Estado para controlar qué grupo u orden está desplegada
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
    // Estado para controlar qué unidad individual dentro de la orden se está inspeccionando
    const [selectedUnitIndexMap, setSelectedUnitIndexMap] = useState<Record<string, number>>({})

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [productsRes, profileRes] = await Promise.all([
                    fetch("/api/client/products"),
                    fetch("/api/client/profile")
                ])

                if (productsRes.ok) {
                    const productsData = await productsRes.json()
                    setProducts(productsData)
                }

                if (profileRes.ok) {
                    const profileData = await profileRes.json()
                    setProfilePicture(profileData.profilePicture)
                }
            } catch (error) {
                console.error("Error conectando a las APIs del cliente:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    function calculateLifePercentage(installedAt: string, lifespanDays: number): number {
        const installationDate = new Date(installedAt)
        const currentDate = new Date()

        const diffTime = currentDate.getTime() - installationDate.getTime()
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const daysRemaining = lifespanDays - daysPassed

        if (daysRemaining <= 0) return 0
        const percentage = (daysRemaining / lifespanDays) * 100
        return Math.min(percentage, 100)
    }

    function calculateWarranty(saleCreatedAt: string, warrantyDays: number) {
        const purchaseDate = new Date(saleCreatedAt)
        const currentDate = new Date()

        const diffTime = currentDate.getTime() - purchaseDate.getTime()
        const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const daysRemaining = warrantyDays - daysPassed

        return {
            isActive: daysRemaining > 0,
            daysLeft: Math.max(daysRemaining, 0)
        }
    }

    // 1. AGRUPACIÓN DINÁMICA POR COMPRA / COMPROBANTE
    const groupedPurchases = useMemo(() => {
        const map = new Map<string, GroupedPurchase>()

        products.forEach((prod) => {
            const dateMinutes = prod.saleCreatedAt
                ? new Date(prod.saleCreatedAt).toISOString().slice(0, 16)
                : "sin-fecha"

            const key = (prod.invoiceUrl && prod.invoiceUrl.trim() !== "")
                ? `inv-${prod.invoiceUrl}`
                : `batch-${dateMinutes}`

            if (!map.has(key)) {
                map.set(key, {
                    groupId: key,
                    saleCreatedAt: prod.saleCreatedAt,
                    invoiceUrl: prod.invoiceUrl,
                    items: [],
                    summary: []
                })
            }

            const group = map.get(key)!
            group.items.push(prod)

            const existingSummary = group.summary.find(
                (s) => s.name === prod.name && s.brand === prod.brand
            )
            if (existingSummary) {
                existingSummary.count += 1
            } else {
                group.summary.push({ brand: prod.brand, name: prod.name, count: 1 })
            }
        })

        return Array.from(map.values())
    }, [products])

    // 2. FILTRADO Y ORDENAMIENTO
    const filteredAndSortedGroups = useMemo(() => {
        return groupedPurchases
            .filter((group) => {
                const query = searchTerm.toLowerCase()
                const matchesSearch =
                    group.summary.some(
                        (s) =>
                            s.brand.toLowerCase().includes(query) ||
                            s.name.toLowerCase().includes(query)
                    ) ||
                    group.items.some((i) => i.details?.toLowerCase().includes(query))

                const saleDate = new Date(group.saleCreatedAt).getTime()
                const now = Date.now()
                const daysDiff = (now - saleDate) / (1000 * 60 * 60 * 24)

                let matchesDate = true
                if (dateRange === "30days") matchesDate = daysDiff <= 30
                else if (dateRange === "90days") matchesDate = daysDiff <= 90
                else if (dateRange === "year") matchesDate = daysDiff <= 365

                return matchesSearch && matchesDate
            })
            .sort((a, b) => {
                if (sortBy === "newest") {
                    return new Date(b.saleCreatedAt).getTime() - new Date(a.saleCreatedAt).getTime()
                }
                return new Date(a.saleCreatedAt).getTime() - new Date(b.saleCreatedAt).getTime()
            })
    }, [groupedPurchases, searchTerm, dateRange, sortBy])

    const handleSelectUnit = (groupId: string, index: number) => {
        setSelectedUnitIndexMap((prev) => ({ ...prev, [groupId]: index }))
    }

    return (
        <div
            className="relative flex min-h-screen flex-col text-white antialiased font-sans select-none"
            style={{ scrollbarGutter: "stable" }}
        >
            {/* FONDO DIFUMINADO CLARO Y VISIBLE */}
            <div
                className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat filter blur-lg scale-105 opacity-55 pointer-events-none"
                style={{ backgroundImage: "url('/uploads/Wallpaper.jpeg')" }}
            />
            {/* Capa de contraste semi-transparente */}
            <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />

            <Navbar profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12 relative z-10">
                {/* Encabezado */}
                <div className="mb-8 space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase leading-none text-white">
                        MIS <span className="text-fuchsia-500 italic">ARTÍCULOS</span>
                    </h1>
                    <p className="text-base font-medium text-zinc-300">
                        Historial de equipamiento técnico y estado de componentes en PHIIT Equipments.
                    </p>
                </div>

                {/* CONTROLES DE BÚSQUEDA Y FILTRO */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-8">
                    <div className="sm:col-span-6 relative">
                        <input
                            type="text"
                            placeholder="Buscar por equipo, marca o modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full text-sm border border-white/20 bg-black/40 backdrop-blur-xl text-white px-5 py-3.5 rounded-2xl focus:outline-none focus:border-fuchsia-500 font-medium transition-all placeholder:text-zinc-400 shadow-xl"
                        />
                    </div>

                    <div className="sm:col-span-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value as any)}
                            className="w-full text-sm border border-white/20 bg-zinc-950/80 backdrop-blur-xl text-white px-4 py-3.5 rounded-2xl focus:outline-none focus:border-fuchsia-500 font-medium shadow-xl"
                        >
                            <option value="all">Todas las compras</option>
                            <option value="30days">Últimos 30 días</option>
                            <option value="90days">Últimos 90 días</option>
                            <option value="year">Último año</option>
                        </select>
                    </div>

                    <div className="sm:col-span-3">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full text-sm border border-white/20 bg-zinc-950/80 backdrop-blur-xl text-white px-4 py-3.5 rounded-2xl focus:outline-none focus:border-fuchsia-500 font-medium shadow-xl"
                        >
                            <option value="newest">Más recientes primero</option>
                            <option value="oldest">Más antiguas primero</option>
                        </select>
                    </div>
                </div>

                {/* MANEJO DE ESTADOS DE CARGA Y LISTA */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4 rounded-3xl border border-white/20 bg-black/30 backdrop-blur-xl">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500" />
                        <p className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Cargando tus equipos...</p>
                    </div>
                ) : filteredAndSortedGroups.length === 0 ? (
                    <div className="rounded-3xl border border-white/20 bg-black/40 backdrop-blur-2xl p-12 text-center text-base text-zinc-300 shadow-2xl">
                        No se encontraron artículos técnicos asociados a tu búsqueda.
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredAndSortedGroups.map((group) => {
                            const isExpanded = expandedGroupId === group.groupId
                            const activeUnitIdx = selectedUnitIndexMap[group.groupId] || 0
                            const currentUnit = group.items[activeUnitIdx] || group.items[0]
                            const warranty = calculateWarranty(currentUnit.saleCreatedAt, currentUnit.warrantyDays)
                            const totalUnits = group.items.length

                            return (
                                <div
                                    key={group.groupId}
                                    className="border border-white/20 bg-black/40 backdrop-blur-xl rounded-3xl transition-all duration-300 shadow-2xl overflow-hidden hover:border-fuchsia-500/50 hover:bg-black/50"
                                >
                                    {/* Cabecera de la Orden/Compra */}
                                    <div className="p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-black uppercase tracking-widest text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/30 px-3 py-1 rounded-full">
                                                    Compra del {new Date(group.saleCreatedAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-xs font-bold text-zinc-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                                                    {totalUnits} {totalUnits === 1 ? "Unidad" : "Unidades"}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                {group.summary.map((s, idx) => (
                                                    <h2 key={idx} className="text-2xl font-black tracking-tight text-white uppercase">
                                                        <span className="text-fuchsia-400 font-extrabold">{s.count}x</span> {s.brand} {s.name}
                                                    </h2>
                                                ))}
                                            </div>
                                        </div>

                                        {/* CONTENEDOR DE BOTONES CON FLEX-WRAP Y NO-WRAP INTERNO */}
                                        <div className="flex flex-wrap items-center gap-3 shrink-0">
                                            {group.invoiceUrl && (
                                                <a
                                                    href={group.invoiceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/40 bg-fuchsia-500/15 px-4 py-3 text-xs font-bold text-fuchsia-300 uppercase tracking-wider hover:bg-fuchsia-500/30 hover:border-fuchsia-400 transition-all shadow-lg shrink-0 whitespace-nowrap"
                                                >
                                                    <svg className="h-4 w-4 text-fuchsia-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                    </svg>
                                                    Factura PDF
                                                </a>
                                            )}

                                            <button
                                                onClick={() => setExpandedGroupId(isExpanded ? null : group.groupId)}
                                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border shrink-0 whitespace-nowrap ${isExpanded
                                                    ? "bg-fuchsia-500 text-white border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)]"
                                                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                                    }`}
                                            >
                                                <span>{isExpanded ? "Ocultar Detalle" : "Ver Equipos"}</span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2.5}
                                                    stroke="currentColor"
                                                    className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cuerpo Desplegable */}
                                    {isExpanded && (
                                        <div className="border-t border-white/15 bg-black/70 p-7 space-y-7 text-base backdrop-blur-2xl animate-in fade-in duration-200">

                                            {/* SELECTOR DE UNIDADES SI HAY MÁS DE 1 */}
                                            {totalUnits > 1 && (
                                                <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-xs font-black uppercase tracking-widest text-fuchsia-400">
                                                            Seleccionar Unidad ({activeUnitIdx + 1} de {totalUnits})
                                                        </h3>
                                                        <span className="text-[11px] text-zinc-400 font-medium">
                                                            Elegí un equipo para revisar el desgaste individual de sus piezas.
                                                        </span>
                                                    </div>

                                                    {/* SCROLLBAR FUCSIA PERSONALIZADO */}
                                                    <div
                                                        className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-2 [::-webkit-scrollbar]:w-2 [::-webkit-scrollbar-track]:bg-white/5 [::-webkit-scrollbar-track]:rounded-full [::-webkit-scrollbar-thumb]:bg-fuchsia-500 [::-webkit-scrollbar-thumb]:rounded-full hover:[::-webkit-scrollbar-thumb]:bg-fuchsia-400"
                                                        style={{ scrollbarColor: "#d946ef rgba(255, 255, 255, 0.05)", scrollbarWidth: "thin" }}
                                                    >
                                                        {group.items.map((unitItem, uIdx) => (
                                                            <button
                                                                key={unitItem.id}
                                                                onClick={() => handleSelectUnit(group.groupId, uIdx)}
                                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${activeUnitIdx === uIdx
                                                                    ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.2)]"
                                                                    : "bg-black/40 text-zinc-300 border-white/10 hover:border-white/30"
                                                                    }`}
                                                            >
                                                                Unidad #{uIdx + 1}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Galería de Fotografías */}
                                            {currentUnit.photos && currentUnit.photos.length > 0 && (
                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                                        Fotografías Oficiales ({currentUnit.name})
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3">
                                                        {currentUnit.photos.map((photoUrl, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={photoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block overflow-hidden rounded-2xl border border-white/20 bg-black/40 transition-all hover:scale-105 hover:border-fuchsia-500"
                                                            >
                                                                <img
                                                                    src={photoUrl}
                                                                    alt={`${currentUnit.name} - ${idx + 1}`}
                                                                    className="h-24 w-24 object-cover"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Detalles generales */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Especificaciones Técnicas</h3>
                                                <p className="text-zinc-200 leading-relaxed text-base font-normal">{currentUnit.details}</p>
                                            </div>

                                            {/* Estado de la Garantía */}
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Garantía Oficial PHIIT</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${warranty.isActive
                                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                                        : "bg-red-500/20 text-red-300 border border-red-500/40"
                                                        }`}>
                                                        {warranty.isActive ? "Cobertura Vigente" : "Cobertura Expirada"}
                                                    </span>
                                                    <p className="text-sm font-medium text-zinc-200">
                                                        {warranty.isActive
                                                            ? `Quedan ${warranty.daysLeft} días de soporte directo.`
                                                            : "El período de cobertura estándar ha finalizado."}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Barras de vida útil de repuestos */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                                    Estado de Componentes {totalUnits > 1 ? `(Unidad #${activeUnitIdx + 1})` : ""}
                                                </h3>

                                                {(!currentUnit.trackedSpareParts || currentUnit.trackedSpareParts.length === 0) ? (
                                                    <p className="text-sm text-zinc-400 italic">Este artículo no requiere seguimiento individual de partes.</p>
                                                ) : (
                                                    <div className="space-y-5 bg-black/50 border border-white/15 rounded-2xl p-5 shadow-inner">
                                                        {currentUnit.trackedSpareParts.map((part) => {
                                                            const pct = calculateLifePercentage(part.installedAt, part.lifespanDays)
                                                            return (
                                                                <div key={part.id} className="space-y-2">
                                                                    <div className="flex items-center justify-between text-sm font-bold">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-white">{part.name}</span>
                                                                            {part.spareProductId && (
                                                                                <a
                                                                                    href={`/store/products/${part.spareProductId}`}
                                                                                    className="text-xs text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-4 transition-colors font-semibold"
                                                                                >
                                                                                    Comprar repuesto original
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                        <span className={pct < 20 ? "text-red-400 font-black animate-pulse" : "text-zinc-300"}>
                                                                            {Math.round(pct)}%
                                                                        </span>
                                                                    </div>

                                                                    {/* Barra de progreso */}
                                                                    <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/10">
                                                                        <div
                                                                            className={`h-full transition-all duration-500 ${pct < 20 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                                                                                }`}
                                                                            style={{ width: `${pct}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Catálogo General de Repuestos */}
                                            {currentUnit.spareParts && (
                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                                        Repuestos Compatibles
                                                    </h3>

                                                    {Array.isArray(currentUnit.spareParts) ? (
                                                        <div className="flex flex-wrap gap-2.5">
                                                            {currentUnit.spareParts.map((part, idx) => (
                                                                <div
                                                                    key={part.productId || idx}
                                                                    className="flex items-center gap-2 rounded-xl border border-white/20 bg-black/50 px-4 py-2 text-sm text-zinc-200 shadow-sm"
                                                                >
                                                                    <span className="font-bold text-white">{part.name}</span>
                                                                    {part.lifespanDays && (
                                                                        <span className="text-xs text-zinc-400">
                                                                            (~{part.lifespanDays} días)
                                                                        </span>
                                                                    )}
                                                                    {part.productId && (
                                                                        <a
                                                                            href={`/store/products/${part.productId}`}
                                                                            className="ml-1 text-xs font-extrabold text-fuchsia-400 hover:underline"
                                                                        >
                                                                            Ver en tienda →
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-zinc-300 leading-relaxed">{currentUnit.spareParts}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* FOOTER OFICIAL PHIIT */}
            <footer className="w-full border-t border-white/15 bg-black/60 backdrop-blur-xl px-6 py-8 text-sm text-zinc-400 relative z-10">
                <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <p className="font-black text-white uppercase tracking-widest text-xs">PHIIT Equipments</p>
                        <div className="flex gap-4">
                            <a
                                href="https://www.instagram.com/phiit_equipments/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-fuchsia-400 transition-colors text-xs font-semibold"
                            >
                                Instagram (@phiit_equipments)
                            </a>
                        </div>
                    </div>
                    <div className="space-y-1 sm:text-right">
                        <p className="font-black text-white uppercase tracking-widest text-xs">Soporte Técnico</p>
                        <a href="mailto:soporte@briefplataforma.com" className="hover:text-fuchsia-400 transition-colors underline underline-offset-4 text-xs">
                            soporte@briefplataforma.com
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}