// src/app/reset-password/page.tsx
"use client"

import { useState, useTransition, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { resetPasswordAction } from "@/app/actions/auth"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)

        const formData = new FormData(e.currentTarget)
        const newPassword = formData.get("newPassword") as string
        const confirmPassword = formData.get("confirmPassword") as string

        if (!token) {
            setError("Token de recuperación ausente o inválido.")
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.")
            return
        }

        startTransition(async () => {
            const result = await resetPasswordAction(token, newPassword)

            if (!result.success) {
                setError(result.error || "Ocurrió un error al restablecer la contraseña.")
            } else {
                setSuccess(true)
                setTimeout(() => {
                    router.push("/")
                }, 2500)
            }
        })
    }

    if (!token) {
        return (
            <div className="w-full max-w-md border border-white/20 bg-black/50 p-8 shadow-2xl backdrop-blur-2xl rounded-3xl z-10 text-center space-y-5">
                <p className="text-sm text-red-400 font-bold uppercase tracking-wider">
                    El enlace de recuperación es inválido o ha expirado.
                </p>
                <button
                    onClick={() => router.push("/")}
                    className="inline-block px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-white/20"
                >
                    Ir al inicio
                </button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md border border-white/20 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl rounded-3xl z-10">

            {/* Header / Brand Logo */}
            <div className="mb-8 text-center space-y-3">
                <div className="flex justify-center">
                    <img
                        src="/uploads/BLACK.jpeg"
                        alt="PHIIT Equipments"
                        className="h-12 w-12 rounded-xl object-cover border border-white/20 shadow-md"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-white uppercase">
                        NUEVA <span className="text-fuchsia-500 italic">CONTRASEÑA</span>
                    </h1>
                    <p className="text-xs text-zinc-300 font-medium mt-1">
                        Ingresá tu nueva clave de acceso para actualizar tu cuenta PHIIT.
                    </p>
                </div>
            </div>

            {success ? (
                <div className="space-y-4 text-center">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-5 py-4 rounded-2xl backdrop-blur-md">
                        ¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="newPassword" className="text-xs font-black uppercase tracking-widest text-zinc-300 block">
                            Nueva Contraseña
                        </label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full border border-white/20 bg-black/50 px-4 py-3 text-sm text-white transition-all placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-zinc-300 block">
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full border border-white/20 bg-black/50 px-4 py-3 text-sm text-white transition-all placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 rounded-xl"
                        />
                    </div>

                    {error && (
                        <div className="text-xs font-bold text-red-300 bg-red-500/20 border border-red-500/40 px-4 py-3 rounded-xl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-fuchsia-600 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-fuchsia-500 active:scale-[0.98] disabled:bg-zinc-600 rounded-xl shadow-lg cursor-pointer"
                    >
                        {isPending ? "Guardando..." : "Guardar Nueva Contraseña"}
                    </button>
                </form>
            )}
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <main className="relative flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white antialiased select-none">
            {/* FONDO DIFUMINADO CLARO Y VISIBLE */}
            <div
                className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat filter blur-lg scale-105 opacity-55 pointer-events-none"
                style={{ backgroundImage: "url('/uploads/Wallpaper.jpeg')" }}
            />
            <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />

            <Suspense fallback={<p className="text-xs font-black uppercase tracking-widest text-zinc-300 animate-pulse">Cargando...</p>}>
                <ResetPasswordForm />
            </Suspense>
        </main>
    )
}