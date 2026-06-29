"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const handleLogout = () => {
        // Por ahora simulamos el cierre de sesión, luego le metemos la lógica real
        alert("Cerrando sesión...")
    }

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/80 px-6 py-3 backdrop-blur-md select-none text-black">
            {/* Grilla de 3 columnas para asegurar el centrado perfecto */}
            <div className="mx-auto flex max-w-7xl grid-cols-3 items-center justify-between md:grid">

                {/* Columna Izquierda: Espacio vacío para balancear el centrado */}
                <div className="hidden md:block" />

                {/* Columna Central: Logo e Inicio */}
                <div className="flex justify-start md:justify-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 transition-opacity hover:opacity-80 active:scale-[0.98]"
                    >
                        {/* Reemplazá por tu logo real cuando lo tengas */}
                        <div className="h-6 w-6 rounded bg-black flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white uppercase">B</span>
                        </div>
                        <span className="text-sm font-bold uppercase tracking-widest">
                            Brief Plataforma
                        </span>
                    </Link>
                </div>

                {/* Columna Derecha: Menú de Usuario */}
                <div className="relative flex justify-end">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 transition-colors hover:bg-zinc-100 active:scale-95"
                        aria-expanded={isDropdownOpen}
                    >
                        {/* Icono de usuario nativo en SVG para no depender de librerías extras por ahora */}
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5 text-zinc-600"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </button>

                    {/* PANEL DESPLEGABLE (DROPDOWN) */}
                    {isDropdownOpen && (
                        <>
                            {/* Fondo invisible para cerrar el menú haciendo clic afuera */}
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsDropdownOpen(false)}
                            />

                            <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false)
                                        alert("Ir a editar perfil")
                                    }}
                                    className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50"
                                >
                                    Editar Perfil
                                </button>

                                <div className="my-1 border-t border-zinc-100" />

                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false)
                                        handleLogout()
                                    }}
                                    className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
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