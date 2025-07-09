// project\src\components\management\ChildrenManagement.tsx
import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Baby, School } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Nino, Aula } from '../../lib/types'
import { useAuth } from '../../hooks/useAuth'
import { toast } from 'sonner'





export function ChildrenManagement() {
  
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const [children, setChildren] = useState<Nino[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingChild, setEditingChild] = useState<Nino | null>(null)
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: 'RC',
    numero_documento: '',
    aula_id: '',
    activo: true
  })

  useEffect(() => {
  if (user?.guarderia_id) {
    loadChildren()
  }
}, [user, currentPage, searchTerm])


useEffect(() => {
  loadAulas()
}, [user?.guarderia_id])


  const loadChildren = async () => {
  try {
    if (!user?.guarderia_id) return

    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    let query = supabase
      .from('ninos')
      .select(`
        *,
        aula:aulas (
          id,
          nombre_aula,
          nivel_educativo
        )
      `, { count: 'exact' })
      .eq('guarderia_id', user.guarderia_id) // FILTRO AÑADIDO
      .order('nombres')
      .range(from, to)

    if (searchTerm.trim() !== '') {
      query = query.or(`nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,numero_documento.ilike.%${searchTerm}%`)
    }

    const { data, error, count } = await query

    if (error) throw error
    setChildren(data || [])
    setTotalCount(count || 0)
  } catch (error) {
    console.error('Error loading children:', error)
  } finally {
    setLoading(false)
  }
}



  const loadAulas = async () => {
  try {
    if (!user?.guarderia_id) return  // Evitar cargar si no hay guardería asociada

    const { data, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('guarderia_id', user.guarderia_id) // Filtro por guardería
      .order('nombre_aula')

    if (error) throw error
    setAulas(data || [])
  } catch (error) {
    console.error('Error loading aulas:', error)
  }
}


 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)


  try {
    const childData = {
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento,
      aula_id: formData.aula_id || null,
      guarderia_id: user?.guarderia_id, // Asignación automática
      activo: formData.activo
    }

    if (editingChild) {
      const { error } = await supabase
        .from('ninos')
        .update(childData)
        .eq('id', editingChild.id)

      if (error) throw error

      toast.success('Niño actualizado correctamente')
    } else {
      // Verificar si ya existe el número de documento
      const { data: existing, error: existingError } = await supabase
        .from('ninos')
        .select('id')
        .eq('numero_documento', childData.numero_documento)
        .maybeSingle()

      if (existingError) throw existingError

      if (existing) {
        toast.error('Ya existe un niño con ese número de documento')
        return
      }

      const { error } = await supabase
        .from('ninos')
        .insert(childData)

      if (error) throw error

      toast.success('Niño creado correctamente')
    }

    await loadChildren()
    setShowCreateForm(false)
    setEditingChild(null)
    setFormData({
      nombres: '',
      apellidos: '',
      tipo_documento: 'TI',
      numero_documento: '',
      aula_id: '',
      activo: true
    })

  } catch (error) {
    toast.error('Ocurrió un error al guardar el niño')
  } finally {
    setLoading(false)
  }
}


  const handleEdit = (child: Nino) => {
    setEditingChild(child)
    setFormData({
      nombres: child.nombres,
      apellidos: child.apellidos,
      tipo_documento: child.tipo_documento,
      numero_documento: child.numero_documento,
      aula_id: child.aula_id || '',
      activo: child.activo
    })
    setShowCreateForm(true)
  }

  const handleDelete = async (childId: string) => {
  toast.custom((t) => (
    <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200 w-[320px]">
      <h3 className="font-semibold text-gray-800 text-sm">¿Eliminar niño?</h3>
      <p className="text-gray-600 text-sm mt-1">Esta acción no se puede deshacer.</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={() => toast.dismiss(t)}
          className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          onClick={async () => {
            try {
              const { error } = await supabase
                .from('ninos')
                .delete()
                .eq('id', childId)

              if (error) throw error

              await loadChildren()
              toast.success('Niño eliminado correctamente')
            } catch (error) {
              console.error('Error deleting child:', error)
              toast.error('Error al eliminar el niño')
            } finally {
              toast.dismiss(t)
            }
          }}
          className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </div>
  ))
}


  if (loading && children.length === 0) {
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
            Gestión de Niños
          </h1>
          <p className="text-gray-600">
            Administrar información de los niños
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-mint-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-mint-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Niño
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingChild ? 'Editar Niño' : 'Agregar Niño'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">


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
                      
                      <option value="RC">Registro Civil</option>
                      <option value="TI">Tarjeta de Identidad</option>
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
                    Aula
                  </label>
                  <select
                    value={formData.aula_id}
                    onChange={(e) => setFormData({ ...formData, aula_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500"
                  >
                    <option value="">Seleccionar aula</option>
                    {aulas.map((aula) => (
                      <option key={aula.id} value={aula.id}>
                        {aula.nombre_aula} - {aula.nivel_educativo}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="w-4 h-4 text-mint-600 border-gray-300 rounded focus:ring-mint-500"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                    Activo
                  </label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingChild(null)
                      setFormData({
                        nombres: '',
                        apellidos: '',
                        tipo_documento: 'TI',
                        numero_documento: '',
                        aula_id: '',
                        activo: true
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
                    {loading ? 'Guardando...' : editingChild ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Baby className="w-5 h-5 text-blue-600" />
            Niños registrados ({totalCount})
          </h3>
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="ml-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-mint-500 focus:outline-none"
  />
</div>

        </div>     
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Documento</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Aula</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {children.map((child) => (
                <tr key={child.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {child.nombres} {child.apellidos}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-sm text-gray-600">
                      {child.tipo_documento} {child.numero_documento}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    {child.aula ? (
                      <div className="flex items-center gap-2">
                        <School className="w-4 h-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {child.aula.nombre_aula}
                          </p>
                          <p className="text-xs text-gray-500">
                            {child.aula.nivel_educativo}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Sin aula</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      child.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {child.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(child)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(child.id)}
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

          <div className="flex justify-end items-center gap-4 p-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage} de {Math.ceil(totalCount / itemsPerPage)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < Math.ceil(totalCount / itemsPerPage) ? prev + 1 : prev
                )
              }
              disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
              className="px-3 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>

        </div>
      </div>
    </div>
    
  )
}