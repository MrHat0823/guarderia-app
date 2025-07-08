import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, School } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useGuarderias } from '../../hooks/useGuarderias'
import type { User, Guarderia, UserRole } from '../../lib/types'
import bcrypt from 'bcryptjs'
import { useAuth } from '../../hooks/useAuth'


export function GuarderiaManagement() {

  const { user } = useAuth()
  const { guarderias, refetch } = useGuarderias()

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingId) {
        const { error } = await supabase
          .from('guarderias')
          .update({
            nombre: formData.nombre,
            direccion: formData.direccion,
            telefono: formData.telefono
          })
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('guarderias')
          .insert({
            nombre: formData.nombre,
            direccion: formData.direccion,
            telefono: formData.telefono
          })
        if (error) throw error
      }

      setFormData({ nombre: '', direccion: '', telefono: '' })
      setEditingId(null)
      await refetch()
    } catch (error) {
      console.error('Error al guardar guardería:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (g: Guarderia) => {
    setEditingId(g.id)
    setFormData({
      nombre: g.nombre,
      direccion: g.direccion || '',
      telefono: g.telefono || ''
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta guardería?')) return

    const { error } = await supabase.from('guarderias').delete().eq('id', id)
    if (error) console.error(error)
    else await refetch()
  }


const [usuarios, setUsuarios] = useState<User[]>([])
const [editingUserId, setEditingUserId] = useState<string | null>(null)

const defaultUserForm = {
  nombres: '',
  apellidos: '',
  telefono: '',
  numero_documento: '',
  rol: 'profesor' as UserRole,
  guarderia_id: '',
  password: ''
}


const [userForm, setUserForm] = useState(defaultUserForm)

const loadUsuarios = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('rol', ['admin', 'profesor', 'portero'])

  if (!error) setUsuarios(data || [])
}

useEffect(() => {
  loadUsuarios()
}, [])

const handleSubmitUser = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    if (editingUserId) {
      await supabase.from('users').update(userForm).eq('id', editingUserId)
    } else {
      const hashedPassword = await bcrypt.hash(userForm.password, 10)

      await supabase.from('users').insert({
        ...userForm,
        password: hashedPassword
      })
    }

    setUserForm(defaultUserForm)
    setEditingUserId(null)
    await loadUsuarios()
  } catch (err) {
    console.error(err)
  } finally {
    setLoading(false)
  }
}


const handleEditUser = (user: User) => {
  setEditingUserId(user.id)
  setUserForm({
    nombres: user.nombres,
    apellidos: user.apellidos,
    telefono: user.telefono || '',
    numero_documento: user.numero_documento,
    rol: user.rol,
    guarderia_id: user.guarderia_id || '',
    password: '' // ✅ importante para que el formulario no rompa
  })
}


