"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

const FALLBACK_PRODUCT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'><rect width='100%25' height='100%25' fill='%23f4f4f5'/><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.5-8.5L11 14l-2.5-3L5 17h14l-4.5-6.5z'/></svg>"

interface Product {
    id: string
    brand: string
    name: string
    details: string
    photos: string[]
    spareParts: string | null
    warrantyDays: number
    isSpare: boolean              // 👈 Sincronizado con BD
    defaultLifespanDays: number   // 👈 Sincronizado con BD
    createdAt: string
}

interface AssociatedSpare {
    productId: string
    name: string
    lifespanDays: number
}

export default function AdminProductosPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Estados del formulario principales
    const [formBrand, setFormBrand] = useState("Brief")
    const [formName, setFormName] = useState("")
    const [formDetails, setFormDetails] = useState("")
    const [formWarrantyDays, setFormWarrantyDays] = useState<number>(365)

    // Estados nuevos de clasificación
    const [formIsSpare, setFormIsSpare] = useState(false)
    const [formDefaultLifespanDays, setFormDefaultLifespanDays] = useState<number>(180)

    // Lista de asociaciones temporales para equipos
    const [associatedSpares, setAssociatedSpares] = useState<AssociatedSpare[]>([])
    const [selectedSpareId, setSelectedSpareId] = useState("")
    const [spareLifespan, setSpareLifespan] = useState<number>(180)

    const [formFile, setFormFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch("/api/client/profile")
                if (res.ok) {
                    const data = await res.json()
                    setProfilePicture(data.profilePicture)
                }
            } catch (error) {
                console.error("Error al cargar perfil del admin:", error)
            }
        }
        fetchProfile()
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/products")
            if (res.ok) {
                const data = await res.json()
                setProducts(data)
            }
        } catch (error) {
            console.error("Error al obtener productos:", error)
        } finally {
            setLoading(false)
        }
    }

    // UX: Al elegir un repuesto del dropdown, sugerir automáticamente su vida útil por defecto
    const handleSpareSelectChange = (id: string) => {
        setSelectedSpareId(id)
        const spareProduct = products.find(p => p.id === id)
        if (spareProduct) {
            setSpareLifespan(spareProduct.defaultLifespanDays)
        }
    }

    const handleAddSpareRelation = () => {
        if (!selectedSpareId) return

        const targetProduct = products.find(p => p.id === selectedSpareId)
        if (!targetProduct) return

        if (associatedSpares.some(spare => spare.productId === selectedSpareId)) {
            alert("Este repuesto ya está asociado.")
            return
        }

        const newRelation: AssociatedSpare = {
            productId: targetProduct.id,
            name: targetProduct.name,
            lifespanDays: spareLifespan
        }

        setAssociatedSpares([...associatedSpares, newRelation])
        setSelectedSpareId("")
        setSpareLifespan(180)
    }

    const handleRemoveSpareRelation = (productId: string) => {
        setAssociatedSpares(associatedSpares.filter(spare => spare.productId !== productId))
    }

    const handleSelectAll = () => {
        if (selectedIds.length === products.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(products.map((p) => p.id))
        }
    }

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return

        const confirmDelete = confirm(`¿Estás seguro de eliminar ${selectedIds.length} ítems?`)
        if (!confirmDelete) return

        try {
            const res = await fetch("/api/admin/products", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            })

            if (res.ok) {
                setSelectedIds([])
                fetchProducts()
            } else {
                const data = await res.json()
                alert(data.error || "Ocurrió un error al eliminar.")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleOpenCreateModal = () => {
        setSelectedProduct(null)
        setFormBrand("Brief")
        setFormName("")
        setFormDetails("")
        setFormWarrantyDays(365)
        setFormIsSpare(false)
        setFormDefaultLifespanDays(180)
        setAssociatedSpares([])
        setImagePreview(null)
        setFormFile(null)
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (product: Product) => {
        setSelectedProduct(product)
        setFormBrand(product.brand)
        setFormName(product.name)
        setFormDetails(product.details)
        setFormWarrantyDays(product.warrantyDays)
        setFormIsSpare(product.isSpare)
        setFormDefaultLifespanDays(product.defaultLifespanDays)

        let parsedSpares: AssociatedSpare[] = []
        if (product.spareParts) {
            try {
                parsedSpares = JSON.parse(product.spareParts)
                if (!Array.isArray(parsedSpares)) parsedSpares = []
            } catch {
                parsedSpares = []
            }
        }
        setAssociatedSpares(parsedSpares)

        setImagePreview(product.photos && product.photos.length > 0 ? product.photos[0] : null)
        setFormFile(null)
        setIsModalOpen(true)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const formData = new FormData()
            formData.append("brand", formBrand)
            formData.append("name", formName)
            formData.append("details", formDetails)
            formData.append("warrantyDays", formWarrantyDays.toString())

            // Envío de la clasificación
            formData.append("isSpare", formIsSpare.toString())
            formData.append("defaultLifespanDays", formDefaultLifespanDays.toString())

            // Solo mandamos repuestos asociados si NO es un repuesto en sí mismo
            if (!formIsSpare) {
                formData.append("spareParts", JSON.stringify(associatedSpares))
            } else {
                formData.append("spareParts", "")
            }

            if (formFile) {
                formData.append("image", formFile)
            }

            let res
            if (selectedProduct) {
                res = await fetch(`/api/admin/products/${selectedProduct.id}`, {
                    method: "PUT",
                    body: formData,
                })
            } else {
                res = await fetch(`/api/admin/products`, {
                    method: "POST",
                    body: formData,
                })
            }

            if (res.ok) {
                setIsModalOpen(false)
                setSelectedProduct(null)
                fetchProducts()
            } else {
                const data = await res.json()
                alert(data.error || "Error al procesar.")
            }
        } catch (error) {
            console.error(error)
            alert("Error crítico al guardar.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-white text-black antialiased font-sans">
            <Navbar profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
                <Link href="/admin" className="text-xs font-semibold text-zinc-400 hover:text-black flex items-center gap-1 mb-6 transition-colors w-fit">
                    ← Volver al Panel
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tighter uppercase">Inventario y Catálogo</h1>
                        <p className="text-xs text-zinc-500">Registrá tus máquinas de pilates (Equipos) y sus partes de recambio (Repuestos).</p>
                    </div>

                    {selectedIds.length > 0 ? (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                        >
                            🗑️ Eliminar Seleccionados ({selectedIds.length})
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenCreateModal}
                            className="bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm"
                        >
                            + Cargar Producto / Repuesto
                        </button>
                    )}
                </div>

                {/* TABLA PRINCIPAL */}
                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-zinc-300 text-black cursor-pointer w-4 h-4"
                                        checked={products.length > 0 && selectedIds.length === products.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4">Ítem</th>
                                <th className="p-4">Tipo</th>
                                <th className="p-4">Repuestos Relacionados / Vida Útil</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs font-medium">Cargando catálogo...</td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs font-medium">No hay registros cargados.</td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const mainPhoto = product.photos && product.photos.length > 0 ? product.photos[0] : null;

                                    let parsedSpares: AssociatedSpare[] = []
                                    if (product.spareParts) {
                                        try {
                                            parsedSpares = JSON.parse(product.spareParts)
                                        } catch {
                                            parsedSpares = []
                                        }
                                    }

                                    return (
                                        <tr
                                            key={product.id}
                                            className={`hover:bg-zinc-50/50 transition-colors ${selectedIds.includes(product.id) ? "bg-zinc-50/80" : ""}`}
                                        >
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-zinc-300 text-black cursor-pointer w-4 h-4"
                                                    checked={selectedIds.includes(product.id)}
                                                    onChange={() => handleSelectOne(product.id)}
                                                />
                                            </td>
                                            <td className="p-4 flex items-center gap-3">
                                                <img
                                                    src={mainPhoto || FALLBACK_PRODUCT_IMAGE}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded-lg object-cover border border-zinc-200"
                                                    onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCT_IMAGE }}
                                                />
                                                <div>
                                                    <div className="font-medium text-zinc-900">{product.name}</div>
                                                    <div className="text-[11px] text-zinc-400 font-mono">{product.brand}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {product.isSpare ? (
                                                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        🔧 Repuesto
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                        📦 Equipo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs">
                                                {product.isSpare ? (
                                                    <span className="text-zinc-600 font-mono">Vida útil base: <strong>{product.defaultLifespanDays} días</strong></span>
                                                ) : parsedSpares.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                        {parsedSpares.map((spare) => (
                                                            <span
                                                                key={spare.productId}
                                                                className="text-[9px] bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-medium border border-zinc-200"
                                                            >
                                                                {spare.name} ({spare.lifespanDays}d)
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-400 italic">Sin repuestos asociados</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenEditModal(product)}
                                                    className="text-xs font-bold text-black hover:underline transition-all"
                                                >
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* MODAL INTEGRADO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white border border-zinc-200 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider">
                                {selectedProduct ? "Modificar Ficha" : "Registrar Ítem Nuevo"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-black font-semibold">✕</button>
                        </div>

                        <form onSubmit={handleSaveChanges} className="space-y-5">
                            {/* SWITCH SELECTOR: ¿ES EQUIPO O REPUESTO? */}
                            <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                                <div>
                                    <label className="text-xs font-bold uppercase block text-zinc-800">Clasificación de Inventario</label>
                                    <span className="text-[10px] text-zinc-400">Indicá si es un repuesto consumible o una máquina completa.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formIsSpare}
                                        onChange={(e) => setFormIsSpare(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                    <span className="ml-3 text-xs font-bold uppercase text-zinc-700 w-16">
                                        {formIsSpare ? "Repuesto" : "Equipo"}
                                    </span>
                                </label>
                            </div>

                            {/* FOTO */}
                            <div className="flex flex-col items-center justify-center space-y-1">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group relative w-28 h-20 rounded-xl overflow-hidden border border-zinc-300 bg-zinc-50 cursor-pointer flex items-center justify-center"
                                >
                                    <img
                                        src={imagePreview || FALLBACK_PRODUCT_IMAGE}
                                        alt="Vista"
                                        className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                                        onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCT_IMAGE }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white text-[9px] font-bold uppercase">Subir Foto</div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>

                            {/* CAMPOS COMUNES */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Marca</label>
                                        <input
                                            type="text" required
                                            className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none font-medium"
                                            value={formBrand} onChange={(e) => setFormBrand(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Nombre</label>
                                        <input
                                            type="text" required
                                            className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none font-medium"
                                            value={formName} onChange={(e) => setFormName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Si es Repuesto, configuramos su Vida Útil Global */}
                                    {formIsSpare ? (
                                        <div className="space-y-1 col-span-2">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Vida útil estimada de fábrica (Días)</label>
                                            <input
                                                type="number" required min="1"
                                                className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none font-mono"
                                                value={formDefaultLifespanDays}
                                                onChange={(e) => setFormDefaultLifespanDays(parseInt(e.target.value) || 180)}
                                            />
                                        </div>
                                    ) : (
                                        // Si es Equipo, tiene garantía
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Garantía del Equipo (Días)</label>
                                            <input
                                                type="number" required min="0"
                                                className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none font-mono"
                                                value={formWarrantyDays}
                                                onChange={(e) => setFormWarrantyDays(parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    )}

                                    {!formIsSpare && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Ficha Técnica / Detalles</label>
                                            <input
                                                type="text" required
                                                className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none font-medium"
                                                value={formDetails} onChange={(e) => setFormDetails(e.target.value)}
                                                placeholder="Ej: Estructura de madera..."
                                            />
                                        </div>
                                    )}
                                </div>

                                {formIsSpare && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Especificaciones Técnicas / Materiales</label>
                                        <input
                                            type="text" required
                                            className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 outline-none font-medium"
                                            value={formDetails} onChange={(e) => setFormDetails(e.target.value)}
                                            placeholder="Ej: Acero templado, tensión alta..."
                                        />
                                    </div>
                                )}

                                {/* SECCIÓN DE ASOCIAR REPUESTOS (OCULTA SI ESTAMOS CREANDO UN REPUESTO EN SÍ) */}
                                {!formIsSpare && (
                                    <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-3">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
                                            Vincular Repuestos del Catálogo
                                        </span>

                                        <div className="flex gap-2 items-end">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[9px] font-bold text-zinc-400 block">Elegir Repuesto Cargado</label>
                                                <select
                                                    className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-white cursor-pointer"
                                                    value={selectedSpareId}
                                                    onChange={(e) => handleSpareSelectChange(e.target.value)}
                                                >
                                                    <option value="">-- Seleccionar Repuesto --</option>
                                                    {products
                                                        // 👈 FILTRO INTELIGENTE: Solo mostramos ítems que sean repuestos
                                                        .filter(p => p.isSpare === true && p.id !== selectedProduct?.id)
                                                        .map(p => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.name} ({p.brand})
                                                            </option>
                                                        ))
                                                    }
                                                </select>
                                            </div>

                                            <div className="w-24 space-y-1">
                                                <label className="text-[9px] font-bold text-zinc-400 block">Vida Útil (Días)</label>
                                                <input
                                                    type="number" min="1"
                                                    className="w-full text-xs border border-zinc-200 rounded-lg p-2 bg-white font-mono"
                                                    value={spareLifespan}
                                                    onChange={(e) => setSpareLifespan(parseInt(e.target.value) || 0)}
                                                />
                                            </div>

                                            <button
                                                type="button" onClick={handleAddSpareRelation}
                                                className="bg-zinc-950 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors h-9"
                                            >
                                                Asociar
                                            </button>
                                        </div>

                                        <div className="space-y-1.5 pt-2 border-t border-zinc-200/60">
                                            <label className="text-[9px] font-bold text-zinc-400 block">Repuestos Vinculados a esta Máquina</label>
                                            {associatedSpares.length === 0 ? (
                                                <p className="text-[11px] text-zinc-400 italic">No hay repuestos asociados.</p>
                                            ) : (
                                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                                    {associatedSpares.map((spare) => (
                                                        <div key={spare.productId} className="flex items-center justify-between bg-white border border-zinc-200 px-3 py-1 rounded-lg text-xs">
                                                            <div className="font-medium text-zinc-800">
                                                                {spare.name} <span className="ml-1 text-[10px] text-zinc-400">({spare.lifespanDays} días)</span>
                                                            </div>
                                                            <button
                                                                type="button" onClick={() => handleRemoveSpareRelation(spare.productId)}
                                                                className="text-red-500 hover:text-red-700 font-bold text-[11px]"
                                                            >
                                                                Quitar
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* BOTONES */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold py-3 rounded-lg transition-colors uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit" disabled={isSaving}
                                    className="flex-1 bg-black hover:bg-zinc-800 text-white text-xs font-bold py-3 rounded-lg transition-colors uppercase disabled:bg-zinc-400"
                                >
                                    {isSaving ? "Guardando..." : selectedProduct ? "Guardar Cambios" : "Crear"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <footer className="w-full border-t border-zinc-100 bg-white py-4 text-center text-[10px] uppercase tracking-wider text-zinc-400 select-none">
                Brief Plataforma — Módulo de Inventario
            </footer>
        </div>
    )
}