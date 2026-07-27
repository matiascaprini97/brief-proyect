"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import Navbar from "@/components/Navbar"

const FALLBACK_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a1a1aa'><rect width='100%25' height='100%25' fill='%23f4f4f5'/><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"

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

    // Componente helper para dibujar encabezados ordenables
    const renderSortableHeader = (label: string, field: SortField, className = "") => {
        const isActive = sortField === field
        return (
            <th
                onClick={() => handleSort(field)}
                className={`p-4 cursor-pointer select-none transition-colors hover:text-black hover:bg-zinc-100/60 ${className}`}
            >
                <div className="flex items-center gap-1.5">
                    <span>{label}</span>
                    <span className="text-[11px] text-zinc-400">
                        {isActive ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                </div>
            </th>
        )
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
                        <h1 className="text-xl font-bold tracking-tighter uppercase">Control de Usuarios</h1>
                        <p className="text-xs text-zinc-500">Gestioná las cuentas de clientes y los niveles de acceso del personal técnico.</p>
                    </div>

                    {selectedIds.length > 0 ? (
                        <button
                            onClick={handleBulkDelete}
                            className="bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1.5 self-start md:self-center"
                        >
                            🗑️ Eliminar Seleccionados ({selectedIds.length})
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenCreateModal}
                            className="bg-black text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors shadow-sm self-start md:self-center"
                        >
                            + Registrar Usuario
                        </button>
                    )}
                </div>

                <div className="border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                <th className="p-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer w-4 h-4"
                                        checked={users.length > 0 && selectedIds.length === users.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                {renderSortableHeader("Nombre / Empresa", "name")}
                                {renderSortableHeader("Email", "email")}
                                {renderSortableHeader("Rol", "role")}
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs font-medium">
                                        Cargando base de datos de usuarios...
                                    </td>
                                </tr>
                            ) : sortedUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-zinc-400 text-xs font-medium">
                                        No hay usuarios registrados en el sistema.
                                    </td>
                                </tr>
                            ) : (
                                sortedUsers.map((user) => {
                                    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")
                                    const displayName = fullName || `@${user.username}`

                                    return (
                                        <tr
                                            key={user.id}
                                            className={`hover:bg-zinc-50/50 transition-colors ${selectedIds.includes(user.id) ? "bg-zinc-50/80" : ""}`}
                                        >
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-zinc-300 text-black focus:ring-black cursor-pointer w-4 h-4"
                                                    checked={selectedIds.includes(user.id)}
                                                    onChange={() => handleSelectOne(user.id)}
                                                />
                                            </td>
                                            <td className="p-4 flex items-center gap-3">
                                                <img
                                                    src={user.profilePicture || FALLBACK_AVATAR}
                                                    alt={displayName}
                                                    className="w-8 h-8 rounded-full object-cover border border-zinc-200 bg-zinc-100"
                                                    onError={(e) => {
                                                        e.currentTarget.src = FALLBACK_AVATAR
                                                    }}
                                                />
                                                <div>
                                                    <div className="font-medium text-zinc-900">{displayName}</div>
                                                    <div className="text-[11px] text-zinc-400 font-mono">
                                                        Alta: {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-zinc-600 font-mono text-xs">{user.email}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${user.role === "ADMIN" ? "bg-zinc-950 text-white" : "bg-zinc-100 text-zinc-800"}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleOpenEditModal(user)}
                                                    className="text-xs font-bold text-black hover:underline transition-all"
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

            {/* MODAL INTEGRADO (CREACIÓN Y EDICIÓN) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white border border-zinc-200 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <h2 className="text-sm font-bold uppercase tracking-wider">
                                {selectedUser ? "Editar Perfil de Usuario" : "Registrar Nuevo Usuario"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-zinc-400 hover:text-black font-semibold text-lg"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveChanges} className="space-y-5">
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="group relative w-20 h-20 rounded-full overflow-hidden border border-zinc-300 shadow-sm bg-zinc-100 cursor-pointer flex items-center justify-center"
                                >
                                    <img
                                        src={imagePreview || FALLBACK_AVATAR}
                                        alt="Previsualización"
                                        className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                                        onError={(e) => {
                                            e.currentTarget.src = FALLBACK_AVATAR
                                        }}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 text-white">
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-center px-1">Cargar Foto</span>
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <p className="text-[10px] text-zinc-400 uppercase tracking-wide">Clic en el avatar para cambiar</p>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Nombre de Usuario (@)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none font-mono"
                                        value={formUsername}
                                        onChange={(e) => setFormUsername(e.target.value)}
                                        placeholder="ej: marisapilates"
                                    />
                                </div>

                                {!selectedUser && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Contraseña</label>
                                        <input
                                            type="password"
                                            required={!selectedUser}
                                            className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none font-mono"
                                            value={formPassword}
                                            onChange={(e) => setFormPassword(e.target.value)}
                                            placeholder="Contraseña inicial de acceso"
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Nombre</label>
                                        <input
                                            type="text"
                                            className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none font-medium"
                                            value={formFirstName}
                                            onChange={(e) => setFormFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Apellido</label>
                                        <input
                                            type="text"
                                            className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none font-medium"
                                            value={formLastName}
                                            onChange={(e) => setFormLastName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none font-mono"
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        placeholder="correo@empresa.com"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Teléfono de Contacto</label>
                                    <input
                                        type="text"
                                        className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none font-mono"
                                        value={formPhoneNumber}
                                        onChange={(e) => setFormPhoneNumber(e.target.value)}
                                        placeholder="Ej: +54 9 351..."
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Rol del Sistema</label>
                                    <select
                                        className="w-full text-xs border border-zinc-200 rounded-lg p-2.5 focus:border-black focus:ring-1 focus:ring-black outline-none font-medium cursor-pointer"
                                        value={formRole}
                                        onChange={(e) => setFormRole(e.target.value as "CLIENT" | "ADMIN")}
                                    >
                                        <option value="CLIENT">Cliente (Estudio / Alumno)</option>
                                        <option value="ADMIN">Administrador (Técnico / Dueño)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-black text-xs font-bold py-3 rounded-lg transition-colors uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-black hover:bg-zinc-800 text-white text-xs font-bold py-3 rounded-lg transition-colors uppercase tracking-wider disabled:bg-zinc-400"
                                >
                                    {isSaving ? "Guardando..." : selectedUser ? "Guardar Cambios" : "Crear Usuario"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <footer className="w-full border-t border-zinc-100 bg-white py-4 text-center text-[10px] uppercase tracking-wider text-zinc-400 select-none">
                Brief Plataforma — Módulo de Identidad
            </footer>
        </div>
    )
}