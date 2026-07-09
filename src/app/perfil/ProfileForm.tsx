"use client"

import { useState } from "react"
import { updateProfileAction } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ProfileFormProps {
    initialData: {
        username: string
        firstName: string | null
        lastName: string | null
        phoneNumber: string | null
        email: string | null
        profilePicture: string | null
    }
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const router = useRouter() // 👈 2. Inicializamos el hook adentro del componente

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(false)
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const result = await updateProfileAction(formData)

        setLoading(false)
        if (!result.success) {
            setError(result.error || "Ocurrió un error inesperado")
        } else {
            setSuccess(true)

            // 👈 3. ¡LA MAGIA ACÁ!
            // Avisamos a Next.js que refresque los datos del servidor (por si cambió el nombre en la Navbar)
            router.refresh()

            // Te manda directo al Home ("/")
            router.push("/")
        }
    }

    return (
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-1 text-zinc-900">Configuración del Perfil</h2>
            <p className="text-sm text-zinc-500 mb-6">Actualizá tu información personal y credenciales de acceso.</p>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* GRILLA: Nombre y Apellido */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">Nombre</label>
                        <input
                            type="text"
                            name="firstName"
                            defaultValue={initialData.firstName || ""}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">Apellido</label>
                        <input
                            type="text"
                            name="lastName"
                            defaultValue={initialData.lastName || ""}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                        />
                    </div>
                </div>

                {/* GRILLA: Usuario y Email */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">Nombre de Usuario</label>
                        <input
                            type="text"
                            name="username"
                            required
                            defaultValue={initialData.username}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            defaultValue={initialData.email || ""}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                </div>

                {/* GRILLA: Teléfono y Foto de Perfil */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">Teléfono</label>
                        <input
                            type="text"
                            name="phoneNumber"
                            defaultValue={initialData.phoneNumber || ""}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                            placeholder="Ej: +54 11 1234-5678"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">URL de Foto de Perfil</label>
                        <input
                            type="text"
                            name="profilePicture"
                            defaultValue={initialData.profilePicture || ""}
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                            placeholder="https://enlace-a-tu-foto.com/imagen.jpg"
                        />
                    </div>
                </div>

                <div className="my-6 border-t border-zinc-100" />
                <h3 className="text-sm font-bold text-zinc-900 mb-3">Seguridad (Cambiar Contraseña)</h3>

                {/* GRILLA: Contraseñas */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            autoComplete="new-password" // 👈 ¡ESTA ES LA MAGIA! Le dice al navegador: "Es una contraseña NUEVA, no me autocompletes la vieja acá"
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                            placeholder="Dejar en blanco para no cambiar"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                            Contraseña Actual
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            autoComplete="current-password" // 👈 Por buenas prácticas, acá le avisamos que va la contraseña actual
                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-none focus:border-black bg-white"
                            placeholder="Requerido solo si vas a cambiarla"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
                        ¡Perfil actualizado correctamente en tu base de datos!
                    </div>
                )}

                <div className="flex justify-end items-center pt-2 gap-2">

                    {/* Botón de Cancelar: más pequeño, gris y a la izquierda */}
                    <Link
                        href="/"
                        className="px-4 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 text-xs font-medium rounded-lg transition-colors active:scale-95"
                    >
                        Cancelar
                    </Link>

                    {/* Tu botón de Guardar Cambios de siempre */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-black hover:bg-zinc-800 disabled:bg-zinc-400 text-white text-sm font-medium rounded-lg transition-colors active:scale-[0.98]"
                    >
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
    )
}