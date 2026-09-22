import { put } from "@vercel/blob";

/**
 * Recibe un objeto File de FormData, lo guarda en Vercel Blob y retorna la URL pública.
 */
export async function saveUploadedFile(file: File, folder = "uploads"): Promise<string> {
    // Sanitizamos el nombre del archivo igual que antes
    const sanitizeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const pathname = `${folder}/${Date.now()}-${sanitizeFilename}`;

    // Subimos directamente a Vercel Blob
    const blob = await put(pathname, file, {
        access: "public",
    });

    // Retorna la URL pública (ej: https://...public.blob.vercel-storage.com/uploads/123-foto.jpg)
    // Las etiquetas <img src="..." /> y <a href="..."> la leen perfectamente sin cambiar nada.
    return blob.url;
}