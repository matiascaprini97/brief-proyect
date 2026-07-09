"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/Navbar"

interface Product {
    id: string
    brand: string
    name: string
    details: string
    spareParts: string | null
    photos: string[]
}

export default function ClientPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [profilePicture, setProfilePicture] = useState<string | null>(null) // 👈 1. Estado para la foto de perfil
    const [loading, setLoading] = useState<boolean>(true)
    const [openProductId, setOpenProductId] = useState<string | null>(null)

    // Cargamos los productos y la foto real desde nuestra API al montar el componente
    useEffect(() => {
        async function fetchInitialData() {
            try {
                // 2. Ejecutamos ambas consultas en paralelo para que cargue super rápido
                const [productsRes, profileRes] = await Promise.all([
                    fetch("/api/client/products"),
                    fetch("/api/client/profile") // Enlace a nuestra nueva mini API
                ])

                if (productsRes.ok) {
                    const productsData = await productsRes.json()
                    setProducts(productsData)
                }

                if (profileRes.ok) {
                    const profileData = await profileRes.json()
                    setProfilePicture(profileData.profilePicture) // Guardamos la URL de la foto
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

    return (
        <div
            className="flex min-h-screen flex-col bg-white text-black antialiased font-sans"
            style={{ scrollbarGutter: "stable" }}>

            {/* 3. LE PASAMOS LA FOTO AL NAVBAR */}
            <Navbar profilePicture={profilePicture} />

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">

                {/* Encabezado de la página */}
                <div className="mb-10 space-y-1">
                    <h1 className="text-2xl font-bold tracking-tighter uppercase">Mis Artículos</h1>
                    <p className="text-sm text-zinc-500">Historial de equipamiento técnico vinculado a tus compras.</p>
                </div>

                {/* MANEJO DE ESTADOS DE CARGA Y LISTA */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
                        <p className="text-xs text-zinc-400 uppercase tracking-wider">Sincronizando con Supabase...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500">
                        No se encontraron artículos técnicos vinculados a tu cuenta de cliente.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {products.map((product) => {
                            const isOpen = openProductId === product.id

                            return (
                                <div
                                    key={product.id}
                                    className="border border-zinc-200 bg-white rounded-xl transition-all duration-200 shadow-sm overflow-hidden"
                                >
                                    {/* Cabecera del Producto (Botón para abrir/cerrar) */}
                                    <button
                                        onClick={() => toggleProduct(product.id)}
                                        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50"
                                        aria-expanded={isOpen}
                                    >
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                                {product.brand}
                                            </span>
                                            <h2 className="text-base font-semibold tracking-tight text-zinc-900">
                                                {product.name}
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

                                    {/* Cuerpo Desplegable */}
                                    {isOpen && (
                                        <div className="border-t border-zinc-100 bg-zinc-50/50 p-5 space-y-5 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div className="space-y-1">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Detalles del Producto</h3>
                                                <p className="text-zinc-700 leading-relaxed">{product.details}</p>
                                            </div>

                                            {product.spareParts && (
                                                <div className="space-y-1">
                                                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Repuestos & Partes Opcionales</h3>
                                                    <p className="text-zinc-700 leading-relaxed">{product.spareParts}</p>
                                                </div>
                                            )}

                                            <div className="space-y-1.5">
                                                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Galería Visual</h3>
                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                                    <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-100/50 p-4 text-center text-xs text-zinc-400">
                                                        Imagen del componente
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>

            {/* FOOTER MINIMALISTA */}
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