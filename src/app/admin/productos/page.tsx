"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

interface ProductMock {
    id: string
    brand: string
    name: string
    warrantyDays: number
    category: string
}

export default function AdminProductosPage() {


    const [profilePicture, setProfilePicture] = useState<string | null>(null)

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/client/profile")
                if (res.ok) {
                    const data = await res.json()
                    setProfilePicture(data.profilePicture)
                }
            } catch (error) {
                console.error("Error al cargar perfil del admin:", error)
            }
        }
        fetchProfile()
    }, [])

    const [products, setProducts] = useState<ProductMock[]>([
        { id: "1", brand: "Brief", name: "Cama Pilates Reformer Pro", warrantyDays: 365, category: "Equipos" },
        { id: "2", brand: "Brief", name: "Reformer Classic Wood", warrantyDays: 180, category: "Equipos" },
        { id: "3", brand: "Brief", name: "Resorte Rojo (Tensión Alta)", warrantyDays: 90, category: "Repuestos" },
    ])

    return (
        <div className="flex min-h-screen flex-col bg-white text-black antialiased font-sans">
            <Navbar profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
                {/* Botón Volver */}
                <Link href="/admin" className="text-xs font-semibold text-zinc-400 hover:text-black flex items-center gap-1 mb-6 transition-colors w-fit">
                    ← Volver al Panel
                </Link>

                {/* Encabezado */}
                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tighter uppercase">Catálogo de Productos</h1>
                        <p className="text-xs text-zinc-500">Administrá el inventario de equipos y componentes bajo monitoreo.</p>
                    </div>
                    <button className="bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm">
                        + Nuevo Producto
                    </button>
                </div>

                {/* Tabla de Productos */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                <th className="p-4">Producto</th>
                                <th className="p-4">Categoría</th>
                                <th className="p-4">Garantía Base</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-sm">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-zinc-900">{product.name}</div>
                                        <div className="text-[11px] text-zinc-400 font-mono">{product.brand}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-medium">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="p-4 font-mono text-zinc-600">{product.warrantyDays} días</td>
                                    <td className="p-4 text-right">
                                        <button className="text-xs font-semibold text-zinc-400 hover:text-black transition-colors">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <footer className="w-full border-t border-zinc-100 bg-white py-4 text-center text-[10px] uppercase tracking-wider text-zinc-400 select-none">
                Brief Plataforma — Módulo de Inventario
            </footer>
        </div>
    )
}