"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"

// === 1. INTERFACES DE TYPESCRIPT ===
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
    invoiceUrl?: string | null // === PROPIEDAD DE FACTURA ===
}

export default function ClientPage() {
    const [products, setProducts] = useState<ProductBought[]>([])
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [openProductId, setOpenProductId] = useState<string | null>(null)

    useEffect(() => {
        async function fetchInitialData() {
            try {
                const [productsRes, profileRes] = await Promise.all([
                    fetch("/api/client/products"),
                    fetch("/api/client/profile")
                ])

                if (productsRes.ok) {
                    // 1. Consumes el stream UNA sola vez
                    const productsData = await productsRes.json()

                    // 2. Imprimes la variable guardada (no el Response)
                    console.log("Datos de la API:", productsData)

                    // 3. Actualizas el estado
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

    const toggleProduct = (id: string) => {
        setOpenProductId(openProductId === id ? null : id)
    }

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

            <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-12 relative z-10">
                {/* Encabezado */}
                <div className="mb-12 space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase leading-none text-white">
                        MIS <span className="text-fuchsia-500 italic">ARTÍCULOS</span>
                    </h1>
                    <p className="text-base font-medium text-zinc-300">
                        Historial de equipamiento técnico vinculado a tus compras en PHIIT Equipments.
                    </p>
                </div>

                {/* MANEJO DE ESTADOS DE CARGA Y LISTA */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4 rounded-3xl border border-white/20 bg-black/30 backdrop-blur-xl">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-fuchsia-500/30 border-t-fuchsia-500" />
                        <p className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Cargando tus equipos...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-3xl border border-white/20 bg-black/40 backdrop-blur-2xl p-12 text-center text-base text-zinc-300 shadow-2xl">
                        No se encontraron artículos técnicos vinculados a tu cuenta.
                    </div>
                ) : (
                    <div className="space-y-5">
                        {products.map((item) => {
                            const isOpen = openProductId === item.id
                            const warranty = calculateWarranty(item.saleCreatedAt, item.warrantyDays)

                            return (
                                <div
                                    key={item.id}
                                    className="border border-white/20 bg-black/40 backdrop-blur-xl rounded-3xl transition-all duration-300 shadow-2xl overflow-hidden hover:border-fuchsia-500/50 hover:bg-black/50"
                                >
                                    {/* Cabecera del Producto */}
                                    <button
                                        onClick={() => toggleProduct(item.id)}
                                        className="flex w-full items-center justify-between px-7 py-6 text-left transition-colors hover:bg-white/5"
                                        aria-expanded={isOpen}
                                    >
                                        <div className="space-y-1">
                                            <span className="text-xs font-black uppercase tracking-widest text-fuchsia-400">
                                                {item.brand}
                                            </span>
                                            <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                                                {item.name}
                                            </h2>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold text-zinc-300 hidden sm:inline">
                                                {isOpen ? "Ocultar" : "Ver detalles"}
                                            </span>
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/15">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={2.5}
                                                    stroke="currentColor"
                                                    className={`h-5 w-5 text-white transition-transform duration-300 ${isOpen ? "rotate-180 text-fuchsia-400" : ""}`}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Cuerpo Desplegable */}
                                    {isOpen && (
                                        <div className="border-t border-white/15 bg-black/60 p-7 space-y-7 text-base backdrop-blur-2xl animate-in fade-in duration-200">

                                            {/* Galería de Fotografías */}
                                            {item.photos && item.photos.length > 0 && (
                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Fotografías Oficiales</h3>
                                                    <div className="flex flex-wrap gap-3">
                                                        {item.photos.map((photoUrl, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={photoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block overflow-hidden rounded-2xl border border-white/20 bg-black/40 transition-all hover:scale-105 hover:border-fuchsia-500"
                                                            >
                                                                <img
                                                                    src={photoUrl}
                                                                    alt={`${item.name} - ${idx + 1}`}
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
                                                <p className="text-zinc-200 leading-relaxed text-base font-normal">{item.details}</p>
                                            </div>

                                            {/* Estado de la Garantía y Factura */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                                                {/* SECCIÓN DE FACTURA */}
                                                <div className="space-y-2">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Factura de Compra</h3>
                                                    {item.invoiceUrl ? (
                                                        <a
                                                            href={item.invoiceUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/15 px-4 py-2 text-xs font-bold text-fuchsia-300 uppercase tracking-wider hover:bg-fuchsia-500/30 hover:border-fuchsia-400 transition-all shadow-lg"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                            </svg>
                                                            Ver / Descargar Factura
                                                        </a>
                                                    ) : (
                                                        <p className="text-xs text-zinc-400 italic">
                                                            Comprobante digital no disponible.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Barras de vida útil de repuestos */}
                                            <div className="space-y-4">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Estado de Componentes</h3>

                                                {(!item.trackedSpareParts || item.trackedSpareParts.length === 0) ? (
                                                    <p className="text-sm text-zinc-400 italic">Este artículo no requiere seguimiento individual de partes.</p>
                                                ) : (
                                                    <div className="space-y-5 bg-black/40 border border-white/15 rounded-2xl p-5 shadow-inner">
                                                        {item.trackedSpareParts.map((part) => {
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
                                                                            className={`h-full transition-all duration-500 ${pct < 20 ? "bg-red-500" : "bg-fuchsia-500"
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
                                            {item.spareParts && (
                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                                                        Repuestos Compatibles
                                                    </h3>

                                                    {Array.isArray(item.spareParts) ? (
                                                        <div className="flex flex-wrap gap-2.5">
                                                            {item.spareParts.map((part, idx) => (
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
                                                        <p className="text-sm text-zinc-300 leading-relaxed">{item.spareParts}</p>
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
                <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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