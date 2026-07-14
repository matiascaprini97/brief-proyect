import fs from "fs"
import path from "path"

// ==========================================
// PARSEO NATIVO DEL .ENV (Tu solución original)
// ==========================================
try {
    const envPath = path.resolve(process.cwd(), ".env")
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8")
        envContent.split(/\r?\n/).forEach((line) => {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith("#")) return
            const index = trimmed.indexOf("=")
            if (index !== -1) {
                const key = trimmed.substring(0, index).trim()
                let val = trimmed.substring(index + 1).trim()
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
                process.env[key] = val
            }
        })
        console.log("📝 Variables de entorno del archivo .env cargadas con éxito.")
    }
} catch (err) {
    console.error("No se pudo leer el archivo .env de forma nativa:", err)
}

// ==========================================
// LOGICA DE INYECCIÓN DE DATOS (NUEVO ESQUEMA)
// ==========================================
async function main() {
    console.log("🚀 Cargando tu cliente de Prisma optimizado con adaptadores...")

    // Importación dinámica para garantizar que lea las variables de entorno que cargamos arriba
    const { prisma } = await import("../src/lib/prisma")
    // 💡 NOTA: Si tu carpeta es prisma/seed.ts, para ir a src tenés que subir un nivel (../src/lib/prisma)

    console.log("⚡ Conectando a la base de datos para inyectar datos del nuevo esquema...")

    // 1. Limpiamos registros viejos en estricto orden de relación inversa
    await prisma.trackedSparePart.deleteMany()
    await prisma.sale.deleteMany()
    await prisma.product.deleteMany()
    await prisma.user.deleteMany()
    console.log("🧹 Base de datos limpia de registros previos.")

    // 2. Crear Usuarios de prueba (Admin y Cliente)
    const admin = await prisma.user.create({
        data: {
            username: 'admin_brief',
            email: 'admin@briefplataforma.com',
            password: 'adminpassword123',
            role: 'ADMIN',
            firstName: 'Carlos',
            lastName: 'Director',
            profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        },
    })

    const client = await prisma.user.create({
        data: {
            username: 'marisa_pilates',
            email: 'marisa@estudiopilates.com',
            password: 'clientpassword123',
            role: 'CLIENT',
            firstName: 'Marisa',
            lastName: 'Gómez',
            phoneNumber: '+541123456789',
            profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        },
    })
    console.log('👤 Usuarios de prueba creados (Admin y Cliente).')

    // 3. Crear Productos del catálogo (NUEVO ESQUEMA: Repuestos y Equipos separados)
    console.log('📦 Sembrando catálogo de productos y repuestos...')

    // 3.1. Primero creamos los repuestos individuales (isSpare: true)
    const resorteRojo = await prisma.product.create({
        data: {
            brand: 'Brief Fitness',
            name: 'Resorte Rojo - Alta Tensión',
            details: 'Resorte de acero templado para máxima resistencia. Ideal para ejercicios avanzados de fuerza en camas Reformer.',
            photos: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600'],
            isSpare: true,
            defaultLifespanDays: 180, // 6 meses de duración por defecto
            warrantyDays: 90,        // 3 meses de garantía
        },
    })

    const resorteAzul = await prisma.product.create({
        data: {
            brand: 'Brief Fitness',
            name: 'Resorte Azul - Tensión Media',
            details: 'Resorte calibrado para cargas intermedias. Ideal para rehabilitación o trabajo aeróbico fluido.',
            photos: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600'],
            isSpare: true,
            defaultLifespanDays: 240, // 8 meses de duración por defecto
            warrantyDays: 90,
        },
    })

    const cintaReformer = await prisma.product.create({
        data: {
            brand: 'Brief Fitness',
            name: 'Cintas de Tracción de Agarre (Par)',
            details: 'Cintas de nylon trenzado reforzado con costuras de seguridad y agarres forrados en neoprene suave.',
            photos: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'],
            isSpare: true,
            defaultLifespanDays: 365, // 1 año de duración por defecto
            warrantyDays: 180,
        },
    })

    console.log('✅ Repuestos agregados al catálogo.')

    // 3.2. Estructuramos los repuestos que vienen asociados a la cama de fábrica
    const reformerSparesJSON = JSON.stringify([
        {
            productId: resorteRojo.id,
            name: resorteRojo.name,
            lifespanDays: resorteRojo.defaultLifespanDays
        },
        {
            productId: cintaReformer.id,
            name: cintaReformer.name,
            lifespanDays: cintaReformer.defaultLifespanDays
        }
    ])

    // 3.3. Creamos los Equipos de pilates (isSpare: false)
    const camaPilates = await prisma.product.create({
        data: {
            brand: 'Brief Fitness',
            name: 'Cama Pilates Reformer Pro Wood',
            details: 'Cama de pilates profesional construida en madera de guatambú maciza. Incluye sistema de carros ultrasilencioso, poleas regulables y herrajes de acero inoxidable.',
            photos: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'],
            isSpare: false,
            warrantyDays: 730, // 2 años de garantía de fábrica
            spareParts: reformerSparesJSON, // Guardamos la asociación inicial en formato JSON string
        },
    })

    const mediaTorre = await prisma.product.create({
        data: {
            brand: 'Brief Fitness',
            name: 'Unidad de Pared / Media Torre Pilates',
            details: 'Estructura de caño de acero inoxidable de alta calidad, incluye tabla de extensión acolchada y resortes importados.',
            photos: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600'],
            isSpare: false,
            warrantyDays: 365,
            spareParts: null, // Se le pueden configurar repuestos dinámicamente más tarde
        }
    })

    console.log('✅ Equipos agregados al catálogo con sus repuestos asignados.')

    // 4. Registrar una Venta (Simulamos que Marisa compró la cama hace 60 días)
    const venta = await prisma.sale.create({
        data: {
            userId: client.id,
            productId: camaPilates.id,
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Hace 60 días
        },
    })
    console.log('💸 Historial de venta registrado.')

    // 5. Generar los repuestos bajo seguimiento de ESA cama específica que compró Marisa
    // Asociamos las partes trackeadas reales a los productos tipo "repuesto" del catálogo
    await prisma.trackedSparePart.createMany({
        data: [
            {
                saleId: venta.id,
                name: 'Resorte Rojo (Carga Pesada) - Izquierdo',
                spareProductId: resorteRojo.id,
                lifespanDays: 180,
                installedAt: new Date(), // Instalado hoy (Vida útil al 100%)
            },
            {
                saleId: venta.id,
                name: 'Resorte Azul (Carga Media) - Derecho',
                spareProductId: resorteAzul.id,
                lifespanDays: 240,
                installedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Instalado hace 90 días (~62% de vida útil restante)
            },
            {
                saleId: venta.id,
                name: 'Cintas de Tracción de Agarre',
                spareProductId: cintaReformer.id,
                lifespanDays: 365,
                installedAt: new Date(Date.now() - 320 * 24 * 60 * 60 * 1000), // Instalado hace 320 días (~12% restante, casi por vencer)
            },
        ],
    })

    console.log('⚙️ Repuestos en seguimiento asociados a la venta listos y vinculados.')
    console.log("✨ ¡Proceso de sembrado del nuevo esquema finalizado con éxito total!")
}

main()
    .catch(async (e) => {
        console.error("❌ Ocurrió un error ejecutando el seed:", e)
        process.exit(1)
    })