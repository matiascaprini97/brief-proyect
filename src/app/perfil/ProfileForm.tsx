"use client"

import { useState, useRef } from "react"
import { updateProfileAction } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Avatar SVG adaptado a la paleta Dark Mode de PHIIT
const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'><rect width='100%25' height='100%25' fill='%2327272a'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"

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
        <div className="max-w-2xl mx-auto p-8 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl transition-all">
            <h2 className="text-2xl font-black mb-1 text-white uppercase tracking-tight">
                CONFIGURACIÓN <span className="text-fuchsia-500 italic">DEL PERFIL</span>
            </h2>
            <p className="text-sm text-zinc-300 font-medium mb-8">
                Actualizá tu información personal y credenciales de acceso.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* AVATAR INTERACTIVO */}
                <div className="flex flex-col items-center justify-center space-y-3 pb-2">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative w-28 h-28 rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-neutral-900 cursor-pointer flex items-center justify-center transition-all hover:border-fuchsia-500"
                    >
                        <img
                            src={imagePreview || FALLBACK_AVATAR}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover group-hover:opacity-30 transition-opacity"
                            onError={(e) => {
                                e.currentTarget.src = FALLBACK_AVATAR
                            }}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="w-6 h-6 mb-1 text-fuchsia-400"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                            </svg>
                            <span className="text-[10px] font-black uppercase tracking-wider text-center px-1">
                                Cambiar
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
                    <p className="text-xs text-zinc-400 font-medium">Hacé clic en el avatar para seleccionar una foto</p>
                </div>

                {/* GRILLA: Nombre y Apellido */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">Nombre</label>
                        <input
                            type="text"
                            name="firstName"
                            defaultValue={initialData.firstName || ""}
                            className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 bg-black/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">Apellido</label>
                        <input
                            type="text"
                            name="lastName"
                            defaultValue={initialData.lastName || ""}
                            className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 bg-black/50 transition-all"
                        />
                    </div>
                </div>

                {/* GRILLA: Usuario y Email */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">Nombre de Usuario</label>
                        <input
                            type="text"
                            name="username"
                            required
                            defaultValue={initialData.username}
                            className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 bg-black/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            name="email"
                            defaultValue={initialData.email || ""}
                            className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 bg-black/50 transition-all"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>
                </div>

                {/* TELÉFONO */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">Teléfono</label>
                    <input
                        type="text"
                        name="phoneNumber"
                        defaultValue={initialData.phoneNumber || ""}
                        className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 bg-black/50 transition-all"
                        placeholder="Ej: +54 11 1234-5678"
                    />
                </div>

                <div className="my-8 border-t border-white/15" />
                <h3 className="text-base font-black uppercase tracking-tight text-white mb-4">
                    SEGURIDAD <span className="text-fuchsia-400 font-normal italic text-sm">(Cambiar Contraseña)</span>
                </h3>

                {/* GRILLA: Contraseñas */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            name="newPassword"
                            autoComplete="new-password"
                            className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 bg-black/50 transition-all"
                            placeholder="Dejar en blanco para no cambiar"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-300 mb-1.5">
                            Contraseña Actual
                        </label>
                        <input
                            type="password"
                            name="currentPassword"
                            autoComplete="current-password"
                            className="w-full px-4 py-2.5 border border-white/20 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 bg-black/50 transition-all"
                            placeholder="Requerido solo si vas a cambiarla"
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm font-semibold">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold">
                        ¡Perfil actualizado correctamente en la base de datos!
                    </div>
                )}

                <div className="flex justify-end items-center pt-4 gap-3">
                    <Link
                        href="/"
                        className="px-5 py-2.5 border border-white/20 hover:bg-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95"
                    >
                        Cancelar
                    </Link>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-7 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-zinc-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer"
                    >
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
    )
}