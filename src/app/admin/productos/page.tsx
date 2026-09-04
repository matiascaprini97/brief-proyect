"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

const FALLBACK_PRODUCT_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2371717a'><rect width='100%25' height='100%25' fill='%2318181b'/><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1zm-4.5-8.5L11 14l-2.5-3L5 17h14l-4.5-6.5z'/></svg>"

interface Product {
    id: string
    brand: string
    name: string
    details: string
    photos: string[]
    spareParts: string | null
    warrantyDays: number
    isSpare: boolean
    defaultLifespanDays: number
    createdAt: string
}

interface AssociatedSpare {
    productId: string
    name: string
    lifespanDays: number
}

type SortField = 'name' | 'isSpare' | 'lifespan'
type SortOrder = 'asc' | 'desc'

export default function AdminProductosPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)

    // Estado para Búsqueda por Nombre
    const [searchQuery, setSearchQuery] = useState("")

    // Estados para Ordenamiento
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

    // Estados del formulario principales
    const [formBrand, setFormBrand] = useState("PHIIT")
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

    // Lógica de Ordenamiento y Filtrado por Búsqueda
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortField(field)
            setSortOrder('asc')
        }
    }

    const filteredAndSortedProducts = useMemo(() => {
        return products
            .filter((product) => {
                const query = searchQuery.toLowerCase().trim()
                if (!query) return true
                return (
                    product.name.toLowerCase().includes(query) ||
                    product.brand.toLowerCase().includes(query) ||
                    product.details.toLowerCase().includes(query)
                )
            })
            .sort((a, b) => {
                let comparison = 0

                if (sortField === 'name') {
                    comparison = a.name.localeCompare(b.name)
                } else if (sortField === 'isSpare') {
                    comparison = Number(a.isSpare) - Number(b.isSpare)
                } else if (sortField === 'lifespan') {
                    const valA = a.isSpare ? a.defaultLifespanDays : a.warrantyDays
                    const valB = b.isSpare ? b.defaultLifespanDays : b.warrantyDays
                    comparison = valA - valB
                }

                return sortOrder === 'asc' ? comparison : -comparison
            })
    }, [products, searchQuery, sortField, sortOrder])

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
        if (selectedIds.length === filteredAndSortedProducts.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredAndSortedProducts.map((p) => p.id))
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
        setFormBrand("PHIIT")
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

    const renderSortIndicator = (field: SortField) => {
        if (sortField !== field) return <span className="opacity-30 text-[9px] ml-1 text-zinc-600">↕</span>
        return <span className="text-[10px] ml-1 text-lime-400 font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    }

    return (
        <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 antialiased font-sans selection:bg-lime-400 selection:text-black">
            <Navbar isAdmin={true} profilePicture={profilePicture} />

            <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">
                <Link
                    href="/admin"
                    className="text-xs font-semibold text-zinc-400 hover:text-lime-400 flex items-center gap-1.5 mb-8 transition-colors w-fit group"
                >
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Volver al Panel
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Inventario y Catálogo</h1>
                        </div>
                        <p className="text-xs text-zinc-400">Registrá tus máquinas de pilates (Equipos) y sus partes de recambio (Repuestos).</p>
                    </div>

                    {selectedIds.length > 0 ? (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-500/20 transition-all shadow-lg shadow-red-500/5 flex items-center gap-2 self-start md:self-center"
                        >
                            <span>🗑️</span> Eliminar Seleccionados ({selectedIds.length})
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenCreateModal}
                            className="bg-lime-400 hover:bg-lime-300 text-black text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-lime-400/10 hover:shadow-lime-400/20 active:scale-95 self-start md:self-center flex items-center gap-1.5"
                        >
                            <span className="text-sm font-black">+</span> Cargar Producto / Repuesto
                        </button>
                    )}
                </div>

                {/* BARRA DE BÚSQUEDA */}
                <div className="mb-6 relative">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, marca o especificaciones..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/60 border border-zinc-800 text-zinc-100 text-xs rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors placeholder:text-zinc-600"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-zinc-500 hover:text-zinc-300 font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* TABLA PRINCIPAL DARK GLASSMORPHISM */}
                <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/50 backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/90 border-b border-zinc-800/80 text-[10px] uppercase tracking-wider font-bold text-zinc-400 select-none">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-zinc-700 bg-zinc-800 text-lime-400 focus:ring-lime-400/50 cursor-pointer w-4 h-4 accent-lime-400"
                                        checked={filteredAndSortedProducts.length > 0 && selectedIds.length === filteredAndSortedProducts.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:text-lime-400 hover:bg-zinc-800/40 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Ítem {renderSortIndicator('name')}
                                    </div>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:text-lime-400 hover:bg-zinc-800/40 transition-colors"
                                    onClick={() => handleSort('isSpare')}
                                >
                                    <div className="flex items-center">
                                        Tipo {renderSortIndicator('isSpare')}
                                    </div>
                                </th>
                                <th
                                    className="p-4 cursor-pointer hover:text-lime-400 hover:bg-zinc-800/40 transition-colors"
                                    onClick={() => handleSort('lifespan')}
                                >
                                    <div className="flex items-center">
                                        Repuestos Relacionados / Vida Útil {renderSortIndicator('lifespan')}
                                    </div>
                                </th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500 text-xs font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                                            Cargando catálogo...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAndSortedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500 text-xs font-medium">
                                        {searchQuery ? `No se encontraron resultados para "${searchQuery}"` : "No hay registros cargados."}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedProducts.map((product) => {
                                    const mainPhoto = product.photos && product.photos.length > 0 ? product.photos[0] : null;

                                    let parsedSpares: AssociatedSpare[] = []
                                    if (product.spareParts) {
                                        try {
                                            parsedSpares = JSON.parse(product.spareParts)
                                        } catch {
                                            parsedSpares = []
                                        }
                                    }

                                    const isSelected = selectedIds.includes(product.id)

                                    return (
                                        <tr
                                            key={product.id}
                                            className={`transition-colors ${isSelected
                                                ? "bg-lime-950/20 border-lime-500/20"
                                                : "hover:bg-zinc-800/40"
                                                }`}
                                        >
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-zinc-700 bg-zinc-800 text-lime-400 focus:ring-lime-400/50 cursor-pointer w-4 h-4 accent-lime-400"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(product.id)}
                                                />
                                            </td>
                                            <td className="p-4 flex items-center gap-3">
                                                <img
                                                    src={mainPhoto || FALLBACK_PRODUCT_IMAGE}
                                                    alt={product.name}
                                                    className="w-10 h-10 rounded-xl object-cover border border-zinc-700/80 bg-zinc-800 shadow-inner"
                                                    onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCT_IMAGE }}
                                                />
                                                <div>
                                                    <div className="font-medium text-zinc-100">{product.name}</div>
                                                    <div className="text-[11px] text-zinc-500 font-mono">{product.brand}</div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {product.isSpare ? (
                                                    <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wider">
                                                        🔧 Repuesto
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-lime-400/10 text-lime-400 border border-lime-500/30 px-2.5 py-1 rounded-md font-extrabold uppercase tracking-wider">
                                                        📦 Equipo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-xs">
                                                {product.isSpare ? (
                                                    <span className="text-zinc-400 font-mono">Vida útil base: <strong className="text-zinc-200">{product.defaultLifespanDays} días</strong></span>
                                                ) : parsedSpares.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                                                        {parsedSpares.map((spare) => (
                                                            <span
                                                                key={spare.productId}
                                                                className="text-[10px] bg-zinc-800/90 text-zinc-300 px-2 py-0.5 rounded font-medium border border-zinc-700/80"
                                                            >
                                                                {spare.name} <span className="text-lime-400 font-mono">({spare.lifespanDays}d)</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-600 italic">Sin repuestos asociados</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenEditModal(product)}
                                                    className="text-xs font-bold text-lime-400 hover:text-lime-300 hover:underline transition-all"
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

            {/* MODAL INTEGRADO DARK GLASSMORPHISM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-zinc-900/95 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-zinc-100">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                                {selectedProduct ? "Modificar Ficha" : "Registrar Ítem Nuevo"}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-200 font-bold text-lg transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleSaveChanges} className="space-y-4">
                            {/* SWITCH SELECTOR: ¿ES EQUIPO O REPUESTO? */}
                            <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                                <div>
                                    <label className="text-xs font-bold uppercase block text-zinc-200">Clasificación de Inventario</label>
                                    <span className="text-[10px] text-zinc-500">Indicá si es un repuesto consumible o una máquina completa.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formIsSpare}
                                        onChange={(e) => setFormIsSpare(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-zinc-800 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-black after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-zinc-400 after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400 peer-checked:after:bg-black"></div>
                                    <span className="ml-3 text-xs font-bold uppercase text-zinc-300 w-16">
                                        {formIsSpare ? "Repuesto" : "Equipo"}
                                    </span>
                                </label>
                            </div>

                            {/* FOTO */}
                            <div className="flex flex-col items-center justify-center space-y-1">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group relative w-28 h-20 rounded-xl overflow-hidden border-2 border-dashed border-zinc-700 hover:border-lime-400 shadow-inner bg-zinc-950 cursor-pointer flex items-center justify-center transition-colors"
                                >
                                    <img
                                        src={imagePreview || FALLBACK_PRODUCT_IMAGE}
                                        alt="Vista"
                                        className="w-full h-full object-cover group-hover:opacity-30 transition-opacity"
                                        onError={(e) => { e.currentTarget.src = FALLBACK_PRODUCT_IMAGE }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-lime-400 text-[9px] font-bold uppercase text-center">Subir Foto</div>
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            </div>

                            {/* CAMPOS COMUNES Y ESPECÍFICOS */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Marca</label>
                                        <input
                                            type="text" required
                                            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                            value={formBrand} onChange={(e) => setFormBrand(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Nombre</label>
                                        <input
                                            type="text" required
                                            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                            value={formName} onChange={(e) => setFormName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {formIsSpare ? (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Vida Útil Base (Días)</label>
                                                <input
                                                    type="number" min={1} required
                                                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                                    value={formDefaultLifespanDays}
                                                    onChange={(e) => setFormDefaultLifespanDays(Number(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Garantía (Días)</label>
                                                <input
                                                    type="number" min={0} required
                                                    className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                                    value={formWarrantyDays}
                                                    onChange={(e) => setFormWarrantyDays(Number(e.target.value))}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-1 col-span-2">
                                            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Días de Garantía</label>
                                            <input
                                                type="number" min={0} required
                                                className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                                value={formWarrantyDays}
                                                onChange={(e) => setFormWarrantyDays(Number(e.target.value))}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Detalles / Descripción</label>
                                    <textarea
                                        rows={3}
                                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium resize-none transition-colors"
                                        placeholder="Especificaciones técnicas, observaciones..."
                                        value={formDetails}
                                        onChange={(e) => setFormDetails(e.target.value)}
                                    />
                                </div>

                                {/* SECCIÓN DE REPUESTOS ASOCIADOS (SÓLO SI ES EQUIPO) */}
                                {!formIsSpare && (
                                    <div className="border-t border-zinc-800 pt-4 space-y-3">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 block">Repuestos Asociados al Equipo</label>

                                        <div className="flex items-center gap-2">
                                            <select
                                                className="flex-1 text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium cursor-pointer transition-colors"
                                                value={selectedSpareId}
                                                onChange={(e) => handleSpareSelectChange(e.target.value)}
                                            >
                                                <option value="" className="bg-zinc-900 text-zinc-400">-- Seleccionar repuesto --</option>
                                                {products
                                                    .filter((p) => p.isSpare && p.id !== selectedProduct?.id)
                                                    .map((spare) => (
                                                        <option key={spare.id} value={spare.id} className="bg-zinc-900 text-zinc-200">
                                                            {spare.name} ({spare.brand})
                                                        </option>
                                                    ))}
                                            </select>

                                            <input
                                                type="number" min={1} placeholder="Vida útil"
                                                className="w-24 text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                                value={spareLifespan}
                                                onChange={(e) => setSpareLifespan(Number(e.target.value))}
                                            />

                                            <button
                                                type="button"
                                                onClick={handleAddSpareRelation}
                                                className="bg-lime-400 text-black hover:bg-lime-300 text-xs font-bold px-3.5 py-3 rounded-xl transition-colors shrink-0"
                                            >
                                                + Añadir
                                            </button>
                                        </div>

                                        {/* LISTA DE CHIPS DE REPUESTOS VINCULADOS */}
                                        {associatedSpares.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {associatedSpares.map((spare) => (
                                                    <span
                                                        key={spare.productId}
                                                        className="inline-flex items-center gap-1.5 bg-zinc-950 text-zinc-200 text-[11px] font-medium px-3 py-1.5 rounded-lg border border-zinc-800"
                                                    >
                                                        <span>{spare.name}</span>
                                                        <span className="text-lime-400 font-mono text-[10px]">({spare.lifespanDays}d)</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSpareRelation(spare.productId)}
                                                            className="text-zinc-500 hover:text-red-400 font-bold ml-1 transition-colors"
                                                        >
                                                            ✕
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-zinc-500 italic">No se han asociado repuestos aún.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* BOTONES DE ACCIÓN */}
                            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-4 py-3 rounded-xl transition-colors uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-lime-400 hover:bg-lime-300 text-black text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-lime-400/10 uppercase tracking-wider disabled:bg-zinc-800 disabled:text-zinc-600"
                                >
                                    {isSaving ? "Guardando..." : selectedProduct ? "Actualizar Ficha" : "Guardar Ítem"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-5 text-center text-[10px] uppercase tracking-wider text-zinc-600 select-none">
                PHIIT Equipments — Catálogo de Inventario
            </footer>
        </div>
    )
}