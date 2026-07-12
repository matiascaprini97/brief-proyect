"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function AdminVentasPage() {

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

    // Estados del formulario mockeado
    const [selectedUser, setSelectedUser] = useState("")
    const [selectedProduct, setSelectedProduct] = useState("")
    const [customWarranty, setCustomWarranty] = useState("365")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        alert(`Simulación: Venta registrada con éxito.\nProducto: ${selectedProduct}\nUsuario: ${selectedUser}\nGarantía: ${customWarranty} días.`)
    }

    return (
        <div className="flex min-h-screen flex-col bg-white text-black antialiased font-sans">
            <Navbar profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
                <Link href="/admin" className="text-xs font-semibold text-zinc-400 hover:text-black flex items-center gap-1 mb-6 transition-colors w-fit">
                    ← Volver al Panel
                </Link>

                <div className="mb-8 space-y-1">
                    <h1 className="text-xl font-bold tracking-tighter uppercase">Asentar Nueva Venta</h1>
                    <p className="text-xs text-zinc-500">Vinculá equipos de fábrica a las cuentas de los clientes para activar sus sistemas de monitoreo automáticos.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Formulario Principal */}
                    <form onSubmit={handleSubmit} className="md:col-span-2 space-y-5 border border-zinc-200 p-6 rounded-xl shadow-sm bg-white">

                        {/* 1. Seleccionar Cliente */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Asignar a Cliente</label>
                            <select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="w-full text-sm border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/50 p-2.5 rounded-lg focus:outline-none focus:border-black font-medium transition-colors"
                                required
                            >
                                <option value="">Seleccionar un titular...</option>
                                <option value="marisa">Marisa Pilates (marisa@estudiopilates.com)</option>
                                <option value="flow">Estudio Flow Córdoba (contacto@flow.com)</option>
                            </select>
                        </div>

                        {/* 2. Seleccionar Producto */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Equipo Adquirido</label>
                            <select
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                                className="w-full text-sm border border-zinc-200 bg-zinc-50 hover:bg-zinc-100/50 p-2.5 rounded-lg focus:outline-none focus:border-black font-medium transition-colors"
                                required
                            >
                                <option value="">Seleccionar máquina o ítem técnico...</option>
                                <option value="reformer_pro">Cama Pilates Reformer Pro (Brief)</option>
                                <option value="wood_classic">Reformer Classic Wood (Brief)</option>
                            </select>
                        </div>

                        {/* 3. Días de Garantía */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Días de Garantía Especial</label>
                            <input
                                type="number"
                                value={customWarranty}
                                onChange={(e) => setCustomWarranty(e.target.value)}
                                className="w-full text-sm border border-zinc-200 bg-zinc-50 p-2.5 rounded-lg focus:outline-none focus:border-black font-mono transition-colors"
                                placeholder="Ej: 365"
                                required
                            />
                            <p className="text-[11px] text-zinc-400">Por defecto se hereda la garantía de fábrica, modificá este campo si ofreciste una extensión especial.</p>
                        </div>

                        {/* Botón Guardar */}
                        <button type="submit" className="w-full bg-black text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-lg hover:bg-zinc-800 transition-colors pt-3">
                            Confirmar Operación e Iniciar Monitoreo
                        </button>
                    </form>

                    {/* Sidebar Informativo */}
                    <div className="space-y-4 bg-zinc-50/60 border border-zinc-200/80 p-5 rounded-xl h-fit">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">Automatización</h3>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Al confirmar la transacción, la plataforma generará automáticamente la estructura temporal para que el cliente pueda ver su garantía restante en el home.
                        </p>
                        <div className="border-t border-zinc-200/60 pt-3">
                            <span className="text-[10px] bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded font-mono font-bold">
                                POSTGRES RELATIONAL
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="w-full border-t border-zinc-100 bg-white py-4 text-center text-[10px] uppercase tracking-wider text-zinc-400 select-none">
                Brief Plataforma — Registro Operativo
            </footer>
        </div>
    )
}