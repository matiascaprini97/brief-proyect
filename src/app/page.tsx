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
    <main className="relative flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white antialiased overflow-hidden select-none">

      {/* FONDO DIFUMINADO CLARO Y VISIBLE */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat filter blur-lg scale-105 opacity-55 pointer-events-none"
        style={{ backgroundImage: "url('/uploads/Wallpaper.jpeg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />

      <div className="absolute inset-0 flex flex-col p-6 md:p-12 filter blur-md opacity-40 select-none pointer-events-none">
        {/* Navbar Fantasma */}
        <div className="flex items-center justify-between border-b border-white/15 pb-5 w-full">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-white/10 rounded-xl" />
            <div className="h-5 w-36 bg-white/10 rounded-lg" />
          </div>
          <div className="hidden md:flex gap-6">
            <div className="h-4 w-16 bg-white/10 rounded" />
            <div className="h-4 w-20 bg-white/10 rounded" />
            <div className="h-4 w-16 bg-white/10 rounded" />
          </div>
          <div className="h-9 w-9 bg-white/10 rounded-full" />
        </div>

        {/* Título Principal Fantasma */}
        <div className="mt-12 space-y-3 max-w-xl">
          <div className="h-9 w-3/4 bg-white/15 rounded-xl" />
          <div className="h-4 w-1/2 bg-white/10 rounded-md" />
        </div>

        {/* Grilla de Muestra Fantasma */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full flex-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="border border-white/10 p-5 rounded-2xl space-y-4 bg-white/5 shadow-sm">
              <div className="h-40 w-full bg-white/10 rounded-xl" />
              <div className="space-y-2.5">
                <div className="h-5 w-2/3 bg-white/15 rounded" />
                <div className="h-3 w-full bg-white/10 rounded" />
                <div className="h-3 w-5/6 bg-white/10 rounded" />
              </div>
              <div className="h-9 w-24 bg-fuchsia-500/20 rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* MODAL PRINCIPAL (FLOTANTE Y NÍTIDO) */}
      <div className="w-full max-w-md border border-white/20 bg-black/40 p-8 shadow-2xl backdrop-blur-2xl rounded-3xl z-10 transition-all">

        {view === "login" ? (
          /* ================= VISTA: LOGIN ================= */
          <>
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
                  ACCESO <span className="text-fuchsia-500 italic">PRIVADO</span>
                </h1>
                <p className="text-xs text-zinc-300 font-medium mt-1">
                  Ingresá las credenciales vinculadas a tu cuenta PHIIT
                </p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-black uppercase tracking-widest text-zinc-300 block">
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="Tu nombre de usuario"
                  className="w-full border border-white/20 bg-black/50 px-4 py-3 text-sm text-white transition-all placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-zinc-300 block">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
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
                {isPending ? "Verificando..." : "Ingresar"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setError(null)
                  setView("forgot")
                }}
                className="text-xs font-medium text-zinc-400 underline underline-offset-4 hover:text-fuchsia-400 transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña? Recuperar acceso
              </button>
            </div>
          </>
        ) : (
          /* ================= VISTA: RECUPERAR CONTRASEÑA ================= */
          <>
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
                  RECUPERAR <span className="text-fuchsia-500 italic">ACCESO</span>
                </h1>
                <p className="text-xs text-zinc-300 font-medium mt-1">
                  Ingresá tu correo y te enviaremos un enlace para restablecer tu clave.
                </p>
              </div>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="resetEmail" className="text-xs font-black uppercase tracking-widest text-zinc-300 block">
                  Correo Electrónico
                </label>
                <input
                  id="resetEmail"
                  name="resetEmail"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  className="w-full border border-white/20 bg-black/50 px-4 py-3 text-sm text-white transition-all placeholder:text-zinc-500 focus:border-fuchsia-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 rounded-xl"
                />
              </div>

              {error && (
                <div className="text-xs font-bold text-red-300 bg-red-500/20 border border-red-500/40 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-4 py-3 rounded-xl">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-fuchsia-600 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-fuchsia-500 active:scale-[0.98] disabled:bg-zinc-600 rounded-xl shadow-lg cursor-pointer"
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
                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
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