/*
  # Crear tabla de acudientes

  1. Nueva tabla
    - `acudientes` - Información de los acudientes/padres
      - `id` (uuid, primary key)
      - `nombres` (text) - Nombres del acudiente
      - `apellidos` (text) - Apellidos del acudiente
      - `tipo_documento` (text) - Tipo de documento (CC, CE, PA)
      - `numero_documento` (text, unique) - Número de documento
      - `telefono1` (text, optional) - Teléfono principal
      - `telefono2` (text, optional) - Teléfono secundario
      - `email` (text, optional) - Correo electrónico
      - `direccion` (text, optional) - Dirección de residencia
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `acudientes`
    - Políticas para que usuarios autenticados puedan leer acudientes
    - Solo administradores pueden crear/editar/eliminar acudientes
*/

-- Crear tabla de acudientes
CREATE TABLE IF NOT EXISTS acudientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'CC',
  numero_documento text UNIQUE NOT NULL,
  telefono1 text,
  telefono2 text,
  email text,
  direccion text,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_acudientes_documento ON acudientes(numero_documento);
CREATE INDEX IF NOT EXISTS idx_acudientes_email ON acudientes(email);

-- Habilitar RLS
ALTER TABLE acudientes ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan leer acudientes
CREATE POLICY "Authenticated users can read acudientes"
  ON acudientes
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para que administradores puedan insertar acudientes
CREATE POLICY "Admins can insert acudientes"
  ON acudientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan actualizar acudientes
CREATE POLICY "Admins can update acudientes"
  ON acudientes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan eliminar acudientes
CREATE POLICY "Admins can delete acudientes"
  ON acudientes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );