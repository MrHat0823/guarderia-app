import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, School, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Aula, User } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'

export function ClassroomManagement() {
  const { user } = useAuth()
  const [aulas, setAulas] = useState<Aula[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAula, setEditingAula] = useState<Aula | null>(null)
  const [formData, setFormData] = useState({
    nombre_aula: '',
    nivel_educativo: '',
    numero_aula: '',
    capacidad: 0,
    profesor_asignado_id: ''
  })

  useEffect(() => {
    if (user?.guarderia_id) {
      Promise.all([loadAulas(), loadTeachers()])
    }
  }, [user])

  const loadAulas = async () => {
    try {
      if (!user?.guarderia_id) return

      const { data, error } = await supabase
        .from('aulas')
        .select(`
          *,
          profesor:users(nombres, apellidos, telefono)
        `)
        .eq('guarderia_id', user.guarderia_id) // ← Filtro agregado
        .order('nombre_aula')

      if (error) throw error
      setAulas(data || [])
    } catch (error) {
      console.error('Error loading aulas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTeachers = async () => {
    try {
      if (!user?.guarderia_id) return

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('rol', 'profesor')
        .eq('guarderia_id', user.guarderia_id) // ← Filtro agregado
        .order('nombres')

      if (error) throw error
      setTeachers(data || [])
    } catch (error) {
      console.error('Error loading teachers:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!user?.guarderia_id) {
        throw new Error('Guardería no disponible para el usuario actual')
      }

      const aulaData = {
        nombre_aula: formData.nombre_aula,
        nivel_educativo: formData.nivel_educativo,
        numero_aula: formData.numero_aula,
        capacidad: formData.capacidad,
        profesor_asignado_id: formData.profesor_asignado_id || null,
        guarderia_id: user.guarderia_id // ← Fijar la guardería automáticamente
      }

      if (editingAula) {
        const { error } = await supabase
          .from('aulas')
          .update(aulaData)
          .eq('id', editingAula.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('aulas')
          .insert(aulaData)

        if (error) throw error
      }

      await loadAulas()
      setShowCreateForm(false)
      setEditingAula(null)
      setFormData({
        nombre_aula: '',
        nivel_educativo: '',
        numero_aula: '',
        capacidad: 0,
        profesor_asignado_id: ''
      })
    } catch (error) {
      console.error('Error saving aula:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (aula: Aula) => {
    setEditingAula(aula)
    setFormData({
      nombre_aula: aula.nombre_aula,
      nivel_educativo: aula.nivel_educativo,
      numero_aula: aula.numero_aula,
      capacidad: aula.capacidad,
      profesor_asignado_id: aula.profesor_asignado_id || ''
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (aulaId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta aula?')) return

    try {
      const { error } = await supabase
        .from('aulas')
        .delete()
        .eq('id', aulaId)

      if (error) throw error
      await loadAulas()
    } catch (error) {
      console.error('Error deleting aula:', error)
    }
  }

  if (loading && aulas.length === 0) {
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
            Gestión de Aulas
          </h1>
          <p className="text-gray-600">
            Administrar aulas y asignaciones de profesores
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-mint-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-mint-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Aula
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingAula ? 'Editar Aula' : 'Crear Aula'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Aula
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_aula}
                    onChange={(e) => setFormData({ ...formData, nombre_aula: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    placeholder="Ej: Aula Girasoles"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel Educativo
                  </label>
                  <select
                    value={formData.nivel_educativo}
                    onChange={(e) => setFormData({ ...formData, nivel_educativo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                    required
                  >
                    <option value="">Seleccionar nivel</option>
                    <option value="Maternal">Maternal</option>
                    <option value="Prejardín">Prejardín</option>
                    <option value="Jardín">Jardín</option>
                    <option value="Transición">Transición</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Aula
                    </label>
                    <input
                      type="text"
                      value={formData.numero_aula}
                      onChange={(e) => setFormData({ ...formData, numero_aula: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                      placeholder="Ej: 101"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacidad
                    </label>
                    <input
                      type="number"
                      value={formData.capacidad}
                      onChange={(e) => setFormData({ ...formData, capacidad: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesor Asignado
                  </label>
                  <select
                    value={formData.profesor_asignado_id}
                    onChange={(e) => setFormData({ ...formData, profesor_asignado_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  >
                    <option value="">Sin asignar</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.nombres} {teacher.apellidos}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingAula(null)
                      setFormData({
                        nombre_aula: '',
                        nivel_educativo: '',
                        numero_aula: '',
                        capacidad: 0,
                        profesor_asignado_id: ''
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
                    {loading ? 'Guardando...' : editingAula ? 'Actualizar' : 'Crear'}
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
            <School className="w-5 h-5 text-purple-600" />
            Aulas registradas ({aulas.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Aula</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Nivel</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Número</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Capacidad</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Profesor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {aulas.map((aula) => (
                <tr key={aula.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <School className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{aula.nombre_aula}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {aula.nivel_educativo}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-900">{aula.numero_aula}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{aula.capacidad}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {aula.profesor ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {aula.profesor.nombres} {aula.profesor.apellidos}
                        </p>
                        <p className="text-xs text-gray-500">
                          {aula.profesor.telefono || 'Sin teléfono'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Sin asignar</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(aula)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(aula.id)}
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