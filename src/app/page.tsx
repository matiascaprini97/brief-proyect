"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { loginAction, requestPasswordResetAction } from "@/app/actions/auth"

export default function Home() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Modos: 'login' o 'forgot'
  const [view, setView] = useState<"login" | "forgot">("login")

  // Estados de formularios
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Login Handler
  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    const formData = new FormData(event.currentTarget)

    startTransition(async () => {
      const result = await loginAction(formData)

      if (!result.success) {
        setError(result.error || "Algo salió mal")
        return
      }

      if (result.role === "ADMIN") {
        router.push("/admin")
      } else if (result.role === "CLIENT") {
        router.push("/client")
      }
    })
  }

  // Forgot Password Handler
  const handleForgotSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const formData = new FormData(event.currentTarget)
    const email = formData.get("resetEmail") as string

    startTransition(async () => {
      const result = await requestPasswordResetAction(email)

      if (!result.success) {
        setError(result.error || "Ocurrió un error")
      } else {
        setSuccessMessage(result.message || "Solicitud enviada con éxito.")
      }
    })
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-50 px-4 text-black antialiased overflow-hidden">

      {/* SIMULACIÓN DE LA HOME INTERNA (DIFUMINADA PERO RECONOCIBLE) */}
      <div className="absolute inset-0 flex flex-col p-6 md:p-12 filter blur-md opacity-100 select-none pointer-events-none">
        {/* Navbar Fantasma */}
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-5 w-full">
          <div className="h-6 w-28 bg-zinc-300 rounded-md" />
          <div className="flex gap-6">
            <div className="h-4 w-16 bg-zinc-300 rounded" />
            <div className="h-4 w-20 bg-zinc-300 rounded" />
            <div className="h-4 w-16 bg-zinc-300 rounded" />
          </div>
          <div className="h-9 w-9 bg-zinc-300 rounded-full" />
        </div>

        {/* Título Principal */}
        <div className="mt-12 space-y-3 max-w-xl">
          <div className="h-9 w-3/4 bg-zinc-300 rounded-lg" />
          <div className="h-4 w-1/2 bg-zinc-200 rounded-md" />
        </div>

        {/* Grilla de Muestra */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full flex-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border-2 border-zinc-200 p-5 rounded-xl space-y-4 bg-zinc-100 shadow-sm">
              <div className="h-40 w-full bg-zinc-200 rounded-lg" />
              <div className="space-y-2.5">
                <div className="h-5 w-2/3 bg-zinc-300 rounded" />
                <div className="h-3 w-full bg-zinc-200 rounded" />
                <div className="h-3 w-5/6 bg-zinc-200 rounded" />
              </div>
              <div className="h-9 w-24 bg-zinc-400 rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL PRINCIPAL (FLOTANTE Y NÍTIDO) */}
      <div className="w-full max-w-md border border-zinc-200/80 bg-white/90 p-8 shadow-2xl backdrop-blur-xl rounded-2xl z-10 transition-all">

        {view === "login" ? (
          /* ================= VISTA: LOGIN ================= */
          <>
            <div className="mb-8 space-y-2 text-center">
              <h1 className="text-xl font-bold tracking-tighter uppercase">Acceso Privado</h1>
              <p className="text-sm text-zinc-500">Ingresá las credenciales vinculadas a tu compra</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="Tu nombre de usuario"
                  className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm transition-all placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
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
                {isPending ? "Verificando..." : "Ingresar"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setError(null)
                  setView("forgot")
                }}
                className="text-xs text-zinc-400 underline underline-offset-4 hover:text-black transition-colors"
              >
                ¿Olvidaste tu contraseña? Recuperar acceso
              </button>
            </div>
          </>
        ) : (
          /* ================= VISTA: RECUPERAR CONTRASEÑA ================= */
          <>
            <div className="mb-6 space-y-2 text-center">
              <h1 className="text-xl font-bold tracking-tighter uppercase">Recuperar Acceso</h1>
              <p className="text-sm text-zinc-500">
                Ingresá tu correo electrónico y te enviaremos un enlace para restablecer tu clave.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="resetEmail" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Correo Electrónico
                </label>
                <input
                  id="resetEmail"
                  name="resetEmail"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full border border-zinc-200 bg-white px-3 py-2.5 text-sm transition-all placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black rounded-xl"
                />
              </div>

              {error && (
                <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-black py-2.5 text-sm font-medium text-white transition-all hover:bg-zinc-900 active:scale-[0.99] disabled:bg-zinc-300 rounded-xl shadow-sm"
              >
                {isPending ? "Enviando..." : "Enviar Enlace"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setError(null)
                  setSuccessMessage(null)
                  setView("login")
                }}
                className="text-xs text-zinc-500 font-medium hover:text-black transition-colors"
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </>
        )}

      </div>
    </main>
  )
}