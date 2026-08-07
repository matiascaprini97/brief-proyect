import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import ProfileForm from "./ProfileForm"

export default async function PerfilPage() {
    const cookieStore = await cookies()
    const rawToken = cookieStore.get("session_token")?.value

    if (!rawToken) {
        redirect("/")
    }

    // Extraemos el ID del usuario de la sesión actual
    const userId = rawToken.replace("%3A", ":").split(":")[0]

    // Buscamos los datos actuales en Postgres
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            username: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            profilePicture: true,
        }
    })

    if (!user) {
        redirect("/")
    }

    return (
        <div
            className="relative flex min-h-screen flex-col text-white antialiased font-sans select-none"
            style={{ scrollbarGutter: "stable" }}
        >
            {/* FONDO DIFUMINADO CLARO Y VISIBLE */}
            <div
                className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat filter blur-lg scale-105 opacity-55 pointer-events-none"
                style={{ backgroundImage: "url('/uploads/Wallpaper.jpeg')" }}
            />
            <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none" />

            <Navbar profilePicture={user.profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12 relative z-10">
                {/* Encabezado PHIIT */}
                <div className="mb-10 space-y-2">
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase leading-none text-white">
                        MI <span className="text-fuchsia-500 italic">PERFIL</span>
                    </h1>
                    <p className="text-base font-medium text-zinc-300">
                        Gestioná tu información personal y preferencias de cuenta.
                    </p>
                </div>

                {/* Formulario de Perfil */}
                <ProfileForm initialData={user} />
            </main>

            {/* FOOTER OFICIAL PHIIT */}
            <footer className="w-full border-t border-white/15 bg-black/60 backdrop-blur-xl px-6 py-8 text-sm text-zinc-400 relative z-10">
                <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <p className="font-black text-white uppercase tracking-widest text-xs">PHIIT Equipments</p>
                        <div className="flex gap-4">
                            <a
                                href="https://www.instagram.com/phiit_equipments/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-fuchsia-400 transition-colors text-xs font-semibold"
                            >
                                Instagram (@phiit_equipments)
                            </a>
                        </div>
                    </div>
                    <div className="space-y-1 sm:text-right">
                        <p className="font-black text-white uppercase tracking-widest text-xs">Soporte Técnico</p>
                        <a href="mailto:soporte@briefplataforma.com" className="hover:text-fuchsia-400 transition-colors underline underline-offset-4 text-xs">
                            soporte@briefplataforma.com
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}