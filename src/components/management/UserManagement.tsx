import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, Mail, Phone } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import type { User, UserRole } from '../../lib/types'
import { useGuarderias } from '../../hooks/useGuarderias'
import bcrypt from 'bcryptjs'



export function UserManagement() {
  const { user } = useAuth()
  const { guarderias } = useGuarderias()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    password: '',
    rol: 'profesor' as UserRole,
    tipo_documento: 'CC',
    numero_documento: '',
    telefono: '',
    guarderia_id: '' // ✅ nuevo campo
  })
  const { createUser } = useAuth()

  useEffect(() => {
  if (user) {
    loadUsers()
  }
}, [user])


  const loadUsers = async () => {
  try {
    setLoading(true)

    let query = supabase.from('users').select('*').order('created_at', { ascending: false })

    if (user?.rol === 'admin' && user.guarderia_id) {
      query = query.eq('guarderia_id', user.guarderia_id).neq('rol', 'coordinador')
    }

    const { data, error } = await query

    if (error) throw error
    setUsers(data || [])
  } catch (error) {
    console.error('Error loading users:', error)
  } finally {
    setLoading(false)
  }
}


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (user?.rol === 'admin') {
      formData.guarderia_id = user.guarderia_id ?? ''

    }


    try {
      if (editingUser) {
        const updates: Partial<User> = {
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          rol: formData.rol,
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento,
          telefono: formData.telefono
        }

        // Solo actualiza la contraseña si el usuario ingresó una nueva
        if (formData.password.trim()) {
          updates.password = await bcrypt.hash(formData.password, 10)
        }

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', editingUser.id)

        if (error) throw error
      }

 else {
        // Create new user
        await createUser(formData)
      }

      await loadUsers()
      setShowCreateForm(false)
      setEditingUser(null)
      setFormData({
          nombres: '',
          apellidos: '',
          password: '',
          rol: 'profesor',
          tipo_documento: 'CC',
          numero_documento: '',
          telefono: '',
          guarderia_id: ''
        })

    } catch (error) {
      console.error('Error saving user:', error)
    } finally {
      setLoading(false)
    }
  }

 const handleEdit = (user: User) => {
  setEditingUser(user)
  setFormData({
    nombres: user.nombres,
    apellidos: user.apellidos,
    password: '', // ← simplemente dejamos el campo vacío
    rol: user.rol,
    tipo_documento: user.tipo_documento,
    numero_documento: user.numero_documento,
    telefono: user.telefono || '',
    guarderia_id: user.guarderia_id || ''
  })
  setShowCreateForm(true)
}


  const handleDelete = async (userId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'profesor':
        return 'bg-blue-100 text-blue-800'
      case 'portero':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mint-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600">
            Administrar usuarios del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-mint-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-mint-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Usuario
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">


     {user?.rol !== 'admin' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Guardería
          </label>
          <select
            value={formData.guarderia_id}
            onChange={(e) => setFormData({ ...formData, guarderia_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
            required
          >
            <option value="">Seleccione guardería</option>
            {guarderias.map((g) => (
              <option key={g.id} value={g.id}>{g.nombre}</option>
            ))}
          </select>
        </div>
      )}


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña (6 dígitos)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="••••••"
                     required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as UserRole })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  >
                    <option value="profesor">Profesor</option>
                    <option value="portero">Portero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo Documento
                    </label>
                    <select
                      value={formData.tipo_documento}
                      onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="PA">Pasaporte</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingUser(null)
                      setFormData({
                        nombres: '',
                        apellidos: '',
                        password: '',
                        rol: 'profesor',
                        tipo_documento: 'CC',
                        numero_documento: '',
                        telefono: '',
                        guarderia_id: ''  // ← 👈 necesario para que coincida con la estructura original
                      })
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-mint-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-mint-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-mint-600" />
            Usuarios registrados ({users.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Documento</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contacto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.nombres} {user.apellidos}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-600">
                      {user.tipo_documento} {user.numero_documento}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.rol)}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {user.telefono && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {user.telefono}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}