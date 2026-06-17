import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function QRPage({ params }: PageProps) {
    // 1. En Next 16 desestructurar directo da undefined. 
    // SÍ o SÍ hay que meterle el await a los params primero.
    const resolvedParams = await params;
    const id = resolvedParams.id;

    let machine = null;

    try {
        // 2. Buscamos en la base de datos usando el ID real que viene de la URL
        machine = await prisma.machine.findUnique({
            where: { id: id },
            include: {
                owner: {
                    select: {
                        name: true,
                    },
                },
            },
        });
    } catch (error) {
        console.error("Error en Prisma:", error);
        notFound();
    }

    // 3. Si el ID no existe en Supabase (como el '465464646465' de prueba), 
    // ahora SÍ va a saltar al 404 en vez de romper la app.
    if (!machine) {
        notFound();
    }

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black px-4">
            <main className="flex w-full max-w-md flex-col items-center justify-between rounded-2xl border border-zinc-100 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">

                {/* Header con el Logo */}
                <div className="flex w-full justify-between items-center border-b border-zinc-100 pb-4 dark:border-zinc-800">
                    <Image
                        className="dark:invert"
                        src="/next.svg"
                        alt="Next.js logo"
                        width={80}
                        height={16}
                        priority
                    />
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-1 rounded dark:bg-emerald-950/50 dark:text-emerald-400">
                        Activo
                    </span>
                </div>

                {/* Contenido de la Cama de Pilates */}
                <div className="flex flex-col w-full gap-4 my-6">
                    <div>
                        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                            Equipo / Modelo
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {machine.model}
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl dark:bg-zinc-800/50">
                        <div>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">Nro. de Serie</p>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                {machine.serialNumber || "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500">Propietario</p>
                            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                                {machine.owner?.name || "Sin asignar"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botones de acción */}
                <div className="flex flex-col w-full gap-3">
                    <button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200">
                        Reportar Incidencia
                    </button>
                    <button className="flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
                        Ver Manual Técnico
                    </button>
                </div>

            </main>
        </div>
    );
}