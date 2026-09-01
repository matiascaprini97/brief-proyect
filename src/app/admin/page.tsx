"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

export default function AdminPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)

    // Traemos la foto del admin para la navbar
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

    // Definimos las secciones de gestión con sus íconos representativos
    const managementOptions = [
        {
            id: "ventas",
            title: "Registrar Venta",
            description: "Asentar nuevas operaciones de compra, facturación y vinculación de equipos.",
            href: "/admin/ventas",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-lime-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a1.5 1.5 0 0 1 1.5 1.5v9.75a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6a1.5 1.5 0 0 1 1.5-1.5Zm13.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM6 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75A.75.75 0 0 1 6 12Zm0-3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75A.75.75 0 0 1 6 9Z" />
                </svg>
            ),
        },
        {
            id: "usuarios",
            title: "Gestión de Usuarios",
            description: "Administrar cuentas de clientes, roles, permisos y datos de contacto.",
            href: "/admin/usuarios",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-lime-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6 0 3.375 3.375 0 0 1 6 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
            ),
        },
        {
            id: "productos",
            title: "Gestión de Productos",
            description: "Controlar el inventario, catálogo de artículos técnicos y repuestos disponibles.",
            href: "/admin/productos",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5 text-lime-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
            ),
        },
    ]

    return (
        <div className="relative flex min-h-screen flex-col bg-neutral-950 text-white antialiased select-none">
            {/* FONDO DIFUMINADO CLARO Y VISIBLE */}
            <div
                className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat filter blur-lg scale-105 opacity-55 pointer-events-none"
                style={{ backgroundImage: "url('/uploads/Wallpaper.jpeg')" }}
            />
            <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />

            {/* NAVBAR REUTILIZABLE */}
            <Navbar isAdmin={true} profilePicture={profilePicture} />

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12 z-10">

                {/* Encabezado del Admin */}
                <div className="mb-8 space-y-2">
                    <div>
                        <span className="inline-block border border-lime-400/40 bg-lime-400/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-lime-300 backdrop-blur-md">
                            Modo Administrador
                        </span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight uppercase text-white">
                        PANEL DE <span className="text-lime-400 italic">CONTROL</span>
                    </h1>
                    <p className="text-xs text-zinc-300 font-medium">
                        Consola central de supervisión y gestión operativa de la plataforma PHIIT.
                    </p>
                </div>

                {/* LISTA DE BOTONES DE GESTIÓN */}
                <div className="space-y-4">
                    {managementOptions.map((option) => (
                        <Link
                            key={option.id}
                            href={option.href}
                            className="group flex w-full items-center justify-between border border-white/20 bg-black/40 p-6 rounded-2xl backdrop-blur-2xl transition-all duration-200 shadow-xl hover:border-lime-400/50 hover:bg-black/60 active:scale-[0.99]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 group-hover:border-lime-400/40 group-hover:bg-lime-400/10 transition-colors">
                                    {option.icon}
                                </div>
                                <div className="space-y-1 text-left">
                                    <h2 className="text-base font-black tracking-wider uppercase text-white group-hover:text-lime-400 transition-colors">
                                        {option.title}
                                    </h2>
                                    <p className="text-xs text-zinc-300 leading-relaxed max-w-xl font-medium">
                                        {option.description}
                                    </p>
                                </div>
                            </div>

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-5 w-5 text-zinc-400 transition-all duration-200 group-hover:text-lime-400 group-hover:translate-x-1 shrink-0 ml-4"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l6 6m0 0l-6 6m6-6H3" />
                            </svg>
                        </Link>
                    ))}
                </div>
            </main>

            {/* FOOTER ULTRA MINIMALISTA */}
            <footer className="w-full border-t border-white/10 bg-black/50 backdrop-blur-xl py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 select-none z-10">
                PHIIT Equipments — Panel de Administración
            </footer>
        </div>
    )
}