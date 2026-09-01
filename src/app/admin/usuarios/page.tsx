"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2371717a'><rect width='100%25' height='100%25' fill='%2318181b'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"

interface User {
    id: string
    username: string
    email: string
    role: "CLIENT" | "ADMIN"
    firstName: string | null
    lastName: string | null
    phoneNumber: string | null
    profilePicture: string | null
    createdAt: string
}

type SortField = "name" | "email" | "role" | "createdAt"
type SortDirection = "asc" | "desc"

export default function AdminUsuariosPage() {
    const [profilePicture, setProfilePicture] = useState<string | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // Estado de ordenamiento
    const [sortField, setSortField] = useState<SortField>("createdAt")
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

    // Formulario
    const [formUsername, setFormUsername] = useState("")
    const [formPassword, setFormPassword] = useState("")
    const [formFirstName, setFormFirstName] = useState("")
    const [formLastName, setFormLastName] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formPhoneNumber, setFormPhoneNumber] = useState("")
    const [formRole, setFormRole] = useState<"CLIENT" | "ADMIN">("CLIENT")
    const [formFile, setFormFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        async function loadAdminData() {
            try {
                const profileRes = await fetch("/api/client/profile")
                if (profileRes.ok) {
                    const profileData = await profileRes.json()
                    setProfilePicture(profileData.profilePicture)
                }
            } catch (error) {
                console.error("Error al cargar perfil del admin:", error)
            }
        }

        loadAdminData()
        fetchUsers()
    }, [])

    async function fetchUsers() {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/users")
            if (res.ok) {
                const data = await res.json()
                setUsers(data)
            }
        } catch (error) {
            console.error("Error al obtener usuarios:", error)
        } finally {
            setLoading(false)
        }
    }

    // Lógica de ordenamiento
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            let aVal = ""
            let bVal = ""

            if (sortField === "name") {
                aVal = [a.firstName, a.lastName].filter(Boolean).join(" ") || `@${a.username}`
                bVal = [b.firstName, b.lastName].filter(Boolean).join(" ") || `@${b.username}`
            } else if (sortField === "email") {
                aVal = a.email
                bVal = b.email
            } else if (sortField === "role") {
                aVal = a.role
                bVal = b.role
            } else if (sortField === "createdAt") {
                const dateA = new Date(a.createdAt).getTime()
                const dateB = new Date(b.createdAt).getTime()
                return sortDirection === "asc" ? dateA - dateB : dateB - dateA
            }

            const comp = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" })
            return sortDirection === "asc" ? comp : -comp
        })
    }, [users, sortField, sortDirection])

    const handleSelectAll = () => {
        if (selectedIds.length === users.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(users.map((u) => u.id))
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

        const confirmDelete = confirm(`¿Estás seguro de que querés eliminar estos ${selectedIds.length} usuarios?`)
        if (!confirmDelete) return

        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: selectedIds }),
            })

            if (res.ok) {
                setSelectedIds([])
                fetchUsers()
            } else {
                const data = await res.json()
                alert(data.error || "Ocurrió un error al eliminar los usuarios.")
            }
        } catch (error) {
            console.error("Error al intentar borrar en lote:", error)
        }
    }

    const handleOpenCreateModal = () => {
        setSelectedUser(null)
        setFormUsername("")
        setFormPassword("")
        setFormFirstName("")
        setFormLastName("")
        setFormEmail("")
        setFormPhoneNumber("")
        setFormRole("CLIENT")
        setImagePreview(null)
        setFormFile(null)
        setIsModalOpen(true)
    }

    const handleOpenEditModal = (user: User) => {
        setSelectedUser(user)
        setFormUsername(user.username)
        setFormPassword("")
        setFormFirstName(user.firstName || "")
        setFormLastName(user.lastName || "")
        setFormEmail(user.email)
        setFormPhoneNumber(user.phoneNumber || "")
        setFormRole(user.role)
        setImagePreview(user.profilePicture)
        setFormFile(null)
        setIsModalOpen(true)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setFormFile(file)
            const previewUrl = URL.createObjectURL(file)
            setImagePreview(previewUrl)
        }
    }

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const formData = new FormData()
            formData.append("username", formUsername)
            formData.append("firstName", formFirstName)
            formData.append("lastName", formLastName)
            formData.append("email", formEmail)
            formData.append("phoneNumber", formPhoneNumber)
            formData.append("role", formRole)
            if (formFile) {
                formData.append("image", formFile)
            }

            let res
            if (selectedUser) {
                res = await fetch(`/api/admin/users/${selectedUser.id}`, {
                    method: "PUT",
                    body: formData,
                })
            } else {
                formData.append("password", formPassword)
                res = await fetch(`/api/admin/users`, {
                    method: "POST",
                    body: formData,
                })
            }

            if (res.ok) {
                setIsModalOpen(false)
                setSelectedUser(null)
                fetchUsers()
            } else {
                let errorMsg = "Error inesperado del servidor."
                try {
                    const contentType = res.headers.get("content-type")
                    if (contentType && contentType.includes("application/json")) {
                        const data = await res.json()
                        errorMsg = data.error || errorMsg
                    } else {
                        const rawText = await res.text()
                        errorMsg = rawText || `Código de respuesta ${res.status}`
                    }
                } catch {
                    errorMsg = `Error de conexión física con el servidor (${res.status})`
                }
                alert(errorMsg)
            }
        } catch (error) {
            console.error("Error al guardar datos:", error)
            alert("Error crítico de comunicación con el backend.")
        } finally {
            setIsSaving(false)
        }
    }

    // Encabezados ordenables
    const renderSortableHeader = (label: string, field: SortField, className = "") => {
        const isActive = sortField === field
        return (
            <th
                onClick={() => handleSort(field)}
                className={`p-4 cursor-pointer select-none transition-colors hover:text-lime-400 hover:bg-zinc-800/40 ${className}`}
            >
                <div className="flex items-center gap-1.5">
                    <span>{label}</span>
                    <span className={`text-[11px] ${isActive ? "text-lime-400 font-bold" : "text-zinc-600"}`}>
                        {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                </div>
            </th>
        )
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
                            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Control de Usuarios</h1>
                        </div>
                        <p className="text-xs text-zinc-400">Gestioná los accesos de clientes y administradores de PHIIT Equipments.</p>
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
                            <span className="text-sm font-black">+</span> Registrar Usuario
                        </button>
                    )}
                </div>

                {/* TABLA ESTILO DARK GLASSMORPHISM */}
                <div className="border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-900/50 backdrop-blur-md shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-900/90 border-b border-zinc-800/80 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-zinc-700 bg-zinc-800 text-lime-400 focus:ring-lime-400/50 cursor-pointer w-4 h-4 accent-lime-400"
                                        checked={users.length > 0 && selectedIds.length === users.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {renderSortableHeader("Usuario / Nombre", "name")}
                                {renderSortableHeader("Email", "email")}
                                {renderSortableHeader("Rol", "role")}
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500 text-xs font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
                                            Cargando base de datos de usuarios...
                                        </div>
                                    </td>
                                </tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-zinc-500 text-xs font-medium">
                                        No hay usuarios registrados en PHIIT.
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => {
                                    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")
                                    const displayName = fullName || `@${user.username}`
                                    const isSelected = selectedIds.includes(user.id)

                                    return (
                                        <tr
                                            key={user.id}
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
                                                    onChange={() => handleSelectOne(user.id)}
                                                />
                                            </td>
                                            <td className="p-4 flex items-center gap-3">
                                                <img
                                                    src={user.profilePicture || FALLBACK_AVATAR}
                                                    alt={displayName}
                                                    className="w-9 h-9 rounded-full object-cover border border-zinc-700/80 bg-zinc-800 shadow-inner"
                                                    onError={(e) => {
                                                        e.currentTarget.src = FALLBACK_AVATAR
                                                    }}
                                                />
                                                <div>
                                                    <div className="font-medium text-zinc-100">{displayName}</div>
                                                    <div className="text-[11px] text-zinc-500 font-mono">
                                                        Alta: {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-zinc-400 font-mono text-xs">{user.email}</td>
                                            <td className="p-4">
                                                <span
                                                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md border ${user.role === "ADMIN"
                                                        ? "bg-lime-400/10 text-lime-400 border-lime-500/30 shadow-sm shadow-lime-500/10"
                                                        : "bg-zinc-800/80 text-zinc-300 border-zinc-700/60"
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenEditModal(user)}
                                                    className="text-xs font-bold text-lime-400 hover:text-lime-300 hover:underline transition-all"
                                                >
                                                    Gestionar
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
                    <div className="bg-zinc-900/95 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-zinc-100">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                                {selectedUser ? "Editar Perfil de Usuario" : "Registrar Nuevo Usuario"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-zinc-500 hover:text-zinc-200 font-bold text-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveChanges} className="space-y-4">
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-zinc-700 hover:border-lime-400 shadow-inner bg-zinc-950 cursor-pointer flex items-center justify-center transition-colors"
                                >
                                    <img
                                        src={imagePreview || FALLBACK_AVATAR}
                                        alt="Previsualización"
                                        className="w-full h-full object-cover group-hover:opacity-30 transition-opacity"
                                        onError={(e) => {
                                            e.currentTarget.src = FALLBACK_AVATAR
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white">
                                        <span className="text-[10px] font-bold uppercase tracking-tight text-lime-400 text-center px-1">Cargar Foto</span>
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Clic para subir avatar</p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Nombre de Usuario (@)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-mono transition-colors"
                                        value={formUsername}
                                        onChange={(e) => setFormUsername(e.target.value)}
                                        placeholder="ej: marisapilates"
                                    />
                                </div>

                                {!selectedUser && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Contraseña Inicial</label>
                                        <input
                                            type="password"
                                            required={!selectedUser}
                                            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-mono transition-colors"
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            placeholder="Contraseña inicial de acceso"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Nombre</label>
                                        <input
                                            type="text"
                                            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                            value={formFirstName}
                                            onChange={(e) => setFormFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Apellido</label>
                                        <input
                                            type="text"
                                            className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium transition-colors"
                                            value={formLastName}
                                            onChange={(e) => setFormLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-mono transition-colors"
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        placeholder="correo@empresa.com"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Teléfono de Contacto</label>
                                    <input
                                        type="text"
                                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-100 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-mono transition-colors"
                                        value={formPhoneNumber}
                                        onChange={(e) => setFormPhoneNumber(e.target.value)}
                                        placeholder="Ej: +54 9 351..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Rol del Sistema</label>
                                    <select
                                        className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-zinc-200 focus:border-lime-500 focus:ring-1 focus:ring-lime-500 outline-none font-medium cursor-pointer transition-colors"
                                        value={formRole}
                                        onChange={(e) => setFormRole(e.target.value as "CLIENT" | "ADMIN")}
                                    >
                                        <option value="CLIENT" className="bg-zinc-900 text-zinc-200">Cliente (Estudio / Alumno)</option>
                                        <option value="ADMIN" className="bg-zinc-900 text-zinc-200">Administrador (Técnico / Dueño)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-3 rounded-xl transition-colors uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-lime-400 hover:bg-lime-300 text-black text-xs font-bold py-3 rounded-xl transition-all shadow-lg shadow-lime-400/10 uppercase tracking-wider disabled:bg-zinc-800 disabled:text-zinc-600"
                                >
                                    {isSaving ? "Guardando..." : selectedUser ? "Guardar Cambios" : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-5 text-center text-[10px] uppercase tracking-wider text-zinc-600 select-none">
                PHIIT Equipments — Módulo de Administración de Usuarios
            </footer>
        </div>
    )
}