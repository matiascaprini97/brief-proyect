"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function AdminPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)

    // Traemos la foto del admin para la navbar, igual que en el cliente
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

    // Definimos las secciones de gestión para renderizarlas en lista
    const managementOptions = [
        {
            id: "ventas",
            title: "Registrar Venta",
            description: "Asentar nuevas operaciones de compra, facturación y vinculación de equipos.",
            href: "/admin/ventas",
        },
        {
            id: "usuarios",
            title: "Gestión de Usuarios",
            description: "Administrar cuentas de clientes, roles, permisos y datos de contacto.",
            href: "/admin/usuarios",
        },
        {
            id: "productos",
            title: "Gestión de Productos",
            description: "Controlar el inventario, catálogo de artículos técnicos y repuestos disponibles.",
            href: "/admin/productos",
        },
    ]

    return (
        <div
            className="flex min-h-screen flex-col bg-white text-black antialiased font-sans"
            style={{ scrollbarGutter: "stable" }}
        >
            {/* NAVBAR REUTILIZABLE */}
            <Navbar profilePicture={profilePicture} />

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">

                {/* Encabezado del Admin */}
                <div className="mb-10 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
                        Modo Administrador
                    </span>
                    <h1 className="text-2xl font-bold tracking-tighter uppercase pt-1">
                        Panel de Control
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Consola central de supervisión y gestión operativa de la plataforma.
                    </p>
                </div>

                {/* LISTA DE BOTONES DE GESTIÓN (ESTILO CLIENTE) */}
                <div className="space-y-3">
                    {managementOptions.map((option) => (
                        <Link
                            key={option.id}
                            href={option.href}
                            className="group flex w-full items-center justify-between border border-zinc-200 bg-white p-5 rounded-xl transition-all duration-200 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.99]"
                        >
                            <div className="space-y-1 text-left pr-4">
                                <h2 className="text-base font-semibold tracking-tight text-zinc-900 group-hover:text-black">
                                    {option.title}
                                </h2>
                                <p className="text-xs text-zinc-500 leading-relaxed max-w-xl">
                                    {option.description}
                                </p>
                            </div>

                            {/* Flecha indicadora (Chevron derecho) que denota navegación */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-4 w-4 text-zinc-400 transition-transform duration-200 group-hover:text-black group-hover:translate-x-1"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l6 6m0 0l-6 6m6-6H3" />
                            </svg>
                        </Link>
                    ))}
                </div>
            </main>

            {/* FOOTER ULTRA MINIMALISTA Y FIJO */}
            <footer className="w-full border-t border-zinc-100 bg-white py-4 text-center text-[10px] uppercase tracking-wider text-zinc-400 select-none">
                Brief Plataforma — Panel de Administración
            </footer>
        </div>
    )
}