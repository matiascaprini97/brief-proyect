import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get("session_token")?.value
    const { pathname } = request.nextUrl

    // CASO 1: El usuario TIENE sesión activa
    if (sessionToken) {
        // Normalizamos por si el navegador codificó los dos puntos como %3A
        const cleanToken = sessionToken.replace("%3A", ":")
        const [, role] = cleanToken.split(":")

        // Si intenta ir a la Home ("/"), lo mandamos directo a su panel sin loguear de nuevo
        if (pathname === "/") {
            return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin" : "/client", request.url))
        }

        // Si es un CLIENT e intenta meterse a las rutas de ADMIN, lo rebotamos a su espacio
        if (pathname.startsWith("/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/client", request.url))
        }

        // Si es un ADMIN e intenta meterse a las rutas de CLIENT, lo llevamos a su panel
        if (pathname.startsWith("/client") && role !== "CLIENT") {
            return NextResponse.redirect(new URL("/admin", request.url))
        }
    }
    // CASO 2: El usuario NO tiene sesión activa
    else {
        // Si intenta forzar la entrada a paneles privados, lo mandamos al Login de una
        if (pathname.startsWith("/admin") || pathname.startsWith("/client")) {
            return NextResponse.redirect(new URL("/", request.url))
        }
    }

    return NextResponse.next()
}

// Configuración para indicarle al Middleware qué rutas debe vigilar obligatoriamente
export const config = {
    matcher: ["/", "/admin/:path*", "/client/:path*"],
}