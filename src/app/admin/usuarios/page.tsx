"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

interface UserMock {
    id: string
    name: string
    email: string
    role: "CLIENT" | "ADMIN"
    createdAt: string
}

export default function AdminUsuariosPage() {
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

    const [users, setUsers] = useState<UserMock[]>([
        { id: "u1", name: "Marisa Pilates", email: "marisa@estudiopilates.com", role: "CLIENT", createdAt: "12/05/2025" },
        { id: "u2", name: "Tomás Administrador", email: "tomas@brief.com", role: "ADMIN", createdAt: "01/02/2025" },
        { id: "u3", name: "Estudio Flow Córdoba", email: "contacto@flow.com", role: "CLIENT", createdAt: "20/06/2025" },
    ])

    return (
        <div className="flex min-h-screen flex-col bg-white text-black antialiased font-sans">
            <Navbar profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
                <Link href="/admin" className="text-xs font-semibold text-zinc-400 hover:text-black flex items-center gap-1 mb-6 transition-colors w-fit">
                    ← Volver al Panel
                </Link>

                <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tighter uppercase">Control de Usuarios</h1>
                        <p className="text-xs text-zinc-500">Gestioná las cuentas de clientes y los niveles de acceso del personal técnico.</p>
                    </div>
                    <button className="bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm">
                        + Registrar Usuario
                    </button>
                </div>

                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                <th className="p-4">Nombre / Empresa</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-sm">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-zinc-900">{user.name}</div>
                                        <div className="text-[11px] text-zinc-400 font-mono">Alta: {user.createdAt}</div>
                                    </td>
                                    <td className="p-4 text-zinc-600 font-mono text-xs">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${user.role === "ADMIN" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-800"
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-xs font-semibold text-zinc-400 hover:text-black transition-colors">
                                            Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            <footer className="w-full border-t border-zinc-100 bg-white py-4 text-center text-[10px] uppercase tracking-wider text-zinc-400 select-none">
                Brief Plataforma — Módulo de Identidad
            </footer>
        </div>
    )
}