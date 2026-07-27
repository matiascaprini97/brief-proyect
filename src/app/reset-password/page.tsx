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
                setError(result.error || "Ocurrió un error")
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
            <div className="text-center space-y-4">
                <p className="text-sm text-red-600 font-medium">El enlace de recuperación es inválido o faltan parámetros.</p>
                <button
                    onClick={() => router.push("/")}
                    className="text-xs text-black underline font-semibold"
                >
                    Ir al inicio
                </button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md border border-zinc-200/80 bg-white/90 p-8 shadow-2xl backdrop-blur-xl rounded-2xl z-10">
            <div className="mb-6 space-y-2 text-center">
                <h1 className="text-xl font-bold tracking-tighter uppercase">Nueva Contraseña</h1>
                <p className="text-sm text-zinc-500">Escribí tu nueva clave de acceso para actualizar tu cuenta</p>
            </div>

            {success ? (
                <div className="space-y-4 text-center">
                    <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-xl">
                        ¡Contraseña actualizada con éxito! Redirigiendo al inicio de sesión...
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Nueva Contraseña
                        </label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm transition-all placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black rounded-xl"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Confirmar Contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm transition-all placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black rounded-xl"
                        />
                    </div>

                    {error && (
                        <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-black py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-900 active:scale-[0.99] disabled:bg-zinc-300 rounded-xl shadow-sm"
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
        <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-black antialiased">
            <Suspense fallback={<p className="text-sm text-zinc-500">Cargando...</p>}>
                <ResetPasswordForm />
            </Suspense>
        </main>
    )
}