//project\src\components\management\GuardianManagement.tsx
import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, Phone, Mail, MapPin, Link, Heart, QrCode, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Acudiente, Nino, TipoParentesco } from '../../lib/types'
import QRCode from 'qrcode'
import { useAuth } from '../../hooks/useAuth'
import { toast } from 'sonner'



interface ChildWithRelationship {
  id: string
  nombres: string
  apellidos: string
  numero_documento: string
  tipo_documento: string
  parentesco: TipoParentesco
  aula?: {
    nombre_aula: string
    nivel_educativo: string
  }
}

export function GuardianManagement() {
  const { user } = useAuth()
  const [guardians, setGuardians] = useState<Acudiente[]>([])
  const [children, setChildren] = useState<Nino[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [selectedGuardian, setSelectedGuardian] = useState<Acudiente | null>(null)
  const [selectedChildrenWithParentesco, setSelectedChildrenWithParentesco] = useState<Array<{childId: string, parentesco: TipoParentesco}>>([])
  const [initialChildrenWithParentesco, setInitialChildrenWithParentesco] = useState<Array<{childId: string, parentesco: TipoParentesco}>>([])
  const [childSearchTerm, setChildSearchTerm] = useState('')
  const [editingGuardian, setEditingGuardian] = useState<Acudiente | null>(null)
  const [generatingQR, setGeneratingQR] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: 'CC',
    numero_documento: '',
    telefono1: '',
    telefono2: '',
    email: '',
    direccion: ''
  })

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))
  const [searchTerm, setSearchTerm] = useState('')




  const parentescoOptions: TipoParentesco[] = [
    'Madre', 'Padre', 'Hermano', 'Hermana', 'Tío', 'Tía', 
    'Abuelo', 'Abuela', 'Tutor Legal', 'Otro'
  ]

useEffect(() => {
  if (user?.guarderia_id) {
    fetchGuardians()
  }
}, [currentPage, searchTerm, user])


useEffect(() => {
  if (user?.guarderia_id) {
    fetchChildren()
  }
}, [user]) //  Se ejecuta cuando `user` esté listo



const fetchGuardians = async () => {
  try {
    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1

    let query = supabase
      .from('acudientes')
      .select('*', { count: 'exact' })
      .eq('guarderia_id', user?.guarderia_id)
      .order('nombres')
      .range(from, to)

    if (searchTerm.trim() !== '') {
      query = query.or(`nombres.ilike.%${searchTerm}%,apellidos.ilike.%${searchTerm}%,numero_documento.ilike.%${searchTerm}%`)
    }

    const { data, count, error } = await query

    if (error) throw error
    setGuardians(data || [])
    setTotalCount(count || 0)
  } catch (error) {
    console.error('Error fetching guardians:', error)
  } finally {
    setLoading(false)
  }
}




  const fetchChildren = async () => {
  try {
    const { data, error } = await supabase
      .from('ninos')
      .select(`
        *,
        aulas (
          nombre_aula,
          nivel_educativo
        )
      `)
      .eq('activo', true)
      .eq('guarderia_id', user?.guarderia_id) // filtro agregado
      .order('nombres')

    if (error) throw error
    setChildren(data || [])
  } catch (error) {
    console.error('Error fetching children:', error)
  }
}


  const fetchChildrenForGuardian = async (guardianId: string): Promise<ChildWithRelationship[]> => {
  try {
    const { data, error } = await supabase
      .from('nino_acudiente')
      .select(`
        parentesco,
        ninos (
          id,
          nombres,
          apellidos,
          numero_documento,
          tipo_documento,
          aulas (
            nombre_aula,
            nivel_educativo
          )
        )
      `)
      .eq('acudiente_id', guardianId)

    if (error) throw error

    const childrenWithRelationship = (data ?? []).map(item => {
      const nino = item.ninos
      return {
        id: nino.id,
        nombres: nino.nombres,
        apellidos: nino.apellidos,
        numero_documento: nino.numero_documento,
        tipo_documento: nino.tipo_documento,
        parentesco: item.parentesco,
        aula: Array.isArray(nino.aulas) ? nino.aulas[0] : nino.aulas
      }
    })

    return childrenWithRelationship
  } catch (error) {
    console.error('Error fetching children for guardian:', error)
    return []
  }
}



