/*
  # Crear tabla de configuración de la guardería

  1. Nueva tabla
    - `configuracion_guarderia`
      - `id` (uuid, primary key)
      - `nombre_guarderia` (text, nombre de la guardería)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla
    - Políticas para que solo administradores puedan modificar
    - Todos pueden leer la configuración

  3. Datos iniciales
    - Insertar configuración por defecto
*/

-- Crear tabla de configuración
CREATE TABLE IF NOT EXISTS configuracion_guarderia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_guarderia text NOT NULL DEFAULT 'Guardería Infantil',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE configuracion_guarderia ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos pueden leer)
CREATE POLICY "Todos pueden leer configuracion"
  ON configuracion_guarderia
  FOR SELECT
  TO public
  USING (true);

-- Política para inserción (solo administradores)
CREATE POLICY "Solo admins pueden insertar configuracion"
  ON configuracion_guarderia
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND rol = 'admin'
    )
  );

-- Política para actualización (solo administradores)
CREATE POLICY "Solo admins pueden actualizar configuracion"
  ON configuracion_guarderia
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND rol = 'admin'
    )
  );

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_configuracion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_configuracion_updated_at
  BEFORE UPDATE ON configuracion_guarderia
  FOR EACH ROW
  EXECUTE FUNCTION update_configuracion_updated_at();

-- Insertar configuración por defecto
INSERT INTO configuracion_guarderia (nombre_guarderia)
VALUES ('Guardería Infantil')
ON CONFLICT DO NOTHING;

-- Crear índice para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_configuracion_guarderia_updated_at 
ON configuracion_guarderia(updated_at DESC);