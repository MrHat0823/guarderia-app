/*
  # Crear tabla de registros de asistencia

  1. Nueva tabla
    - `registros_asistencia` - Registros de entrada y salida de niños
      - `id` (uuid, primary key)
      - `fecha` (date) - Fecha del registro
      - `hora` (time) - Hora del registro
      - `tipo` (enum) - Tipo de registro (entrada, salida)
      - `nino_id` (uuid, foreign key) - Niño que registra
      - `acudiente_id` (uuid, foreign key) - Acudiente que lo trae/recoge
      - `usuario_registra_id` (uuid, foreign key) - Usuario que registra
      - `anotacion` (text, optional) - Observaciones adicionales
      - `created_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla `registros_asistencia`
    - Políticas para que usuarios autenticados puedan leer registros
    - Todos los usuarios autenticados pueden insertar registros
    - Solo administradores pueden editar/eliminar registros

  3. Funciones automáticas
    - Función para establecer fecha y hora automáticamente
*/

-- Crear enum para tipo de asistencia
CREATE TYPE attendance_type AS ENUM ('entrada', 'salida');

-- Crear tabla de registros de asistencia
CREATE TABLE IF NOT EXISTS registros_asistencia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  hora time NOT NULL DEFAULT CURRENT_TIME,
  tipo attendance_type NOT NULL,
  nino_id uuid NOT NULL REFERENCES ninos(id) ON DELETE CASCADE,
  acudiente_id uuid NOT NULL REFERENCES acudientes(id) ON DELETE CASCADE,
  usuario_registra_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anotacion text,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_registros_fecha ON registros_asistencia(fecha);
CREATE INDEX IF NOT EXISTS idx_registros_nino ON registros_asistencia(nino_id);
CREATE INDEX IF NOT EXISTS idx_registros_acudiente ON registros_asistencia(acudiente_id);
CREATE INDEX IF NOT EXISTS idx_registros_usuario ON registros_asistencia(usuario_registra_id);
CREATE INDEX IF NOT EXISTS idx_registros_tipo ON registros_asistencia(tipo);

-- Habilitar RLS
ALTER TABLE registros_asistencia ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios autenticados puedan leer registros
CREATE POLICY "Authenticated users can read registros_asistencia"
  ON registros_asistencia
  FOR SELECT
  TO authenticated
  USING (true);

-- Política para que usuarios autenticados puedan insertar registros
CREATE POLICY "Authenticated users can insert registros_asistencia"
  ON registros_asistencia
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para que administradores puedan actualizar registros
CREATE POLICY "Admins can update registros_asistencia"
  ON registros_asistencia
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para que administradores puedan eliminar registros
CREATE POLICY "Admins can delete registros_asistencia"
  ON registros_asistencia
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );