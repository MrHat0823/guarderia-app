/*
  # Crear tabla de relación niño-acudiente

  1. Nueva tabla
    - `nino_acudiente` - Relación muchos a muchos entre niños y acudientes
      - `id` (uuid, primary key)
      - `nino_id` (uuid, foreign key) - Referencia al niño
      - `acudiente_id` (uuid, foreign key) - Referencia al acudiente
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `nino_acudiente`
    - Políticas para que usuarios autenticados puedan leer relaciones
    - Solo administradores pueden crear/editar/eliminar relaciones

  3. Restricciones
    - Combinación única de nino_id y acudiente_id
*/

-- Crear tabla de relación niño-acudiente
CREATE TABLE IF NOT EXISTS nino_acudiente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nino_id uuid NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  acudiente_id uuid NOT NULL REFERENCES acudientes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(nino_id, acudiente_id)
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_nino_acudiente_nino ON nino_acudiente(nino_id);
CREATE INDEX IF NOT EXISTS idx_nino_acudiente_acudiente ON nino_acudiente(acudiente_id);

-- Habilitar RLS
ALTER TABLE nino_acudiente ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan leer relaciones
CREATE POLICY "Authenticated users can read nino_acudiente"
  ON nino_acudiente
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para que administradores puedan insertar relaciones
CREATE POLICY "Admins can insert nino_acudiente"
  ON nino_acudiente
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan actualizar relaciones
CREATE POLICY "Admins can update nino_acudiente"
  ON nino_acudiente
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan eliminar relaciones
CREATE POLICY "Admins can delete nino_acudiente"
  ON nino_acudiente
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );