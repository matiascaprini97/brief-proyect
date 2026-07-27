"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"

// === 1. INTERFACES DE TYPESCRIPT (Sincronizadas con Postgres) ===
interface GenericSparePart {
    productId?: string
    name: string
    lifespanDays?: number
}

interface TrackedSparePart {
    id: string
    name: string
    installedAt: string  // ISO String de la fecha
    lifespanDays: number
    spareProductId: string | null
}

interface ProductBought {
    id: string             // ID del producto
    saleId: string         // ID de la venta
    saleCreatedAt: string  // Fecha de la compra (sirve para la garantía)
    brand: string
    name: string
    details: string
    spareParts: GenericSparePart[] | string | null // 🟢 Soporta JSON estructurado o string tradicional
    warrantyDays: number
    photos: string[]
    trackedSpareParts: TrackedSparePart[] // Desglose de repuestos bajo seguimiento
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

    const toggleProduct = (id: string) => {
        setOpenProductId(openProductId === id ? null : id)
    }

    // === 2. FUNCIONES MATEMÁTICAS DE CÁLCULO TEMPORAL ===

    // Calcula el % restante de vida de un repuesto
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

    // Calcula el estado de la garantía basado en la fecha de compra de la Venta
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
            className="flex min-h-screen flex-col bg-white text-black antialiased font-sans"
            style={{ scrollbarGutter: "stable" }}
        >
            <Navbar profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
                {/* Encabezado */}
                <div className="mb-10 space-y-1">
                    <h1 className="text-2xl font-bold tracking-tighter uppercase">Mis Artículos</h1>
                    <p className="text-sm text-zinc-500">Historial de equipamiento técnico vinculado a tus compras.</p>
                </div>

                {/* MANEJO DE ESTADOS DE CARGA Y LISTA */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
                        <p className="text-xs text-zinc-400 uppercase tracking-wider">Sincronizando con base de datos...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                        No se encontraron artículos técnicos vinculados a tu cuenta de cliente.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {products.map((item) => {
                            const isOpen = openProductId === item.id
                            const warranty = calculateWarranty(item.saleCreatedAt, item.warrantyDays)

                            return (
                                <div
                                    key={item.id}
                                    className="border border-zinc-200 bg-white rounded-xl transition-all duration-200 shadow-sm overflow-hidden"
                                >
                                    {/* Cabecera del Producto Card */}
                                    <button
                                        onClick={() => toggleProduct(item.id)}
                                        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50"
                                        aria-expanded={isOpen}
                                    >
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                {item.brand}
                                            </span>
                                            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                                                {item.name}
                                            </h2>
                                        </div>

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>

                                    {/* Cuerpo Desplegable (Detalles Expandidos) */}
                                    {isOpen && (
                                        <div className="border-t border-zinc-100 bg-zinc-50/50 p-5 space-y-6 text-sm animate-in fade-in slide-in-from-top-1 duration-200">

                                            {/* Galería de Fotografías */}
                                            {item.photos && item.photos.length > 0 && (
                                                <div className="space-y-2">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Fotografías</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {item.photos.map((photoUrl, idx) => (
                                                            <a
                                                                key={idx}
                                                                href={photoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block overflow-hidden rounded-lg border border-zinc-200 bg-white transition-opacity hover:opacity-90"
                                                            >
                                                                <img
                                                                    src={photoUrl}
                                                                    alt={`${item.name} - ${idx + 1}`}
                                                                    className="h-16 w-16 object-cover"
                                                                />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Detalles generales */}
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Detalles del Producto</h3>
                                                <p className="text-zinc-700 leading-relaxed">{item.details}</p>
                                            </div>

                                            {/* Estado de la Garantía */}
                                            <div className="space-y-1.5">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Garantía Oficial</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium uppercase select-none ${warranty.isActive
                                                        ? "bg-green-50 text-green-700 border border-green-200"
                                                        : "bg-red-50 text-red-700 border border-red-200"
                                                        }`}>
                                                        {warranty.isActive ? "Vigente" : "Expirada"}
                                                    </span>
                                                    <p className="text-xs text-zinc-600">
                                                        {warranty.isActive
                                                            ? `Le quedan ${warranty.daysLeft} días de cobertura.`
                                                            : "El período de cobertura técnica ha finalizado."}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Barras de vida útil de repuestos */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Monitoreo de Componentes</h3>

                                                {(!item.trackedSpareParts || item.trackedSpareParts.length === 0) ? (
                                                    <p className="text-xs text-zinc-400 italic">Este artículo no requiere seguimiento individual de partes.</p>
                                                ) : (
                                                    <div className="space-y-4 bg-white border border-zinc-200/60 rounded-xl p-4 shadow-sm">
                                                        {item.trackedSpareParts.map((part) => {
                                                            const pct = calculateLifePercentage(part.installedAt, part.lifespanDays)
                                                            return (
                                                                <div key={part.id} className="space-y-1.5">
                                                                    <div className="flex items-center justify-between text-xs font-medium">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-zinc-800">{part.name}</span>
                                                                            {part.spareProductId && (
                                                                                <a
                                                                                    href={`/store/products/${part.spareProductId}`}
                                                                                    className="text-[10px] text-zinc-500 hover:text-black underline underline-offset-2 transition-colors"
                                                                                >
                                                                                    Comprar repuesto
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                        <span className={pct < 20 ? "text-red-600 font-bold animate-pulse" : "text-zinc-500"}>
                                                                            {Math.round(pct)}%
                                                                        </span>
                                                                    </div>

                                                                    {/* Barra de progreso */}
                                                                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full transition-all duration-500 ${pct < 20 ? "bg-red-500" : "bg-black"
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
                                                <div className="space-y-2">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                                                        Catálogo General de Repuestos
                                                    </h3>

                                                    {Array.isArray(item.spareParts) ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.spareParts.map((part, idx) => (
                                                                <div
                                                                    key={part.productId || idx}
                                                                    className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-700 shadow-sm"
                                                                >
                                                                    <span className="font-medium text-zinc-900">{part.name}</span>
                                                                    {part.lifespanDays && (
                                                                        <span className="text-[10px] text-zinc-400">
                                                                            (~{part.lifespanDays} días de vida)
                                                                        </span>
                                                                    )}
                                                                    {part.productId && (
                                                                        <a
                                                                            href={`/store/products/${part.productId}`}
                                                                            className="ml-1 text-[10px] font-semibold text-black hover:underline"
                                                                        >
                                                                            Ver en tienda →
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-zinc-600 leading-relaxed">{item.spareParts}</p>
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

            <footer className="w-full border-t border-zinc-200 bg-white px-6 py-8 text-xs text-zinc-400">
                <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <p className="font-semibold text-zinc-900 uppercase tracking-wider text-[10px]">Contacto & Redes</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-black transition-colors">Instagram</a>
                            <a href="#" className="hover:text-black transition-colors">WhatsApp Corporativo</a>
                        </div>
                    </div>
                    <div className="space-y-1 sm:text-right">
                        <p className="font-semibold text-zinc-900 uppercase tracking-wider text-[10px]">Soporte Técnico</p>
                        <a href="mailto:soporte@brief.com" className="hover:text-black transition-colors underline underline-offset-2">
                            soporte@briefplataforma.com
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}