const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  try {
    if (!user?.guarderia_id) {
      toast.error('No se encontró una guardería asociada al usuario actual.')
      return
    }

    if (!editingGuardian) {

      const { data: existing, error: existingError } = await supabase
        .from('acudientes')
        .select('id')
        .eq('numero_documento', formData.numero_documento)
        .maybeSingle()

      if (existingError) throw existingError

      if (existing) {
        toast.warning('Ya existe un acudiente con ese número de documento.')
        return
      }

      const { error } = await supabase
        .from('acudientes')
        .insert([{
          ...formData,
          guarderia_id: user.guarderia_id
        }])

      if (error) throw error

      toast.success('Acudiente creado correctamente.')
    } else {
  // Validar duplicado en otro acudiente
  const { data: existing, error: existingError } = await supabase
    .from('acudientes')
    .select('id')
    .eq('numero_documento', formData.numero_documento)
    .neq('id', editingGuardian.id)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) {
    toast.warning('Ya existe un acudiente con ese número de documento.')
    return
  }

  const { error } = await supabase
    .from('acudientes')
    .update({
      nombres: formData.nombres,
      apellidos: formData.apellidos,
      tipo_documento: formData.tipo_documento,
      numero_documento: formData.numero_documento,
      telefono1: formData.telefono1,
      telefono2: formData.telefono2,
      email: formData.email,
      direccion: formData.direccion
    })
    .eq('id', editingGuardian.id)

  if (error) throw error

  toast.success('Acudiente actualizado correctamente.')
}


    await fetchGuardians()
    resetForm()

  } catch (error) {
    toast.error('Ocurrió un error al guardar el acudiente.')
  }
}

  

  const handleDelete = async (id: string) => {
  const confirmDeletion = async () => {
    try {
      const { error } = await supabase.from('acudientes').delete().eq('id', id)
      if (error) throw error
      await fetchGuardians()
      toast.success('Acudiente eliminado correctamente.')
    } catch (error) {
      console.error('Error deleting guardian:', error)
      toast.error('Ocurrió un error al eliminar el acudiente.')
    }
  }

  toast.warning('¿Estás seguro de eliminar este acudiente? Esto también eliminará todas sus relaciones con los niños.', {
    action: {
      label: 'Eliminar',
      onClick: confirmDeletion,
    },
  })
}



  const handleEdit = (guardian: Acudiente) => {
    setEditingGuardian(guardian)
    setFormData({
      nombres: guardian.nombres,
      apellidos: guardian.apellidos,
      tipo_documento: guardian.tipo_documento,
      numero_documento: guardian.numero_documento,
      telefono1: guardian.telefono1 || '',
      telefono2: guardian.telefono2 || '',
      email: guardian.email || '',
      direccion: guardian.direccion || ''
    })
    setShowCreateForm(true)
  }

  const resetForm = () => {
    setFormData({
      nombres: '',
      apellidos: '',
      tipo_documento: 'CC',
      numero_documento: '',
      telefono1: '',
      telefono2: '',
      email: '',
      direccion: ''
    })
    setEditingGuardian(null)
    setShowCreateForm(false)
  }

  const openLinkForm = async (guardian: Acudiente) => {
    setSelectedGuardian(guardian)
    setChildSearchTerm('')
    
    // Cargar relaciones existentes
    const existingChildren = await fetchChildrenForGuardian(guardian.id)
    const existingRelations = existingChildren.map(child => ({
      childId: child.id,
      parentesco: child.parentesco
    }))
    
    setSelectedChildrenWithParentesco(existingRelations)
    setInitialChildrenWithParentesco(existingRelations)
    setShowLinkForm(true)
  }

  const handleChildSelection = (childId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedChildrenWithParentesco(prev => [
        ...prev,
        { childId, parentesco: 'Madre' }
      ])
    } else {
      setSelectedChildrenWithParentesco(prev => 
        prev.filter(item => item.childId !== childId)
      )
    }
  }

  const handleParentescoChange = (childId: string, parentesco: TipoParentesco) => {
    setSelectedChildrenWithParentesco(prev =>
      prev.map(item =>
        item.childId === childId ? { ...item, parentesco } : item
      )
    )
  }

