/*
  # Crear tabla de aulas

  1. Nueva tabla
    - `aulas` - Aulas o salones de clase
      - `id` (uuid, primary key)
      - `nombre_aula` (text) - Nombre del aula (ej: "Aula Girasoles")
      - `nivel_educativo` (text) - Nivel educativo (Maternal, Prejardín, etc.)
      - `numero_aula` (text) - Número o código del aula
      - `capacidad` (integer) - Capacidad máxima de niños
      - `profesor_asignado_id` (uuid, foreign key) - Profesor asignado al aula
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `aulas`
    - Políticas para que usuarios autenticados puedan leer aulas
    - Solo administradores pueden crear/editar/eliminar aulas
*/

-- Crear tabla de aulas
CREATE TABLE IF NOT EXISTS aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_aula text NOT NULL,
  nivel_educativo text NOT NULL,
  numero_aula text NOT NULL,
  capacidad integer NOT NULL DEFAULT 20,
  profesor_asignado_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_aulas_profesor ON aulas(profesor_asignado_id);
CREATE INDEX IF NOT EXISTS idx_aulas_nivel ON aulas(nivel_educativo);

-- Habilitar RLS
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan leer aulas
CREATE POLICY "Authenticated users can read aulas"
  ON aulas
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para que administradores puedan insertar aulas
CREATE POLICY "Admins can insert aulas"
  ON aulas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan actualizar aulas
CREATE POLICY "Admins can update aulas"
  ON aulas
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan eliminar aulas
CREATE POLICY "Admins can delete aulas"
  ON aulas
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );