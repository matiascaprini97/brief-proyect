"use client"

import { useState } from "react"
import Link from "next/link"
import { logoutAction } from "@/app/actions/auth"

// Definimos la interfaz para recibir la foto desde el Layout del servidor
interface NavbarProps {
    profilePicture?: string | null
}

export default function Navbar({ profilePicture }: NavbarProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-white/15 bg-black/50 px-6 py-3.5 backdrop-blur-2xl select-none text-white transition-all">
            {/* Grilla de 3 columnas para asegurar el centrado perfecto */}
            <div className="mx-auto flex max-w-7xl items-center justify-between md:grid md:grid-cols-3">

                {/* Columna Izquierda: Espacio vacío para balancear el centrado en desktop */}
                <div className="hidden md:block" />

                {/* Columna Central: Logo oficial e Identidad */}
                <div className="flex justify-start md:justify-center">
                    <Link
                        href="/"
                        className="group flex items-center gap-3 transition-transform duration-200 active:scale-[0.98]"
                    >
                        <img
                            src="/uploads/BLACK.jpeg"
                            alt="PHIIT Equipments Logo"
                            className="h-9 w-9 rounded-xl object-cover border border-white/20 shadow-md group-hover:border-fuchsia-500 transition-colors"
                        />
                        <span className="text-base font-black uppercase tracking-widest text-white">
                            PHIIT <span className="font-light text-zinc-400 group-hover:text-fuchsia-400 transition-colors">EQUIPMENTS</span>
                        </span>
                    </Link>
                </div>

                {/* Columna Derecha: Menú de Usuario */}
                <div className="relative flex justify-end">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10 hover:border-fuchsia-500/50 active:scale-95 overflow-hidden shadow-sm"
                        aria-expanded={isDropdownOpen}
                    >
                        {/* CONDICIONAL: Si hay foto, la muestra; si no, muestra el SVG por defecto */}
                        {profilePicture ? (
                            <img
                                src={profilePicture}
                                alt="Foto de perfil"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                                className="h-5 w-5 text-zinc-300"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                            </svg>
                        )}
                    </button>

                    {/* PANEL DESPLEGABLE (DROPDOWN) */}
                    {isDropdownOpen && (
                        <>
                            {/* Fondo invisible para cerrar el menú haciendo clic afuera */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsDropdownOpen(false)}
                            />

                            <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-white/20 bg-black/80 p-2 backdrop-blur-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">

                                <Link
                                    href="/perfil"
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-zinc-200 transition-all hover:bg-white/10 hover:text-fuchsia-400"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-4 h-4"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                    Editar Perfil
                                </Link>

                                <div className="my-1.5 border-t border-white/15" />

                                <button
                                    onClick={async () => {
                                        setIsDropdownOpen(false)
                                        await logoutAction()
                                    }}
                                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className="w-4 h-4"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                                    </svg>
                                    Cerrar Sesión
                                </button>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </nav>
    )
}