const handleLinkChildren = async () => {
  if (!selectedGuardian) return

  try {
    const relationships = selectedChildrenWithParentesco.map(item => ({
      nino_id: item.childId,
      acudiente_id: selectedGuardian.id,
      parentesco: item.parentesco
    }))

    const initialIds = initialChildrenWithParentesco.map(item => item.childId)
    const selectedIds = selectedChildrenWithParentesco.map(item => item.childId)
    const idsToDelete = initialIds.filter(id => !selectedIds.includes(id))

    if (relationships.length > 0) {
      const { error } = await supabase
        .from('nino_acudiente')
        .upsert(relationships, {
          onConflict: 'nino_id,acudiente_id'
        })

      if (error) throw error
    }

    if (idsToDelete.length > 0) {
      const { error } = await supabase
        .from('nino_acudiente')
        .delete()
        .eq('acudiente_id', selectedGuardian.id)
        .in('nino_id', idsToDelete)

      if (error) throw error
    }

    setShowLinkForm(false)
    setSelectedGuardian(null)
    setSelectedChildrenWithParentesco([])
    setInitialChildrenWithParentesco([])
    setChildSearchTerm('')
  } catch (error) {
    console.error('Error linking children:', error)
  }
}


  const filteredChildren = children.filter(child =>
    `${child.nombres} ${child.apellidos}`.toLowerCase().includes(childSearchTerm.toLowerCase()) ||
    child.numero_documento.includes(childSearchTerm)
  )

  const getParentescoColor = (parentesco: TipoParentesco) => {
    const colors = {
      'Madre': 'bg-pink-100 text-pink-800',
      'Padre': 'bg-blue-100 text-blue-800',
      'Hermano': 'bg-green-100 text-green-800',
      'Hermana': 'bg-purple-100 text-purple-800',
      'Tío': 'bg-orange-100 text-orange-800',
      'Tía': 'bg-yellow-100 text-yellow-800',
      'Abuelo': 'bg-gray-100 text-gray-800',
      'Abuela': 'bg-indigo-100 text-indigo-800',
      'Tutor Legal': 'bg-red-100 text-red-800',
      'Otro': 'bg-slate-100 text-slate-800'
    }
    return colors[parentesco] || 'bg-gray-100 text-gray-800'
  }

  const generateAndDownloadQR = async (guardian: Acudiente) => {
    try {
      setGeneratingQR(guardian.id)
      
      // Generar el código QR con el número de documento
      const qrDataURL = await QRCode.toDataURL(guardian.numero_documento, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      
      // Crear un canvas para agregar información adicional
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('No se pudo crear el contexto del canvas')
      }
      
      // Configurar el tamaño del canvas (QR + espacio para texto)
      canvas.width = 600
      canvas.height = 700
      
      // Fondo blanco
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Cargar y dibujar el QR
      const qrImage = new Image()
      qrImage.onload = () => {
        // Dibujar el QR centrado
        const qrSize = 400
        const qrX = (canvas.width - qrSize) / 2
        const qrY = 50
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
        
        // Configurar fuente para el texto
        ctx.fillStyle = '#000000'
        ctx.textAlign = 'center'
        
        // Título
        ctx.font = 'bold 24px Arial'
        ctx.fillText('Código QR - Acudiente', canvas.width / 2, 30)
        
        // Nombre del acudiente
        ctx.font = 'bold 20px Arial'
        ctx.fillText(`${guardian.nombres} ${guardian.apellidos}`, canvas.width / 2, qrY + qrSize + 40)
        
        // Número de documento
        ctx.font = '18px Arial'
        ctx.fillText(`${guardian.tipo_documento}: ${guardian.numero_documento}`, canvas.width / 2, qrY + qrSize + 70)
        
        // Instrucciones
        ctx.font = '14px Arial'
        ctx.fillStyle = '#666666'
        ctx.fillText('Escanee este código para registro rápido de asistencia', canvas.width / 2, qrY + qrSize + 100)
        
        // Convertir canvas a blob y descargar
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `QR_${guardian.nombres}_${guardian.apellidos}_${guardian.numero_documento}.jpg`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }
          setGeneratingQR(null)
        }, 'image/jpeg', 0.9)
      }
      
      qrImage.src = qrDataURL
      
    } catch (error) {
       toast.error('Error al generar el código QR. Por favor, inténtelo de nuevo.')
      setGeneratingQR(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Acudientes</h1>
          <p className="text-gray-600 mt-1">Administra la información de los acudientes y sus relaciones familiares</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-mint-600 hover:bg-mint-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Acudiente
        </button>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingGuardian ? 'Editar Acudiente' : 'Nuevo Acudiente'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nombres}
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.apellidos}
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      value={formData.tipo_documento}
                      onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    >
                      <option value="CC">Cédula de Ciudadanía</option>
                      <option value="CE">Cédula de Extranjería</option>
                      <option value="PA">Pasaporte</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.numero_documento}
                      onChange={(e) => setFormData({ ...formData, numero_documento: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono Principal
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono1}
                      onChange={(e) => setFormData({ ...formData, telefono1: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono Secundario
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono2}
                      onChange={(e) => setFormData({ ...formData, telefono2: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    className="bg-mint-600 hover:bg-mint-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {editingGuardian ? 'Actualizar' : 'Crear'} Acudiente
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Link Children Form Modal */}
      {showLinkForm && selectedGuardian && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                Asignar Niños a {selectedGuardian.nombres} {selectedGuardian.apellidos}
              </h2>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Buscar niños por nombre o documento..."
                  value={childSearchTerm}
                  onChange={(e) => setChildSearchTerm(e.target.value)}
                 className="px-3 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-mint-500 focus:outline-none"

                />
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredChildren.length > 0 ? (
                  filteredChildren.map((child) => {
                    const isSelected = selectedChildrenWithParentesco.some(item => item.childId === child.id)
                    const currentParentesco = selectedChildrenWithParentesco.find(item => item.childId === child.id)?.parentesco || 'Madre'
                    
                    return (
                      <div key={child.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleChildSelection(child.id, e.target.checked)}
                            className="mt-1 h-4 w-4 text-mint-600 focus:ring-mint-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {child.nombres} {child.apellidos}
                            </div>
                            <div className="text-sm text-gray-500">
                              {child.tipo_documento}: {child.numero_documento}
                            </div>
                            {child.aula && (
                              <div className="text-sm text-gray-500">
                                {child.aula.nombre_aula} - {child.aula.nivel_educativo}
                              </div>
                            )}
                            
                            {isSelected && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Tipo de parentesco:
                                </label>
                                <select
                                  value={currentParentesco}
                                  onChange={(e) => handleParentescoChange(child.id, e.target.value as TipoParentesco)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-transparent text-sm"
                                >
                                  {parentescoOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No se encontraron niños</p>
                  </div>
                )}
              </div>
              
              {selectedChildrenWithParentesco.length > 0 && (
                <div className="mt-4 p-3 bg-mint-50 rounded-lg border border-mint-200">
                  <p className="text-sm text-mint-700 font-medium mb-2">
                    {selectedChildrenWithParentesco.length} niño(s) seleccionado(s):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedChildrenWithParentesco.map(item => {
                      const child = children.find(c => c.id === item.childId)
                      return child ? (
                        <span key={item.childId} className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getParentescoColor(item.parentesco)}`}>
                          {child.nombres} - {item.parentesco}
                        </span>
                      ) : null
                    })}
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleLinkChildren}
                  disabled={selectedChildrenWithParentesco.length === 0 && initialChildrenWithParentesco.length === 0}
                  className="bg-mint-600 hover:bg-mint-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Asignar Niños
                </button>
                <button
                  onClick={() => {
                    setShowLinkForm(false)
                    setSelectedGuardian(null)
                    setSelectedChildrenWithParentesco([])
                    setChildSearchTerm('')
                    setShowLinkForm(false)
                    setSelectedGuardian(null)
                    setSelectedChildrenWithParentesco([])
                    setInitialChildrenWithParentesco([])
                    setChildSearchTerm('')
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
    <Users className="w-5 h-5 text-mint-600" />
    Acudientes registrados ({totalCount})
  </h3>
  <input
    type="text"
    placeholder="Buscar por nombre o documento..."

    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value)
      setCurrentPage(1)
    }}

    className="px-3 py-2 border border-gray-300 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-mint-500 focus:outline-none"
  />
</div>

        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Nombre</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Documento</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Contacto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Dirección</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guardians.map((guardian) => (


                <tr key={guardian.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {guardian.nombres} {guardian.apellidos}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {guardian.tipo_documento}: {guardian.numero_documento}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      {guardian.telefono1 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {guardian.telefono1}
                        </div>
                      )}
                      {guardian.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {guardian.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {guardian.direccion && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-32">{guardian.direccion}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateAndDownloadQR(guardian)}
                        disabled={generatingQR === guardian.id}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generar código QR"
                      >
                        {generatingQR === guardian.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openLinkForm(guardian)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Asignar niños"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(guardian)}
                        className="p-1 text-mint-600 hover:bg-mint-50 rounded"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(guardian.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Anterior
              </button>

              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-mint-600 text-white' : ''}`}
                  >
                    {page}
                  </button>
                )
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50">
                Siguiente
              </button>
            </div>

        </div>
      </div>
    </div>
  )
}