const handleDeleteUser = async (id: string) => {
  if (!confirm('¿Eliminar usuario?')) return
  await supabase.from('users').delete().eq('id', id)
  await loadUsuarios()
}



  return (
  <div className="p-6 space-y-12">
    {/* SECCIÓN 1: CRUD de Guarderías */}
    <section>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-mint-700">
        <School className="w-6 h-6" />
        Guarderías
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow mb-6">
        <input
          type="text"
          placeholder="Nombre"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          className="border px-4 py-2 rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="Dirección"
          value={formData.direccion}
          onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
          className="border px-4 py-2 rounded-lg"
        />
        <input
          type="text"
          placeholder="Teléfono"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          className="border px-4 py-2 rounded-lg"
        />
        <div className="col-span-1 md:col-span-3 flex gap-4">
          <button
            type="submit"
            className="bg-mint-600 text-white px-6 py-2 rounded-lg hover:bg-mint-700"
            disabled={loading}
          >
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setFormData({ nombre: '', direccion: '', telefono: '' })
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left">Nombre</th>
              <th className="py-3 px-4 text-left">Dirección</th>
              <th className="py-3 px-4 text-left">Teléfono</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {guarderias.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="py-3 px-4">{g.nombre}</td>
                <td className="py-3 px-4">{g.direccion}</td>
                <td className="py-3 px-4">{g.telefono}</td>
                <td className="py-3 px-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(g)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(g.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {guarderias.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
                  No hay guarderías registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>


    {/* SECCIÓN 2: CRUD de Usuarios */}
<section>
  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-mint-700">
    <Users className="w-6 h-6" />
    Usuarios asignados a Guarderías
  </h2>

  <form
    onSubmit={handleSubmitUser}
    className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow mb-6"
  >
    <input
      type="text"
      placeholder="Nombres"
      value={userForm.nombres}
      onChange={(e) => setUserForm({ ...userForm, nombres: e.target.value })}
      className="border px-4 py-2 rounded-lg"
      required
    />
    <input
      type="text"
      placeholder="Apellidos"
      value={userForm.apellidos}
      onChange={(e) => setUserForm({ ...userForm, apellidos: e.target.value })}
      className="border px-4 py-2 rounded-lg"
      required
    />
    <input
      type="text"
      placeholder="Teléfono"
      value={userForm.telefono}
      onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })}
      className="border px-4 py-2 rounded-lg"
    />
    <select
      value={userForm.rol}
      onChange={(e) => setUserForm({ ...userForm, rol: e.target.value as UserRole })}
      className="border px-4 py-2 rounded-lg"
    >
      <option value="admin">Administrador</option>
      <option value="profesor">Profesor</option>
      <option value="portero">Portero</option>
    </select>
    <select
      value={userForm.guarderia_id}
      onChange={(e) => setUserForm({ ...userForm, guarderia_id: e.target.value })}
      className="border px-4 py-2 rounded-lg"
      required
    >
      <option value="">Selecciona Guardería</option>
      {guarderias.map((g) => (
        <option key={g.id} value={g.id}>
          {g.nombre}
        </option>
      ))}
    </select>

    <input
      type="text"
      placeholder="Documento"
      value={userForm.numero_documento}
      onChange={(e) => setUserForm({ ...userForm, numero_documento: e.target.value })}
      className="border px-4 py-2 rounded-lg"
      required
    />

    <input
      type="password"
      placeholder="Contraseña (mínimo 6 caracteres)"
      value={userForm.password}
      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
      className="border px-4 py-2 rounded-lg"
      required
      minLength={6}
    />


    <div className="col-span-1 md:col-span-3 flex gap-4">
      <button
        type="submit"
        className="bg-mint-600 text-white px-6 py-2 rounded-lg hover:bg-mint-700"
        disabled={loading}
      >
        {editingUserId ? 'Actualizar' : 'Crear'}
      </button>
      {editingUserId && (
        <button
          type="button"
          onClick={() => {
            setEditingUserId(null)
            setUserForm(defaultUserForm)
          }}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
        >
          Cancelar
        </button>
      )}
    </div>
  </form>

  {/* Tabla de usuarios creados */}
  <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="py-3 px-4 text-left">Nombre</th>
          <th className="py-3 px-4 text-left">Rol</th>
          <th className="py-3 px-4 text-left">Documento</th>
          <th className="py-3 px-4 text-left">Guardería</th>
          <th className="py-3 px-4 text-left">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((u) => (
          <tr key={u.id} className="border-t">
            <td className="py-3 px-4">{u.nombres} {u.apellidos}</td>
            <td className="py-3 px-4">{u.rol}</td>
            <td className="py-3 px-4">{u.numero_documento}</td>
            <td className="py-3 px-4">
              {guarderias.find((g) => g.id === u.guarderia_id)?.nombre || '—'}
            </td>
            <td className="py-3 px-4 flex gap-2">
              <button
                onClick={() => handleEditUser(u)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteUser(u.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
        {usuarios.length === 0 && (
          <tr>
            <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
              No hay usuarios registrados.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</section>

  </div>
)
}
