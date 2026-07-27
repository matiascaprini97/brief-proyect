"use client"

import { useState, useRef } from "react"
import { updateProfileAction } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Avatar SVG en Base64 autolimpiable que jamás dará un error 404
const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'><rect width='100%25' height='100%25' fill='%23f4f4f5'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"

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
    const [imagePreview, setImagePreview] = useState<string | null>(initialData.profilePicture)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)
        }
    }

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
            router.refresh()
            router.push("/")
        }
    }

    return (
        <div className="max-w-2xl mx-auto mt-8 p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold mb-1 text-zinc-900">Configuración del Perfil</h2>
            <p className="text-sm text-zinc-500 mb-6">Actualizá tu información personal y credenciales de acceso.</p>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* AVATAR INTERACTIVO */}
                <div className="flex flex-col items-center justify-center space-y-2 pb-2">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative w-24 h-24 rounded-full overflow-hidden border border-zinc-300 shadow-sm bg-zinc-100 cursor-pointer flex items-center justify-center"
                    >
                        <img
                            src={imagePreview || FALLBACK_AVATAR}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                            onError={(e) => {
                                e.currentTarget.src = FALLBACK_AVATAR
                            }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white">
                            <span className="text-[10px] font-bold uppercase tracking-tighter text-center px-1">
                                Cambiar Foto
                            </span>
                        </div>
                    </div>

                    {/* Input nativo de archivo (Oculto) */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        name="image"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <p className="text-[11px] text-zinc-400 font-medium">Hacé clic en el avatar para subir una foto desde tu dispositivo</p>
                </div>

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

                {/* TELÉFONO */}
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
                            autoComplete="new-password"
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
                            autoComplete="current-password"
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
                    <Link
                        href="/"
                        className="px-4 py-1.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-500 text-xs font-medium rounded-lg transition-colors active:scale-95"
                    >
                        Cancelar
                    </Link>

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