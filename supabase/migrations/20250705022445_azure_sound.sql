/*
  # Crear tabla de niños

  1. Nueva tabla
    - `ninos` - Información de los niños
      - `id` (uuid, primary key)
      - `nombres` (text) - Nombres del niño
      - `apellidos` (text) - Apellidos del niño
      - `tipo_documento` (text) - Tipo de documento (TI, RC, CC)
      - `numero_documento` (text, unique) - Número de documento
      - `aula_id` (uuid, foreign key) - Aula asignada
      - `activo` (boolean) - Si el niño está activo en el sistema
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `ninos`
    - Políticas para que usuarios autenticados puedan leer niños
    - Solo administradores pueden crear/editar/eliminar niños
*/

-- Crear tabla de niños
CREATE TABLE IF NOT EXISTS ninos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  apellidos text NOT NULL,
  tipo_documento text NOT NULL DEFAULT 'TI',
  numero_documento text UNIQUE NOT NULL,
  aula_id uuid REFERENCES aulas(id) ON DELETE SET NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ninos_aula ON ninos(aula_id);
CREATE INDEX IF NOT EXISTS idx_ninos_activo ON ninos(activo);
CREATE INDEX IF NOT EXISTS idx_ninos_documento ON ninos(numero_documento);

-- Habilitar RLS
ALTER TABLE ninos ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan leer niños
CREATE POLICY "Authenticated users can read ninos"
  ON ninos
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para que administradores puedan insertar niños
CREATE POLICY "Admins can insert ninos"
  ON ninos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan actualizar niños
CREATE POLICY "Admins can update ninos"
  ON ninos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan eliminar niños
CREATE POLICY "Admins can delete ninos"
  ON ninos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );