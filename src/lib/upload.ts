import { writeFile, mkdir } from "fs/promises"
import path from "path"

/**
 * Recibe un objeto File de FormData, lo guarda en public/uploads y retorna la URL relativa.
 */
export async function saveUploadedFile(file: File, folder = "uploads"): Promise<string> {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Definimos la ruta destino en public/
    const uploadDir = path.join(process.cwd(), "public", folder)

    // Aseguramos que la carpeta exista (si no existe, la crea)
    await mkdir(uploadDir, { recursive: true })

    // Generamos un nombre único para evitar colisiones de archivos
    const sanitizeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueName = `${Date.now()}-${sanitizeFilename}`
    const filePath = path.join(uploadDir, uniqueName)

    // Escribimos el archivo en disco
    await writeFile(filePath, buffer)

    // Retornamos el path que guardaremos en la base de datos (sirve directo en la etiqueta <img src="..." />)
    return `/${folder}/${uniqueName}`
}