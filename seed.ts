import fs from "fs"
import path from "path"

// ==========================================
// PARSEO NATIVO DEL .ENV 
// (Carga las variables directo en memoria sin depender de flags de la terminal)
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
                // Limpiamos comillas si las hay
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
// LOGICA DE INYECCIÓN DE DATOS (SEED)
// ==========================================
async function main() {
    console.log("🚀 Cargando tu cliente de Prisma optimizado con adaptadores...")

    // Importación dinámica para garantizar que lea las variables de entorno que cargamos arriba
    const { prisma } = await import("./src/lib/prisma")

    console.log("⚡ Conectando a Supabase para inyectar datos...")

    // 1. Limpiar datos viejos en orden de relaciones para evitar errores de claves foráneas
    await prisma.sale.deleteMany()
    await prisma.product.deleteMany()
    await prisma.user.deleteMany()
    console.log("🧹 Base de datos limpia de registros previos.")

    // 2. Crear Usuario Administrador
    const admin = await prisma.user.create({
        data: {
            username: "admin123",
            password: "adminpassword",
            email: "admin@brief.com",
            role: "ADMIN",
            firstName: "Tomás",
            lastName: "Admin"
        }
    })
    console.log(`👤 Admin creado: ${admin.username}`)

    // 3. Crear Usuario Cliente
    const client = await prisma.user.create({
        data: {
            username: "cliente123",
            password: "clientepassword",
            email: "cliente@gmail.com",
            role: "CLIENT",
            firstName: "Juan",
            lastName: "Pérez",
            phoneNumber: "+541123456789"
        }
    })
    console.log(`👤 Cliente creado: ${client.username}`)

    // 4. Crear dos Productos Tecnológicos
    const prod1 = await prisma.product.create({
        data: {
            brand: "Brief",
            name: "Resorte de Tensión Max-Pilates",
            details: "Resorte de acero al carbono premium con tratamiento térmico para alta elasticidad. Longitud de 48cm, ideal para configuraciones de resistencia media-alta en camas Reformer.",
            spareParts: "Mosquetón de enganche rápido de acero inoxidable, tope de goma de amortiguación.",
            photos: []
        }
    })

    const prod2 = await prisma.product.create({
        data: {
            brand: "Brief",
            name: "Mordaza de Bloqueo Técnico 15mm",
            details: "Mordaza de aluminio anodizado con rodamientos de bolas de alta precisión. Asegura un agarre firme de las cuerdas de nylon sin desgastar las fibras mecánicas.",
            spareParts: "Kit de resortes internos de repuesto, tornillos de fijación Allen M5.",
            photos: []
        }
    })
    console.log("📦 Productos técnicos creados correctamente.")

    // 5. Vincular ambos productos al Cliente mediante la tabla intermedia Sale (Ventas)
    await prisma.sale.create({ data: { userId: client.id, productId: prod1.id } })
    await prisma.sale.create({ data: { userId: client.id, productId: prod2.id } })
    console.log("🔗 Productos vinculados exitosamente al cliente.")

    console.log("✨ ¡Proceso de sembrado finalizado con éxito total!")
}

main()
    .catch(async (e) => {
        console.error("❌ Ocurrió un error ejecutando el seed:", e)
        process.exit(1)
    })