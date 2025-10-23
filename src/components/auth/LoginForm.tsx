import { z } from 'zod'

const loginSchema = z.object({
  documento: z.string()
    .regex(/^\d+$/, 'El documento debe contener solo números')
    .min(5, 'El documento debe tener al menos 5 dígitos'),
  password: z.string()
    .length(6, 'La contraseña debe tener exactamente 6 dígitos')
    .regex(/^\d+$/, 'La contraseña solo debe contener números'),
})


import React, { useState } from 'react'
import { LogIn, Baby, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDaycareConfig } from '../../hooks/useDaycareConfig'

export function LoginForm() {
  const { daycareNombre } = useDaycareConfig()
  const [documento, setDocumento] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  const result = loginSchema.safeParse({ documento, password })

  if (!result.success) {
    const errores = result.error.flatten().fieldErrors
    const mensaje = errores.documento?.[0] || errores.password?.[0] || 'Datos inválidos'
    setError(mensaje)
    return
  }

  setLoading(true)

  try {
    await signIn(documento.trim(), password.trim())

    // Reset form
    setDocumento('')
    setPassword('')
    setTimeout(() => window.location.reload(), 500)

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    setLoading(false)
  }
}

  // 🔒 Función de login rápido — desactivada temporalmente para producción

/* const handleQuickLogin = async (doc: string, pass: string) => {
  setError('')

  const result = loginSchema.safeParse({ documento: doc, password: pass })

  if (!result.success) {
    const errores = result.error.flatten().fieldErrors
    const mensaje = errores.documento?.[0] || errores.password?.[0] || 'Datos inválidos'
    setError(mensaje)
    return
  }

  setDocumento(doc)
  setPassword(pass)

  setLoading(true)

  try {
    await signIn(doc.trim(), pass.trim())

    setTimeout(() => {
      window.location.reload()
    }, 500)

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    setLoading(false)
  }
} */


  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 to-sky-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-mint-100 rounded-full mb-4">
            <Baby className="w-8 h-8 text-mint-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {daycareNombre}
          </h1>
          <p className="text-gray-600">
            Sistema de gestión y control de asistencia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-2">
              Número de documento
            </label>
            <input
              id="documento"
              type="text"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
              placeholder="Ingrese su número de documento"
              required
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña (6 dígitos)
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mint-500 focus:border-mint-500 transition-colors"
                placeholder="••••••"
                required
                disabled={loading}
                maxLength={6}
                pattern="[0-9]{6}"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !documento.trim() || !password.trim()}
            className="w-full bg-mint-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-mint-700 focus:ring-2 focus:ring-mint-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar sesión
              </>
            )}
          </button>
        </form>

       
      </div>
    </div>
  )
}